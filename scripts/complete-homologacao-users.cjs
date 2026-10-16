#!/usr/bin/env node
'use strict';

// Only the Users/UserCompanies subset of PR #1. Never bootstraps Nest or the full seed.
const { validate } = require('./reset-homologacao-passwords.cjs');
const { errorReason } = require('./diagnose-homologacao-passwords.cjs');
const DATABASE = 'sellou_homologacao';
const HOST = 'dpg-db4ko6vavr4c73fkjdag-a';
const USERS = [
  { email: 'admin@sellou-homologacao.example', name: 'Administrador Ficticio Homologacao', role: 'ADMINISTRATOR', position: 'Administrador de homologacao' },
  { email: 'gerente@sellou-homologacao.example', name: 'Gerente Fictício', role: 'REGIONAL_MANAGER', position: 'Gerente' },
  { email: 'representante1@sellou-homologacao.example', name: 'Representante Fictício 1', role: 'SALES_REP', position: 'Representante Comercial' },
  { email: 'representante2@sellou-homologacao.example', name: 'Representante Fictício 2', role: 'SALES_REP', position: 'Representante Comercial' },
  { email: 'interno1@sellou-homologacao.example', name: 'Vendedor Interno Fictício 1', role: 'SALES_REP', position: 'Vendedor Interno' },
  { email: 'interno2@sellou-homologacao.example', name: 'Vendedor Interno Fictício 2', role: 'SALES_REP', position: 'Vendedor Interno' },
];
const EMAILS = USERS.map(user => user.email);
class ValidationFailure extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}
const check = (ok, reason) => { if (!ok) throw new ValidationFailure(reason); };

function validateEnvironment(env) {
  validate(env); // Same pinned host, dedicated database/user, TLS and password requirements.
  check(env.SEED_HOMOLOGACAO === 'false', 'disable_full_seed');
  check(env.RESET_HOMOLOG_PASSWORDS_ONCE === 'false', 'disable_password_reset');
}

async function complete(client, password, bcrypt, { verifyOnly = false } = {}) {
  let stage = 'transaction';
  await client.query(verifyOnly ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');
  try {
    if (!verifyOnly) {
      // Same lock as both seeds and the reset; timeout prevents an indefinite wait.
      await client.query("SET LOCAL lock_timeout = '10s'");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('sellou-homologacao-seed-v1'))");
    }
    stage = 'database_identity';
    const identity = (await client.query('SELECT current_database() AS db, current_user AS username')).rows[0];
    check(identity?.db === DATABASE && identity?.username === DATABASE, 'unexpected_database_identity');
    if (!verifyOnly) {
      // Protect preflight/insert/final verification against non-cooperating app writes.
      await client.query('LOCK TABLE public."Companies" IN SHARE MODE');
      await client.query('LOCK TABLE public."Users", public."UserCompanies" IN SHARE ROW EXCLUSIVE MODE');
    }
    stage = 'fictional_company';
    const companies = (await client.query('SELECT id, cnpj, "corporateName", "fantasyName", status FROM public."Companies"')).rows;
    check(companies.length === 1 && companies[0].cnpj === '00000000000000' && companies[0].fantasyName === 'sellou-homologacao' && companies[0].status === 'ACTIVE' && ['Sellou Homologação', 'Sellou Homologacao Ficticia'].includes(companies[0].corporateName), 'unexpected_fictional_company');
    const companyId = companies[0].id;
    async function inspect() {
      const users = (await client.query('SELECT id, email, "companyId", role, status, position FROM public."Users" WHERE email=ANY($1::text[]) ORDER BY id', [EMAILS])).rows;
      check(new Set(users.map(u => u.email)).size === users.length, 'duplicate_user');
      for (const row of users) {
        const expected = USERS.find(u => u.email === row.email);
        check(expected && row.companyId === companyId && row.role === expected.role && row.status === 'ACTIVE' && row.position === expected.position, 'existing_user_mismatch');
      }
      const memberships = (await client.query('SELECT "userId", "companyId", role, status, position FROM public."UserCompanies" WHERE "userId"=ANY($1::integer[])', [users.map(u => u.id)])).rows;
      for (const user of users) {
        const expected = USERS.find(u => u.email === user.email);
        const links = memberships.filter(m => m.userId === user.id);
        check(links.length <= 1, 'duplicate_or_additional_membership');
        check(links.every(m => m.companyId === companyId && m.role === expected.role && m.status === 'ACTIVE' && m.position === expected.position), 'existing_membership_mismatch');
      }
      return { users, memberships };
    }
    stage = 'preflight_users_and_memberships';
    const before = await inspect(); // All conflicts are checked before the first insert.
    const counts = { users_created: 0, users_reused: before.users.length, memberships_created: 0, memberships_reused: before.memberships.length };
    if (verifyOnly) check(before.users.length === 6 && before.memberships.length === 6, 'verification_incomplete');
    for (let index = 0; index < USERS.length; index++) {
      const expected = USERS[index];
      let user = before.users.find(u => u.email === expected.email);
      if (!user) {
        check(!verifyOnly, 'verification_incomplete');
        stage = 'insert_missing_user';
        // Initial password for a NEW account only; existing hashes are never read or compared.
        const hash = await bcrypt.hash(password, 10);
        user = (await client.query('INSERT INTO public."Users" (name,email,password,role,status,position,"companyId","standardCommissionPercentage","createdAt","updatedAt") VALUES ($1,$2,$3,$4,\'ACTIVE\',$5,$6,$7,NOW(),NOW()) RETURNING id, email', [expected.name, expected.email, hash, expected.role, expected.position, companyId, index < 2 ? 0 : 3])).rows[0];
        counts.users_created++;
      }
      if (!before.memberships.some(m => m.userId === user.id)) {
        check(!verifyOnly, 'verification_incomplete');
        stage = 'insert_missing_membership';
        const inserted = await client.query('INSERT INTO public."UserCompanies" ("userId","companyId",role,status,position,"createdAt","updatedAt") VALUES ($1,$2,$3,\'ACTIVE\',$4,NOW(),NOW()) RETURNING id', [user.id, companyId, expected.role, expected.position]);
        check(inserted.rowCount === 1, 'membership_insert_count');
        counts.memberships_created++;
      }
    }
    stage = 'final_validation';
    const after = await inspect();
    check(after.users.length === 6 && after.memberships.length === 6, 'final_validation_incomplete');
    const result = { ...counts, six_users_exist: true, all_in_fictional_company: true, six_memberships_correct: true };
    stage = 'commit';
    await client.query(verifyOnly ? 'ROLLBACK' : 'COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    // Pass only controlled fields to the CLI; never attach the original error.
    throw { stage, reason: error instanceof ValidationFailure ? error.reason : errorReason(error) };
  }
}

async function main(env = process.env, dependencies = {}) {
  const log = value => console.log('HOMOLOG_USERS_COMPLETION ' + JSON.stringify(value));
  if (env.COMPLETE_HOMOLOG_USERS !== 'true') { log({ status: 'disabled' }); return 0; }
  try { validateEnvironment(env); }
  catch { log({ status: 'failed', stage: 'environment', reason: 'environment_guard_rejected' }); return 1; }
  let client;
  try {
    const Client = dependencies.Client || require('pg').Client;
    const bcrypt = dependencies.bcrypt || require('bcrypt');
    const tls = dependencies.databaseTlsOptions || require('../dist/src/utils/database-tls').databaseTlsOptions;
    client = new Client({ host: HOST, port: 5432, user: DATABASE, database: DATABASE, password: env.DB_PASSWORD,
      ...tls(env), connectionTimeoutMillis: 10000, statement_timeout: 60000, query_timeout: 65000,
      application_name: 'homologacao-users-completion' });
    client.on('error', () => {}); // Avoid unhandled driver error logs.
    try { await client.connect(); }
    catch (error) { log({ status: 'failed', stage: 'postgres_connection', reason: errorReason(error) }); return 1; }
    const first = await complete(client, env.HOMOLOG_ADMIN_PASSWORD, bcrypt);
    log({ status: 'committed', ...first });
    // Same algorithm, read-only: proves its next execution needs zero inserts.
    const second = await complete(client, env.HOMOLOG_ADMIN_PASSWORD, bcrypt, { verifyOnly: true });
    log({ status: 'verified', ...second, idempotent_no_inserts: second.users_created === 0 && second.memberships_created === 0 });
    return 0;
  } catch (error) {
    // Whitelist stage/reason rather than serializing arbitrary dependency errors.
    const stages = ['transaction','database_identity','fictional_company','preflight_users_and_memberships','insert_missing_user','insert_missing_membership','final_validation','commit'];
    const reasons = ['unexpected_database_identity','unexpected_fictional_company','duplicate_user','existing_user_mismatch','duplicate_or_additional_membership','existing_membership_mismatch','verification_incomplete','membership_insert_count','final_validation_incomplete'];
    log({ status: 'failed', stage: stages.includes(error?.stage) ? error.stage : 'runtime', reason: reasons.includes(error?.reason) ? error.reason : 'database_or_runtime_error' });
    return 1;
  } finally { if (client) await client.end().catch(() => {}); }
}

module.exports = { USERS, complete, validateEnvironment, main };
if (require.main === module) main().then(code => { process.exitCode = code; });

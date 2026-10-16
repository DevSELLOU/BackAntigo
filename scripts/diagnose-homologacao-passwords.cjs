#!/usr/bin/env node
'use strict';

// Never invokes reset(), the seed, dotenv or the application bootstrap.
const { validate, EMAILS, OPERATION } = require('./reset-homologacao-passwords.cjs');
const HOST = 'dpg-db4ko6vavr4c73fkjdag-a';
const DATABASE = 'sellou_homologacao';
const STAGES = ['environment', 'postgres_connection', 'database_identity', 'operation_marker', 'fictional_company', 'six_users', 'user_companies'];

function environmentChecks(env) {
  const password = env.HOMOLOG_ADMIN_PASSWORD;
  return {
    APP_ENV: env.APP_ENV === 'homologacao',
    NODE_ENV: env.NODE_ENV === 'production',
    DB_HOST: env.DB_HOST === HOST,
    DB_DATABASE: env.DB_DATABASE === DATABASE,
    DB_USERNAME: env.DB_USERNAME === DATABASE,
    DB_PORT: !env.DB_PORT || env.DB_PORT === '5432',
    DB_TLS: env.DB_TLS === 'true',
    DB_TLS_REJECT_UNAUTHORIZED: ['true', 'false', undefined].includes(env.DB_TLS_REJECT_UNAUTHORIZED),
    DB_PASSWORD: Boolean(env.DB_PASSWORD),
    SEED_HOMOLOGACAO: env.SEED_HOMOLOGACAO !== 'true',
    // Diagnostic runs regardless of this flag, but requires reset to remain disabled.
    RESET_HOMOLOG_PASSWORDS_ONCE: !env.RESET_HOMOLOG_PASSWORDS_ONCE || env.RESET_HOMOLOG_PASSWORDS_ONCE === 'false',
    HOMOLOG_ADMIN_PASSWORD: typeof password === 'string' && password.length >= 12 && Buffer.byteLength(password) <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password),
  };
}

// Only predefined labels reach stdout. Never return error.message/detail/stack/code.
function errorReason(error) {
  const reasons = { '28P01': 'authentication_rejected', '28000': 'authorization_rejected',
    '3D000': 'database_unavailable', '42501': 'permission_denied', '42P01': 'table_missing',
    '42703': 'column_missing', '57014': 'query_timeout', ECONNREFUSED: 'connection_refused',
    ENOTFOUND: 'dns_failed', EAI_AGAIN: 'dns_failed', ETIMEDOUT: 'connection_timeout',
    ECONNRESET: 'connection_closed', DEPTH_ZERO_SELF_SIGNED_CERT: 'tls_certificate_rejected',
    SELF_SIGNED_CERT_IN_CHAIN: 'tls_certificate_rejected', CERT_HAS_EXPIRED: 'tls_certificate_rejected',
    ERR_TLS_CERT_ALTNAME_INVALID: 'tls_certificate_rejected', UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'tls_certificate_rejected',
  };
  return Object.hasOwn(reasons, error?.code) ? reasons[error.code] : 'unclassified_error';
}

async function diagnose(env = process.env, dependencies = {}) {
  const results = Object.fromEntries(STAGES.map(stage => [stage, { status: 'not_checked' }]));
  const report = () => ({ mode: 'read_only', ...results });
  const checks = environmentChecks(env);
  results.environment = { status: Object.values(checks).every(Boolean) ? 'ok' : 'failed', checks };
  if (results.environment.status === 'failed') return report();
  // Reuse original guard as an additional protection against future drift.
  try { validate(env); } catch { results.environment = { status: 'failed', checks, reason: 'reset_guard_rejected' }; return report(); }
  let client;
  try {
    const Client = dependencies.Client || require('pg').Client;
    const tls = dependencies.databaseTlsOptions || require('../dist/src/utils/database-tls').databaseTlsOptions;
    client = new Client({ host: HOST, port: 5432, database: DATABASE, user: DATABASE,
      password: env.DB_PASSWORD, ...tls(env), connectionTimeoutMillis: 10000,
      statement_timeout: 15000, query_timeout: 20000, application_name: 'homologacao-password-diagnostic' });
    // pg otherwise prints an unhandled idle-client error, including driver details.
    client.on('error', () => { results.postgres_connection = { status: 'failed', reason: 'connection_closed' }; });
  } catch { results.postgres_connection = { status: 'failed', reason: 'driver_or_tls_setup_failed' }; return report(); }
  try {
    try {
      await client.connect();
      results.postgres_connection = { status: 'ok' };
    } catch (error) {
      results.postgres_connection = { status: 'failed', reason: errorReason(error) };
      return report();
    }
    try { await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'); }
    catch (error) { results.database_identity = { status: 'failed', reason: errorReason(error) }; return report(); }

    // Savepoints allow independent checks to continue after a missing table or denied SELECT.
    async function read(stage, action) {
      await client.query('SAVEPOINT diagnostic_check');
      try { await action(); }
      catch (error) {
        results[stage] = { status: 'failed', reason: errorReason(error) };
        await client.query('ROLLBACK TO SAVEPOINT diagnostic_check');
      }
      await client.query('RELEASE SAVEPOINT diagnostic_check');
    }
    await read('database_identity', async () => {
      const identity = (await client.query('SELECT current_database() AS db, current_user AS username')).rows[0];
      const databaseMatches = identity?.db === DATABASE;
      const userMatches = identity?.username === DATABASE;
      results.database_identity = { status: databaseMatches && userMatches ? 'ok' : 'failed', database_matches: databaseMatches, user_matches: userMatches };
    });
    if (results.database_identity.status !== 'ok') return report();

    await read('operation_marker', async () => {
      const table = (await client.query("SELECT to_regclass('public.homologacao_password_operations') IS NOT NULL AS present")).rows[0];
      if (!table.present) { results.operation_marker = { status: 'ok', state: 'table_absent_not_completed' }; return; }
      const done = await client.query('SELECT 1 FROM public.homologacao_password_operations WHERE operation=$1', [OPERATION]);
      results.operation_marker = { status: 'ok', state: done.rowCount ? 'already_completed_reset_will_skip' : 'not_completed' };
    });
    let companyId;
    await read('fictional_company', async () => {
      const companies = (await client.query('SELECT id, cnpj, "corporateName", "fantasyName" FROM public."Companies"')).rows;
      const countMatches = companies.length === 1;
      const company = companies[0];
      const matches = countMatches && company.cnpj === '00000000000000' && company.fantasyName === 'sellou-homologacao' && ['Sellou Homologação', 'Sellou Homologacao Ficticia'].includes(company.corporateName);
      results.fictional_company = { status: matches ? 'ok' : 'failed', reason: matches ? 'matches_seed' : countMatches ? 'seed_identity_mismatch' : 'expected_exactly_one_company' };
      if (matches) companyId = company.id;
    });
    let users;
    await read('six_users', async () => {
      users = (await client.query('SELECT id, email, "companyId" FROM public."Users" WHERE email = ANY($1::text[]) ORDER BY id', [EMAILS])).rows;
      const exist = users.length === 6 && new Set(users.map(u => u.email)).size === 6 && users.every(u => EMAILS.includes(u.email));
      const scoped = companyId !== undefined ? users.every(u => u.companyId === companyId) : null;
      results.six_users = { status: !exist || scoped === false ? 'failed' : scoped === null ? 'blocked' : 'ok', six_exist: exist, company_matches: scoped };
    });
    if (users && companyId !== undefined) await read('user_companies', async () => {
      const memberships = (await client.query('SELECT "userId", "companyId" FROM public."UserCompanies" WHERE "userId" = ANY($1::integer[])', [users.map(u => u.id)])).rows;
      const matches = users.length === 6 && memberships.length === 6 && users.every(u => memberships.filter(m => m.userId === u.id && m.companyId === companyId).length === 1);
      results.user_companies = { status: matches ? 'ok' : 'failed', reason: matches ? 'six_exact_memberships' : 'missing_duplicate_or_foreign_membership' };
    });
    else results.user_companies = { status: 'blocked', reason: 'company_or_users_unavailable' };
    return report();
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    await client.end().catch(() => {});
  }
}

async function main(env = process.env, dependencies = {}) {
  try {
    const result = await diagnose(env, dependencies);
    console.log('HOMOLOG_PASSWORD_DIAGNOSTIC ' + JSON.stringify(result));
    return Object.values(result).some(value => value && ['failed', 'blocked', 'not_checked'].includes(value.status)) ? 1 : 0;
  } catch {
    console.log('HOMOLOG_PASSWORD_DIAGNOSTIC {"mode":"read_only","status":"failed","reason":"diagnostic_internal_error"}');
    return 1;
  }
}
module.exports = { diagnose, main, environmentChecks, errorReason };
if (require.main === module) main().then(code => { process.exitCode = code; });

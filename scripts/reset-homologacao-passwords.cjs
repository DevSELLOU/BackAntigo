#!/usr/bin/env node
'use strict';

// Deliberately independent of Nest bootstrap, dotenv and the data seed.
const HOST = 'dpg-db4ko6vavr4c73fkjdag-a';
const DATABASE = 'sellou_homologacao';
const OPERATION = 'reset-six-test-passwords-v1';
const EMAILS = ['admin', 'gerente', 'representante1', 'representante2', 'interno1', 'interno2']
  .map(name => name + '@sellou-homologacao.example');
const check = (condition, message) => { if (!condition) throw new Error(message); };

function validate(env) {
  check(env.APP_ENV === 'homologacao' && env.NODE_ENV === 'production', 'Ambiente exclusivo de homologacao exigido');
  check(env.DB_HOST === HOST, 'Use somente o hostname interno do PostgreSQL de homologacao autorizado');
  check(env.DB_DATABASE === DATABASE && env.DB_USERNAME === DATABASE, 'Banco e usuario de homologacao exigidos');
  check(!env.DB_PORT || env.DB_PORT === '5432', 'Porta 5432 exigida');
  check(env.DB_TLS === 'true' && ['true', 'false', undefined].includes(env.DB_TLS_REJECT_UNAUTHORIZED), 'Configuracao TLS invalida');
  check(Boolean(env.DB_PASSWORD), 'DB_PASSWORD obrigatorio');
  check(env.SEED_HOMOLOGACAO !== 'true', 'Desative SEED_HOMOLOGACAO antes da redefinicao');
  const password = env.HOMOLOG_ADMIN_PASSWORD;
  check(typeof password === 'string' && password.length >= 12 && Buffer.byteLength(password) <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password), 'HOMOLOG_ADMIN_PASSWORD exige 12 a 72 bytes, maiuscula, minuscula, numero e simbolo');
}

async function reset(client, password, bcrypt) {
  await client.query('BEGIN');
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('sellou-homologacao-seed-v1'))");
    const identity = (await client.query('SELECT current_database() AS db, current_user AS username')).rows[0];
    check(identity.db === DATABASE && identity.username === DATABASE, 'Identidade real do banco inesperada');
    await client.query(`CREATE TABLE IF NOT EXISTS public.homologacao_password_operations (
      operation text PRIMARY KEY, completed_at timestamptz NOT NULL DEFAULT now(),
      affected_users integer NOT NULL CHECK (affected_users = 6)
    )`);
    const done = await client.query('SELECT 1 FROM public.homologacao_password_operations WHERE operation=$1', [OPERATION]);
    if (done.rowCount) {
      await client.query('COMMIT');
      return 'already-completed';
    }
    const companies = (await client.query('SELECT id, cnpj, "corporateName", "fantasyName" FROM public."Companies" FOR SHARE')).rows;
    check(companies.length === 1 && companies[0].cnpj === '00000000000000' && companies[0].fantasyName === 'sellou-homologacao' && ['Sellou Homologação', 'Sellou Homologacao Ficticia'].includes(companies[0].corporateName), 'Empresa ficticia exclusiva nao encontrada');
    const companyId = companies[0].id;
    const users = (await client.query('SELECT id, email, "companyId" FROM public."Users" WHERE email = ANY($1::text[]) ORDER BY id FOR UPDATE', [EMAILS])).rows;
    check(users.length === 6 && new Set(users.map(u => u.email)).size === 6 && users.every(u => EMAILS.includes(u.email) && u.companyId === companyId), 'Os seis usuarios devem existir e pertencer a empresa ficticia');
    const memberships = (await client.query('SELECT "userId", "companyId" FROM public."UserCompanies" WHERE "userId" = ANY($1::integer[]) FOR SHARE', [users.map(u => u.id)])).rows;
    check(memberships.length === 6 && users.every(u => memberships.filter(m => m.userId === u.id && m.companyId === companyId).length === 1), 'Vinculos de empresa inesperados');
    // Separate salted hashes, exactly the same algorithm/cost used by authentication.
    for (const user of users) {
      const hash = await bcrypt.hash(password, 10);
      const result = await client.query('UPDATE public."Users" SET password=$1, password_reset_token=NULL, password_reset_expires=NULL, "updatedAt"=NOW() WHERE id=$2 AND email=$3 AND "companyId"=$4 RETURNING id', [hash, user.id, user.email, companyId]);
      check(result.rowCount === 1, 'Contagem inesperada; rollback integral');
    }
    await client.query('INSERT INTO public.homologacao_password_operations (operation, affected_users) VALUES ($1, 6)', [OPERATION]);
    await client.query('COMMIT');
    return 'completed';
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function main(env = process.env) {
  if (env.RESET_HOMOLOG_PASSWORDS_ONCE !== 'true') {
    console.log('HOMOLOG_PASSWORD_RESET disabled');
    return;
  }
  validate(env); // Fail before loading drivers or opening a connection.
  const { Client } = require('pg');
  const bcrypt = require('bcrypt');
  const { databaseTlsOptions } = require('../dist/src/utils/database-tls');
  const client = new Client({ host: HOST, port: 5432, user: DATABASE, database: DATABASE,
    password: env.DB_PASSWORD, ...databaseTlsOptions(env), connectionTimeoutMillis: 10000,
    statement_timeout: 60000, query_timeout: 65000, application_name: 'homologacao-password-reset-once' });
  try {
    await client.connect();
    console.log('HOMOLOG_PASSWORD_RESET ' + await reset(client, env.HOMOLOG_ADMIN_PASSWORD, bcrypt));
  } finally { await client.end().catch(() => {}); }
}

module.exports = { validate, reset, main, EMAILS, OPERATION };
if (require.main === module) main().catch(() => {
  // Never print driver errors, SQL parameters, passwords, hashes or connection strings.
  console.error('HOMOLOG_PASSWORD_RESET failed; inicializacao interrompida. Confira ambiente, banco, TLS e os seis usuarios; nenhuma redefinicao parcial sera confirmada.');
  process.exitCode = 1;
});

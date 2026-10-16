'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { diagnose, main, errorReason } = require('./diagnose-homologacao-passwords.cjs');
const { EMAILS } = require('./reset-homologacao-passwords.cjs');
const SECRET = 'NeverLogThis!12345';
const env = { APP_ENV: 'homologacao', NODE_ENV: 'production', DB_HOST: 'dpg-db4ko6vavr4c73fkjdag-a', DB_DATABASE: 'sellou_homologacao', DB_USERNAME: 'sellou_homologacao', DB_TLS: 'true', DB_PASSWORD: SECRET, HOMOLOG_ADMIN_PASSWORD: SECRET, RESET_HOMOLOG_PASSWORDS_ONCE: 'false', SEED_HOMOLOGACAO: 'false' };

function fixture(options = {}) {
  const calls = [];
  const failure = () => { throw Object.assign(new Error('postgres://user:' + SECRET + '@host/db'), { code: options.code || SECRET, detail: SECRET, stack: SECRET }); };
  class Client {
    on() {}
    async connect() { if (options.connectError) failure(); }
    async end() { calls.push('END'); }
    async query(sql) {
      calls.push(sql);
      assert.ok(/^(SELECT|BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY|SAVEPOINT|ROLLBACK|RELEASE SAVEPOINT)/.test(sql), 'Unexpected SQL: ' + sql);
      assert.ok(!/FOR (UPDATE|SHARE)|SELECT \*|bcrypt/.test(sql));
      if (options.queryError && sql.includes(options.queryError)) failure();
      if (sql.includes('current_database')) return { rows: [{ db: options.wrongDatabase ? SECRET : env.DB_DATABASE, username: env.DB_USERNAME }] };
      if (sql.includes('to_regclass')) return { rows: [{ present: !options.noMarkerTable }] };
      if (sql.includes('FROM public.homologacao_password_operations')) return { rowCount: Number(Boolean(options.done)) };
      if (sql.includes('FROM public."Companies"')) return { rows: options.noCompany ? [] : [{ id: 7, cnpj: '00000000000000', corporateName: options.badCompany ? SECRET : 'Sellou Homologação', fantasyName: 'sellou-homologacao' }] };
      if (sql.includes('FROM public."Users"')) return { rows: EMAILS.slice(options.missingUser ? 1 : 0).map((email, i) => ({ id: i + 1, email, companyId: options.foreignUser ? 8 : 7 })) };
      if (sql.includes('FROM public."UserCompanies"')) return { rows: EMAILS.map((_, i) => ({ userId: i + 1, companyId: options.foreignMembership ? 8 : 7 })) };
      return { rows: [] };
    }
  }
  return { calls, dependencies: { Client, databaseTlsOptions: () => ({ ssl: true }) } };
}

test('all environment failures reported as booleans; no connection when unsafe or reset enabled', async () => {
  for (const [key, value] of Object.entries({ APP_ENV: 'production', NODE_ENV: 'development', DB_HOST: SECRET, DB_DATABASE: SECRET, DB_USERNAME: SECRET, DB_PORT: '5433', DB_TLS: 'false', DB_TLS_REJECT_UNAUTHORIZED: SECRET, DB_PASSWORD: '', HOMOLOG_ADMIN_PASSWORD: 'short', SEED_HOMOLOGACAO: 'true', RESET_HOMOLOG_PASSWORDS_ONCE: 'true' })) {
    const result = await diagnose({ ...env, [key]: value }, { Client: class { constructor() { assert.fail('Must not connect'); } } });
    assert.equal(result.environment.checks[key], false, key);
    assert.equal(result.environment.status, 'failed');
    assert.equal(result.postgres_connection.status, 'not_checked');
    assert.ok(!JSON.stringify(result).includes(SECRET));
  }
});

test('checks all stages read-only and distinguishes absent, pending and completed marker', async () => {
  for (const options of [{ noMarkerTable: true }, {}, { done: true }]) {
    const { dependencies, calls } = fixture(options);
    const result = await diagnose(env, dependencies);
    for (const [key, value] of Object.entries(result)) if (key !== 'mode') assert.equal(value.status, 'ok', key);
    assert.equal(result.operation_marker.state, options.noMarkerTable ? 'table_absent_not_completed' : options.done ? 'already_completed_reset_will_skip' : 'not_completed');
    assert.equal(calls[0], 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    assert.equal(calls.at(-2), 'ROLLBACK');
    assert.ok(!JSON.stringify(result).includes(SECRET));
  }
});

test('identifies each failed prerequisite and skips data reads for wrong actual identity', async () => {
  for (const [options, stage] of [[{ connectError: true }, 'postgres_connection'], [{ wrongDatabase: true }, 'database_identity'], [{ noCompany: true }, 'fictional_company'], [{ badCompany: true }, 'fictional_company'], [{ missingUser: true }, 'six_users'], [{ foreignUser: true }, 'six_users'], [{ foreignMembership: true }, 'user_companies']]) {
    const { dependencies, calls } = fixture(options);
    const result = await diagnose(env, dependencies);
    assert.equal(result[stage].status, 'failed');
    if (options.wrongDatabase) assert.ok(!calls.some(sql => sql.includes('FROM public.')));
    assert.ok(!JSON.stringify(result).includes(SECRET));
  }
});

test('query errors identify stage and allow independent checks; driver messages never escape', async () => {
  for (const [queryError, stage] of [['FROM public.homologacao_password_operations', 'operation_marker'], ['FROM public."Companies"', 'fictional_company'], ['FROM public."Users"', 'six_users'], ['FROM public."UserCompanies"', 'user_companies']]) {
    const { dependencies } = fixture({ queryError, code: '42501' });
    const result = await diagnose(env, dependencies);
    assert.equal(result[stage].reason, 'permission_denied');
    assert.ok(!JSON.stringify(result).includes(SECRET));
    if (stage === 'operation_marker') assert.equal(result.six_users.status, 'ok');
  }
  assert.equal(errorReason({ code: SECRET }), 'unclassified_error');
  assert.equal(errorReason({ code: '__proto__' }), 'unclassified_error');
});

test('actual CLI output redacts injected connection errors and database values', async () => {
  const original = console.log;
  const lines = [];
  console.log = line => lines.push(line);
  try {
    for (const options of [{ connectError: true }, { wrongDatabase: true }, { badCompany: true }, { queryError: 'FROM public."Users"' }]) {
      assert.equal(await main(env, fixture(options).dependencies), 1);
    }
  } finally { console.log = original; }
  assert.equal(lines.length, 4);
  assert.ok(lines.every(line => line.startsWith('HOMOLOG_PASSWORD_DIAGNOSTIC ')));
  assert.ok(!lines.join('\n').includes(SECRET));
  assert.ok(!lines.join('\n').includes('postgres://'));
});

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, reset, main, EMAILS } = require('./reset-homologacao-passwords.cjs');
const env = { APP_ENV: 'homologacao', NODE_ENV: 'production', DB_HOST: 'dpg-db4ko6vavr4c73fkjdag-a', DB_DATABASE: 'sellou_homologacao', DB_USERNAME: 'sellou_homologacao', DB_TLS: 'true', DB_PASSWORD: 'mock-db', HOMOLOG_ADMIN_PASSWORD: 'Ficticia!123456' };

test('requires dedicated environment, resource, credentials, TLS and disabled seed', () => {
  validate(env);
  for (const [key, value] of Object.entries({ APP_ENV: 'production', NODE_ENV: 'development', DB_HOST: 'other', DB_DATABASE: 'production', DB_USERNAME: 'postgres', DB_TLS: 'false', DB_TLS_REJECT_UNAUTHORIZED: 'invalid', DB_PORT: '5433', DB_PASSWORD: '', HOMOLOG_ADMIN_PASSWORD: 'short', SEED_HOMOLOGACAO: 'true' })) {
    assert.throws(() => validate({ ...env, [key]: value }), key);
  }
  assert.throws(() => validate({ ...env, HOMOLOG_ADMIN_PASSWORD: 'Aa1!' + 'é'.repeat(35) }));
});

test('disabled by default without requiring credentials or opening a connection', async () => {
  await main({});
  await main({ RESET_HOMOLOG_PASSWORDS_ONCE: 'false' });
});

// Transactional fake exercises orchestration/failure paths; not a PostgreSQL substitute.
function fake({ done = false, missing = false, foreign = false, identity = false, failAt = 0 } = {}) {
  const calls = []; let updates = 0; let marker = done;
  return { calls, async query(sql, params) {
    calls.push({ sql, params });
    if (sql.includes('current_database')) return { rows: [{ db: identity ? 'production' : env.DB_DATABASE, username: env.DB_USERNAME }] };
    if (sql.startsWith('SELECT 1')) return { rowCount: Number(marker) };
    if (sql.includes('FROM public."Companies"')) return { rows: [{ id: 7, cnpj: '00000000000000', corporateName: 'Sellou Homologação', fantasyName: 'sellou-homologacao' }] };
    if (sql.includes('FROM public."Users"')) return { rows: EMAILS.slice(missing ? 1 : 0).map((email, i) => ({ id: i + 1, email, companyId: foreign ? 8 : 7 })) };
    if (sql.includes('FROM public."UserCompanies"')) return { rows: EMAILS.map((_, i) => ({ userId: i + 1, companyId: 7 })) };
    if (sql.startsWith('UPDATE')) { updates++; if (updates === failAt) throw new Error('simulated failure'); return { rowCount: 1 }; }
    if (sql.startsWith('INSERT')) marker = true;
    return { rows: [], rowCount: 0 };
  } };
}
const bcrypt = { hash: async (password, cost) => { assert.equal(password, env.HOMOLOG_ADMIN_PASSWORD); assert.equal(cost, 10); return 'mock-hash'; } };

test('updates exactly six allowlisted users then records completion; rerun does not hash/update', async () => {
  const client = fake();
  assert.equal(await reset(client, env.HOMOLOG_ADMIN_PASSWORD, bcrypt), 'completed');
  const updates = client.calls.filter(c => c.sql.startsWith('UPDATE'));
  assert.equal(updates.length, 6);
  assert.deepEqual(updates.map(c => c.params[2]), EMAILS);
  assert.ok(updates.every(c => c.params[3] === 7 && c.sql.includes('password_reset_token=NULL')));
  assert.equal(client.calls.at(-1).sql, 'COMMIT');
  const before = client.calls.length;
  assert.equal(await reset(client, env.HOMOLOG_ADMIN_PASSWORD, { hash: () => assert.fail('must not rehash') }), 'already-completed');
  assert.ok(!client.calls.slice(before).some(c => /^(UPDATE|INSERT)/.test(c.sql)));
});

test('wrong database, missing users, foreign company and partial failure roll back without completion', async () => {
  for (const options of [{ identity: true }, { missing: true }, { foreign: true }, { failAt: 3 }]) {
    const client = fake(options);
    await assert.rejects(reset(client, env.HOMOLOG_ADMIN_PASSWORD, bcrypt));
    assert.equal(client.calls.at(-1).sql, 'ROLLBACK');
    assert.ok(!client.calls.some(c => c.sql.startsWith('INSERT') || c.sql === 'COMMIT'));
    if (!options.failAt) assert.ok(!client.calls.some(c => c.sql.startsWith('UPDATE')));
  }
});

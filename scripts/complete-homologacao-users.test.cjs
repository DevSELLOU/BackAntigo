'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateEnvironment, main, USERS } = require('./complete-homologacao-users.cjs');
const env = { APP_ENV: 'homologacao', NODE_ENV: 'production', DB_HOST: 'dpg-db4ko6vavr4c73fkjdag-a', DB_DATABASE: 'sellou_homologacao', DB_USERNAME: 'sellou_homologacao', DB_TLS: 'true', DB_PASSWORD: 'local-only', HOMOLOG_ADMIN_PASSWORD: 'Ficticia!123456', SEED_HOMOLOGACAO: 'false', RESET_HOMOLOG_PASSWORDS_ONCE: 'false' };

test('blocks production, wrong resource, unsafe flags and weak initial password before connecting', () => {
  validateEnvironment(env);
  for (const [key, value] of Object.entries({ APP_ENV: 'production', DB_HOST: 'production', DB_DATABASE: 'production', DB_USERNAME: 'postgres', DB_TLS: 'false', HOMOLOG_ADMIN_PASSWORD: 'short', SEED_HOMOLOGACAO: 'true', RESET_HOMOLOG_PASSWORDS_ONCE: 'true' })) assert.throws(() => validateEnvironment({ ...env, [key]: value }));
});

test('completion is disabled by default and rejects enabled reset without connecting', async () => {
  const logs = []; const original = console.log;
  console.log = line => logs.push(line);
  const dependencies = { Client: class { constructor() { assert.fail('must not connect'); } } };
  try {
    assert.equal(await main({}, dependencies), 0);
    assert.equal(await main({ ...env, COMPLETE_HOMOLOG_USERS: 'true', RESET_HOMOLOG_PASSWORDS_ONCE: 'true' }, dependencies), 1);
  } finally { console.log = original; }
  assert.ok(!logs.join('\n').includes(env.HOMOLOG_ADMIN_PASSWORD));
  assert.ok(!logs.join('\n').includes(env.DB_PASSWORD));
});

test('dataset has exactly the six identities and roles from PR #1', () => {
  assert.equal(USERS.length, 6);
  assert.equal(new Set(USERS.map(u => u.email)).size, 6);
  assert.deepEqual(USERS.map(u => u.role), ['ADMINISTRATOR', 'REGIONAL_MANAGER', 'SALES_REP', 'SALES_REP', 'SALES_REP', 'SALES_REP']);
});

test('driver errors never print credentials, connection strings or raw error fields', async () => {
  const secret = 'NeverPrintMe!123456'; const logs = []; const original = console.log;
  class Client {
    on() {}
    async connect() { throw Object.assign(new Error('postgres://user:' + secret + '@host/db'), { code: '28P01', detail: secret }); }
    async end() {}
  }
  console.log = line => logs.push(line);
  try {
    assert.equal(await main({ ...env, COMPLETE_HOMOLOG_USERS:'true', DB_PASSWORD:secret, HOMOLOG_ADMIN_PASSWORD:secret }, { Client, bcrypt:{}, databaseTlsOptions:()=>({ssl:true}) }), 1);
  } finally { console.log = original; }
  assert.ok(logs[0].includes('authentication_rejected'));
  assert.ok(!logs.join('\n').includes(secret)); assert.ok(!logs.join('\n').includes('postgres://'));
});

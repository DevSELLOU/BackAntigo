'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { Client } = require('pg');

// Opt-in and fixed loopback fixture. Never consumes runtime DB_* or Render secrets.
const enabled = process.env.RUN_HOMOLOG_SEED_PG_TESTS === '1';
const fixtureEnv = {
  PATH: process.env.PATH,
  APP_ENV: 'homologacao', NODE_ENV: 'production',
  DB_HOST: '127.0.0.1', DB_PORT: '55438', DB_DATABASE: 'sellou_homologacao',
  DB_USERNAME: 'sellou_homologacao', DB_PASSWORD: 'local-fixture-only',
  DB_TLS: 'true', DB_TLS_REJECT_UNAUTHORIZED: 'false',
  HOMOLOG_ADMIN_PASSWORD: 'Ficticia-Seed-Local-2026',
};
const script = path.join(__dirname, 'seed-homologacao.cjs');
function run(changes = {}) {
  return spawnSync(process.execPath, [script], {env: {...fixtureEnv, ...changes}, encoding: 'utf8', timeout: 20000});
}
function success() {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

// These checks are safe without PostgreSQL: validation must fail before connecting.
test('seed rejects production, wrong database/user and disabled TLS before connection', () => {
  for (const changes of [
    {APP_ENV: 'production'}, {NODE_ENV: 'development'},
    {DB_DATABASE: 'another_database'}, {DB_USERNAME: 'another_user'}, {DB_TLS: 'false'},
  ]) {
    const r = run(changes);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /exclusively for homologacao|dedicated database\/user and TLS/);
  }
});

test('PostgreSQL: preserve company configuration, add missing fixtures, rerun and reject identity/link conflicts', {skip: !enabled}, async t => {
  const c = new Client({host: '127.0.0.1', port: 55438, database: 'sellou_homologacao', user: 'sellou_homologacao'});
  await c.connect();
  try {
    // This dedicated loopback database is disposable; prepare the actual app schema.
    await c.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    const { databaseProviders } = require('../dist/database.providers');
    const sequelize = await databaseProviders[0].useFactory({get: key => fixtureEnv[key]});
    await sequelize.close();

    const quote = value => '"' + value.replaceAll('"', '""') + '"';
    async function snapshot() {
      const tables = (await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
      const rows = {};
      for (const {tablename} of tables) {
        rows[tablename] = (await c.query(`SELECT row_to_json(t) AS row FROM ${quote(tablename)} t ORDER BY row_to_json(t)::text`)).rows;
      }
      return rows;
    }
    async function removeExtras(customerEmails, productRefs) {
      const ids = (await c.query('SELECT id FROM "Customers" WHERE email=ANY($1::text[])', [customerEmails])).rows.map(r => r.id);
      for (const table of ['CustomerPaymentConditions', 'CustomerPaymentMethods', 'customer_sellers']) {
        await c.query(`DELETE FROM ${quote(table)} WHERE "customerId"=ANY($1::int[])`, [ids]);
      }
      await c.query('DELETE FROM "Customers" WHERE id=ANY($1::int[])', [ids]);
      const productIds = (await c.query('SELECT id FROM "Products" WHERE reference=ANY($1::text[])', [productRefs])).rows.map(r => r.id);
      for (const table of ['StockMovements', 'ProductSubCategories', 'PriceTableItems']) {
        await c.query(`DELETE FROM ${quote(table)} WHERE "productId"=ANY($1::int[])`, [productIds]);
      }
      await c.query('DELETE FROM "Products" WHERE id=ANY($1::int[])', [productIds]);
    }
    const codes = Array.from({length: 10}, (_, i) => String(i + 2).padStart(3, '0'));
    let configuredCompany;
    await t.test('fresh database keeps the original insert defaults', async () => {
      const first = success();
      assert.equal(first.created.Companies, 1);
      assert.equal(first.created.Customers, 11);
      assert.equal(first.created.Products, 11);
      assert.equal((await c.query('SELECT "customColor" FROM "Companies"')).rows[0].customColor, '#2563eb');
    });
    await t.test('manual company fields survive while exactly ten clients and products are added', async () => {
      await removeExtras(codes.map(code => `cliente-${code}@sellou-homologacao.example`), codes.map(code => `DEV-PROD-${code}`));
      await c.query(`UPDATE "Companies" SET "fantasyName"='Nome visual manual', status='INACTIVE', about='Descricao manual preservada', "customColor"='008440', "allowOrdersWithoutStock"=true, "shopColor"='112233', "logoUrl"='https://example.test/logo.png', "coverUrl"='https://example.test/capa.png', phone='000000000', address='Endereco ficticio manual', "updatedAt"='2026-10-20T12:00:00Z'`);
      configuredCompany = (await c.query('SELECT * FROM "Companies"')).rows;
      const before = await snapshot();
      const seeded = success();
      assert.equal(seeded.created.Customers, 10);
      assert.equal(seeded.created.Products, 10);
      assert.equal(seeded.created.Companies, undefined);
      assert.equal(seeded.created.Users, undefined);
      assert.equal(seeded.created.Orders, undefined);
      assert.deepEqual((await c.query('SELECT * FROM "Companies"')).rows, configuredCompany);
      const after = await snapshot();
      for (const table of ['Users', 'UserCompanies', 'Orders', 'OrderItems', 'Categories', 'SubCategories', 'Segments', 'SubSegments']) {
        assert.deepEqual(after[table], before[table], table);
      }
      assert.equal((await c.query('SELECT COUNT(*)::int AS n FROM "Customers"')).rows[0].n, 11);
      assert.equal((await c.query('SELECT COUNT(*)::int AS n FROM "Products"')).rows[0].n, 11);
    });
    await t.test('second run has zero inserts and no row changes anywhere', async () => {
      const before = await snapshot();
      assert.deepEqual(success().created, {});
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('partial datasets add only the two customers and three products missing', async () => {
      await removeExtras(['010','011'].map(code => `cliente-${code}@sellou-homologacao.example`), ['009','010','011'].map(code => `DEV-PROD-${code}`));
      const before = await snapshot();
      const seeded = success();
      assert.equal(seeded.created.Customers, 2);
      assert.equal(seeded.created.Products, 3);
      assert.deepEqual((await c.query('SELECT * FROM "Companies"')).rows, configuredCompany);
      const after = await snapshot();
      for (const table of ['Customers', 'Products']) {
        for (const row of before[table]) assert(after[table].some(r => JSON.stringify(r) === JSON.stringify(row)), table + ' existing row changed');
      }
      assert.deepEqual(success().created, {});
    });
    for (const [column, value] of [['cnpj', '00000000000999'], ['corporateName', 'Outra empresa']]) {
      await t.test('rejects a conflicting company identity: ' + column, async () => {
        const old = (await c.query(`SELECT ${quote(column)} AS value FROM "Companies"`)).rows[0].value;
        await c.query(`UPDATE "Companies" SET ${quote(column)}=$1`, [value]);
        const before = await snapshot();
        const r = run();
        assert.equal(r.status, 1);
        assert.match(r.stderr, /Non-seed company exists/);
        assert.deepEqual(await snapshot(), before);
        await c.query(`UPDATE "Companies" SET ${quote(column)}=$1`, [old]);
      });
    }
    await t.test('rejects duplicate fictional companies without writing', async () => {
      const duplicate = (await c.query('INSERT INTO "Companies" ("corporateName","fantasyName",cnpj,"createdAt","updatedAt") VALUES ($1,$2,$3,NOW(),NOW()) RETURNING id', ['Sellou Homologacao Ficticia', 'Duplicada', '00000000000000'])).rows[0].id;
      const before = await snapshot();
      const r = run();
      assert.equal(r.status, 1);
      assert.match(r.stderr, /Ambiguous seed identity: Companies/);
      assert.deepEqual(await snapshot(), before);
      await c.query('DELETE FROM "Companies" WHERE id=$1', [duplicate]);
    });
    await t.test('inconsistent membership remains a hard conflict and rolls back', async () => {
      await c.query('UPDATE "UserCompanies" SET role=$1', ['SALES_REP']);
      const before = await snapshot();
      const r = run();
      assert.equal(r.status, 1);
      assert.match(r.stderr, /Existing UserCompanies.role differs/);
      assert.deepEqual(await snapshot(), before);
      await c.query('UPDATE "UserCompanies" SET role=$1', ['ADMINISTRATOR']);
    });
    await t.test('late relationship conflict rolls back new customer/product inserts', async () => {
      await removeExtras(['cliente-002@sellou-homologacao.example'], ['DEV-PROD-002']);
      await c.query('UPDATE "PriceTableItems" SET "manualPrice"=999 WHERE "productId"=(SELECT id FROM "Products" WHERE reference=$1)', ['DEV-PROD-010']);
      const before = await snapshot();
      const r = run();
      assert.equal(r.status, 1);
      assert.match(r.stderr, /Existing PriceTableItems.manualPrice differs/);
      assert.deepEqual(await snapshot(), before);
    });
  } finally { await c.end(); }
});

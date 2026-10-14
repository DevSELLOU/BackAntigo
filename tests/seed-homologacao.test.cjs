'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertHomologacao, buildDataset, seed, TABLES, USERS, STATUSES } = require('../scripts/seed-homologacao.cjs');

test('recusa producao, banco/usuario/host errado e TLS externo inseguro', () => {
  const valid = { APP_ENV: 'homologacao', NODE_ENV: 'production', DB_DATABASE: 'sellou_homologacao', DB_USERNAME: 'sellou_homologacao', DB_HOST: 'dpg-db4ko6vavr4c73fkjdag-a', DB_TLS: 'true', DB_PASSWORD: 'FictitiousDbPassword', HOMOLOG_ADMIN_PASSWORD: 'FictitiousTest!2026' };
  assert.doesNotThrow(() => assertHomologacao(valid));
  for (const change of [{ APP_ENV: 'production' }, { APP_ENV: undefined }, { DB_DATABASE: 'sellou' }, { DB_USERNAME: 'postgres' }, { DB_HOST: 'production.example' }, { DB_TLS: 'false' }, { DB_PASSWORD: undefined }, { HOMOLOG_ADMIN_PASSWORD: 'weak' }, { DB_HOST: 'dpg-db4ko6vavr4c73fkjdag-a.oregon-postgres.render.com', DB_TLS_REJECT_UNAUTHORIZED: 'false' }]) {
    assert.throws(() => assertHomologacao({ ...valid, ...change }));
  }
});

test('base ficticia possui perfis, carteiras, totais financeiros e nove status', () => {
  const d = buildDataset();
  const aliases = new Set();
  const identities = new Set();
  const checkRef = v => { if (v && v.ref) assert.ok(aliases.has(v.ref), 'Referencia anterior ausente: ' + v.ref); };
  for (const e of d) {
    for (const v of Object.values(e.data)) checkRef(v);
    for (const v of Object.values(e.key)) checkRef(v);
    assert.ok(!aliases.has(e.alias)); aliases.add(e.alias);
    const identity = e.table + JSON.stringify(e.key);
    assert.ok(!identities.has(identity), 'Chave natural repetida'); identities.add(identity);
  }
  const of = table => d.filter(e => e.table === table);
  assert.equal(of('Users').length, 6);
  assert.equal(of('Customers').length, 20);
  assert.equal(of('Products').length, 30);
  assert.equal(of('Orders').length, 109);
  assert.equal(of('OrderItems').length, 217);
  assert.equal(of('UserGoals').length, 100);
  assert.equal(of('Cities').length, 13);
  for (const customer of of('Customers')) assert.ok(of('Cities').some(city => city.data.name === customer.data.city && city.data.stateAbbreviation === customer.data.UF));
  assert.equal(USERS.filter(u => u.role === 'SALES_REP').length, 4);
  assert.deepEqual([...new Set(of('Orders').map(e => e.data.status))].sort(), [...STATUSES].sort());
  for (const e of of('Orders').filter(e => e.effects)) {
    assert.equal(e.data.totalValue, e.effects.items.reduce((n, i) => n + i.quantity * i.price, 0));
    assert.ok(e.data.amountPaid >= 0 && e.data.amountPaid <= e.data.totalValue);
    assert.ok(of('customer_sellers').some(link => link.data.customerId.ref === e.data.customerId.ref && link.data.userId.ref === e.data.responsibleUserId.ref));
  }
});

// Opt-in integration suite: refuses every remote host and every other database.
const testUrl = process.env.HOMOLOG_TEST_DATABASE_URL;
test('PostgreSQL real: idempotencia, upgrade v1, rollback e concorrencia', { skip: !testUrl }, async t => {
  const url = new URL(testUrl);
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55432');
  assert.equal(url.pathname, '/sellou_homologacao');
  assert.equal(url.username, 'sellou_homologacao');
  const { Client } = require('pg');
  const bcrypt = require('bcrypt');
  const { databaseProviders } = require('../dist/database.providers');
  const config = { DB_HOST: url.hostname, DB_PORT: Number(url.port), DB_USERNAME: url.username, DB_DATABASE: url.pathname.slice(1), DB_PASSWORD: decodeURIComponent(url.password), DB_TLS: 'false' };
  const db = await databaseProviders[0].useFactory({ get: key => config[key] });
  const client = new Client({ connectionString: testUrl });
  await client.connect();
  const password = 'FictitiousTest!2026';
  const quote = s => '"' + s + '"';
  const reset = () => client.query('TRUNCATE ' + TABLES.map(quote).join(',') + ' RESTART IDENTITY CASCADE');
  const snapshot = async () => {
    const data = {};
    for (const table of TABLES) data[table] = (await client.query('SELECT * FROM ' + quote(table) + ' t ORDER BY to_jsonb(t)::text')).rows;
    return data;
  };
  try {
    await t.test('segunda execucao nao grava nada; saldos e relacionamentos permanecem iguais', async () => {
      await reset();
      const first = await seed(client, password, buildDataset(), bcrypt);
      const before = await snapshot();
      for (const table of TABLES) assert.equal(before[table].length, first.tables[table].created);
      const second = await seed(client, password, buildDataset(), bcrypt);
      for (const table of TABLES) { assert.equal(second.tables[table].created, 0); assert.equal(second.tables[table].updated, 0); }
      assert.deepEqual(await snapshot(), before);
      const invalidBalances = (await client.query('SELECT p.id FROM "Products" p LEFT JOIN "StockMovements" m ON m."productId"=p.id GROUP BY p.id HAVING p.stock <> SUM(CASE WHEN m.type=\'IN\' THEN m.quantity ELSE -m.quantity END)')).rows;
      assert.equal(invalidBalances.length, 0);
      assert.ok(before.Customers.every(c => Number(c.creditLimitUsed) >= 0 && Number(c.creditLimitUsed) <= Number(c.creditLimit)));
      for (const user of before.Users) assert.ok(await bcrypt.compare(password, user.password));
      const { DashboardTablesService } = require('../dist/src/dashboard/dashboard-tables.service');
      const { DashboardService } = require('../dist/src/dashboard/dashboard.service');
      const coverage = await new DashboardTablesService(new DashboardService({}, {})).getCoberturaGeoData({ companyId: first.companyId, state: ['SP'] });
      assert.ok(coverage.data.length > 0);
      assert.ok(coverage.data.every(city => city.state === 'SP' && city.latitude && city.longitude));
    });
    await t.test('amplia v1 sem duplicar administrador, empresa, cliente, produto e orcamento', async () => {
      await reset();
      const aliases = new Set(['company','user0','membership0','category0','subcategory0','segment0','subsegment0','condition0','method0','setup','customer0','customercondition0-0','customermethod0-0','admincustomer','product0','initialstock0','productcategory0','pricetable','priceitem0','legacyorder','legacyitem','legacyresponsible']);
      const legacy = buildDataset().filter(e => aliases.has(e.alias));
      legacy[0].data.corporateName = 'Sellou Homologacao Ficticia';
      await seed(client, password, legacy, bcrypt);
      const before = await snapshot();
      const result = await seed(client, password, buildDataset(), bcrypt);
      const after = await snapshot();
      assert.equal(result.tables.Companies.created, 0);
      assert.equal(result.tables.Companies.updated, 1);
      assert.equal(result.tables.Users.created, 5);
      assert.equal(result.tables.Customers.created, 19);
      assert.equal(result.tables.Products.created, 29);
      assert.equal(after.Users.find(u => u.email === USERS[0].email).password, before.Users[0].password);
      assert.equal(after.Orders.find(o => o.purchaseOrderNumber === 'DEV-ORC-001').id, before.Orders[0].id);
      assert.equal(after.Companies[0].corporateName, 'Sellou Homologação');
    });
    await t.test('erro de FK depois das gravacoes reverte toda a transacao', async () => {
      await reset();
      const dataset = buildDataset();
      dataset.push({ alias: 'invalid', table: 'OrderItems', key: { orderId: -1, productId: -1 }, data: { orderId: -1, productId: -1, quantity: 1, discount: 0 } });
      await assert.rejects(seed(client, password, dataset, bcrypt));
      const after = await snapshot();
      assert.ok(Object.values(after).every(rows => rows.length === 0));
    });
    await t.test('duas execucoes concorrentes criam apenas uma base', async () => {
      await reset();
      const other = new Client({ connectionString: testUrl });
      await other.connect();
      try {
        const results = await Promise.all([seed(client, password, buildDataset(), bcrypt), seed(other, password, buildDataset(), bcrypt)]);
        for (const table of TABLES) assert.equal(results.reduce((n, r) => n + r.tables[table].created, 0), results[0].tables[table].seedTotal);
      } finally { await other.end(); }
    });
    await t.test('senha divergente e banco diferente nao permitem nenhuma escrita', async () => {
      const before = await snapshot();
      await assert.rejects(seed(client, 'OtherFictitious!2026', buildDataset(), bcrypt), /Senha existente difere/);
      assert.deepEqual(await snapshot(), before);
      const wrong = new Client({ ...config, host: url.hostname, port: Number(url.port), user: url.username, password: decodeURIComponent(url.password), database: 'postgres' });
      await wrong.connect();
      try { await assert.rejects(seed(wrong, password, buildDataset(), bcrypt), /Identidade inesperada/); } finally { await wrong.end(); }
    });
    await t.test('meta sobreposta recusa alteracao sem sobrescrever dados', async () => {
      await client.query('UPDATE "UserGoals" SET "startDate"=\'2025-10-01\' WHERE id=(SELECT MIN(id) FROM "UserGoals")');
      const before = await snapshot();
      await assert.rejects(seed(client, password, buildDataset(), bcrypt), /Meta comercial sobreposta/);
      assert.deepEqual(await snapshot(), before);
    });
  } finally { await client.end(); await db.close(); }
});

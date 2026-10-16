'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { complete, USERS } = require('./complete-homologacao-users.cjs');
const PASSWORD = 'NewFicticia!123456';
const OLD_PASSWORD = 'OldFicticia!123456';

// Explicit opt-in; fixed loopback/port and fixture credentials. Never uses DB_* or Render.
const client = () => new Client({ host: '127.0.0.1', port: 55439, database: 'sellou_homologacao', user: 'sellou_homologacao', password: 'local-only-not-render' });
const enabled = process.env.RUN_HOMOLOG_USERS_PG_TESTS === '1';

async function fixture(c, { noMembership = false } = {}) {
  await c.query('DROP TABLE IF EXISTS public."UserCompanies", public."Users", public."Companies" CASCADE');
  await c.query(`CREATE TABLE public."Companies" (id serial PRIMARY KEY, cnpj text, "corporateName" text, "fantasyName" text, status text);
    CREATE TABLE public."Users" (id serial PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL, password text NOT NULL, role text NOT NULL CHECK (role IN ('ADMINISTRATOR','REGIONAL_MANAGER','SALES_REP')), status text NOT NULL, position text, "companyId" integer REFERENCES public."Companies"(id), "standardCommissionPercentage" numeric(10,2), password_reset_token text, password_reset_expires timestamp, "createdAt" timestamptz NOT NULL, "updatedAt" timestamptz NOT NULL);
    CREATE TABLE public."UserCompanies" (id serial PRIMARY KEY, "userId" integer NOT NULL REFERENCES public."Users"(id), "companyId" integer NOT NULL REFERENCES public."Companies"(id), role text NOT NULL, status text NOT NULL, position text, "createdAt" timestamptz NOT NULL, "updatedAt" timestamptz NOT NULL, CONSTRAINT membership_pair UNIQUE ("userId","companyId"));
    INSERT INTO public."Companies" (cnpj,"corporateName","fantasyName",status) VALUES ('00000000000000','Sellou Homologacao Ficticia','sellou-homologacao','ACTIVE')`);
  const u = USERS[0];
  await c.query('INSERT INTO public."Users" (name,email,password,role,status,position,"companyId","standardCommissionPercentage",password_reset_token,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,\'ACTIVE\',$5,1,0,\'preserve-old-token\',\'2026-01-01\',\'2026-01-01\')', [u.name,u.email,await bcrypt.hash(OLD_PASSWORD,10),u.role,u.position]);
  if (!noMembership) await c.query('INSERT INTO public."UserCompanies" ("userId","companyId",role,status,position,"createdAt","updatedAt") VALUES (1,1,$1,\'ACTIVE\',$2,\'2026-01-01\',\'2026-01-01\')', [u.role,u.position]);
}
async function snapshot(c) {
  return { users: (await c.query('SELECT * FROM public."Users" ORDER BY id')).rows, memberships: (await c.query('SELECT * FROM public."UserCompanies" ORDER BY id')).rows, companies: (await c.query('SELECT * FROM public."Companies" ORDER BY id')).rows };
}

test('PostgreSQL 16: additive completion, no password reset, rerun, conflicts, rollback and concurrency', { skip: !enabled }, async t => {
  const c = client(); await c.connect();
  try {
    await t.test('v1 admin with different password is preserved; five missing users and links created', async () => {
      await fixture(c);
      const before = await snapshot(c);
      const first = await complete(c, PASSWORD, bcrypt);
      assert.equal(first.users_created, 5); assert.equal(first.memberships_created, 5);
      assert.equal(first.six_users_exist, true); assert.equal(first.all_in_fictional_company, true); assert.equal(first.six_memberships_correct, true);
      const after = await snapshot(c);
      assert.equal(after.users.length,6); assert.equal(after.memberships.length,6);
      assert.deepEqual(after.users[0],before.users[0]); assert.deepEqual(after.memberships[0],before.memberships[0]); assert.deepEqual(after.companies,before.companies);
      assert.equal(await bcrypt.compare(OLD_PASSWORD,after.users[0].password),true);
      assert.equal(await bcrypt.compare(PASSWORD,after.users[0].password),false);
      for (const user of after.users.slice(1)) { assert.equal(await bcrypt.compare(PASSWORD,user.password),true); assert.equal(bcrypt.getRounds(user.password),10); }
      const noHash = { hash: () => assert.fail('must not hash on rerun') };
      const second = await complete(c,PASSWORD,noHash);
      assert.equal(second.users_created,0); assert.equal(second.memberships_created,0);
      const verified = await complete(c,PASSWORD,noHash,{verifyOnly:true});
      assert.equal(verified.six_memberships_correct,true);
      assert.deepEqual(await snapshot(c),after);
    });
    await t.test('missing administrator link is filled without changing its account', async () => {
      await fixture(c,{noMembership:true}); const before = await snapshot(c);
      const result = await complete(c,PASSWORD,bcrypt);
      assert.equal(result.users_created,5); assert.equal(result.memberships_created,6);
      assert.deepEqual((await snapshot(c)).users[0],before.users[0]);
    });
    await t.test('divergent role/status/company or membership aborts before inserting anything', async () => {
      for (const sql of ['UPDATE public."Users" SET "companyId"=NULL', 'UPDATE public."Users" SET role=\'SALES_REP\'', 'UPDATE public."Users" SET status=\'INACTIVE\'', 'UPDATE public."UserCompanies" SET role=\'SALES_REP\'']) {
        await fixture(c); await c.query(sql); const before = await snapshot(c);
        await assert.rejects(complete(c,PASSWORD,bcrypt)); assert.deepEqual(await snapshot(c),before);
      }
      await fixture(c);
      await c.query('ALTER TABLE public."UserCompanies" DROP CONSTRAINT membership_pair');
      await c.query('INSERT INTO public."UserCompanies" ("userId","companyId",role,status,position,"createdAt","updatedAt") SELECT "userId","companyId",role,status,position,"createdAt","updatedAt" FROM public."UserCompanies"');
      const before = await snapshot(c); await assert.rejects(complete(c,PASSWORD,bcrypt)); assert.deepEqual(await snapshot(c),before);
    });
    await t.test('insert failure rolls back all new accounts and links', async () => {
      await fixture(c); const before = await snapshot(c); let calls=0;
      await assert.rejects(complete(c,PASSWORD,{ hash: async (...args) => { if (++calls===3) throw new Error('simulated hash failure'); return bcrypt.hash(...args); } }));
      assert.deepEqual(await snapshot(c),before);
    });
    await t.test('read-only verification fails on incomplete data without modifying it', async () => {
      await fixture(c); const before = await snapshot(c);
      await assert.rejects(complete(c,PASSWORD,{hash:()=>assert.fail('read-only must not hash')},{verifyOnly:true}));
      assert.deepEqual(await snapshot(c),before);
    });
    await t.test('concurrent completions serialize and create each missing row once', async () => {
      await fixture(c); const other=client(); await other.connect();
      try {
        const results=await Promise.all([complete(c,PASSWORD,bcrypt),complete(other,PASSWORD,bcrypt)]);
        assert.deepEqual(results.map(r=>r.users_created).sort(),[0,5]);
        assert.deepEqual(results.map(r=>r.memberships_created).sort(),[0,5]);
        const state=await snapshot(c); assert.equal(state.users.length,6); assert.equal(state.memberships.length,6);
      } finally { await other.end(); }
    });
  } finally { await c.end(); }
});

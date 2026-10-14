#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { USERS, REFERENCE_DATE } = require('./seed-homologacao.cjs');
const API = 'https://backantigo.onrender.com';

// Read-only smoke checks (apart from authentication); never print passwords/JWTs.
async function validateApi(base, password, request = fetch) {
  assert.ok([API, 'http://127.0.0.1:3200'].includes(base), 'URL fora da homologacao autorizada');
  assert.ok(password, 'Configure HOMOLOG_ADMIN_PASSWORD');
  const checks = [];
  for (const expected of USERS) {
    const login = await request(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: expected.email, password }), signal: AbortSignal.timeout(60000), redirect: 'error' });
    assert.equal(login.status, 201, 'Login falhou: ' + expected.email);
    const { data } = await login.json();
    assert.equal(data.user.email, expected.email);
    assert.equal(data.user.role, expected.role);
    assert.ok(data.user.companies.some(c => c.companyName === 'Sellou Homologação' && c.companyId === data.user.activeCompanyId));
    const companyId = data.user.activeCompanyId;
    const paths = [
      ['/auth/my-companies', 200],
      ['/company/' + companyId + '/customer?limit=100', 200],
      ['/company/' + companyId + '/products?limit=100', 200],
      ['/company/' + companyId + '/orders?limit=150', 200],
      ['/company/' + companyId + '/payment-condition', 200],
      ['/company/' + companyId + '/payment-method', 200],
      ['/company/' + companyId + '/order-setup', 200],
      ['/company/' + companyId + '/categories', 200],
      ['/companies/' + companyId + '/dashboard/metrics/revenue', 200],
      ['/companies/' + companyId + '/dashboard/charts/revenue-over-time', 200],
      ['/companies/' + companyId + '/dashboard/coverage/geo-data', 200],
      ['/company/' + companyId + '/user-goals/dashboard/summary?year=' + REFERENCE_DATE.slice(0, 4), 200],
      ['/reports/' + companyId + '/orders', 200],
      ['/reports/' + companyId + '/sales', 200],
      ['/reports/' + companyId + '/products', 200],
      ['/user', expected.role === 'ADMINISTRATOR' ? 200 : 403],
    ];
    for (const [path, status] of paths) {
      const response = await request(base + path, { headers: { authorization: 'Bearer ' + data.accessToken }, signal: AbortSignal.timeout(60000), redirect: 'error' });
      assert.equal(response.status, status, expected.email + ': ' + path);
      if (status === 200) {
        const body = await response.json();
        assert.ok(body.data !== undefined, 'Resposta sem dados: ' + path);
        if (/\/(customer|products|orders)\?/.test(path)) assert.ok(body.data.length > 0, 'Lista vazia: ' + path);
        if (path.endsWith('/coverage/geo-data')) assert.ok(body.data.length > 0 && body.data.every(c => c.latitude && c.longitude), 'Cobertura sem coordenadas ficticias');
      }
      checks.push({ email: expected.email, role: expected.role, path, status });
    }
  }
  return { api: base, users: USERS.length, checks };
}

module.exports = { validateApi };
if (require.main === module) {
  assert.equal(process.env.APP_ENV, 'homologacao', 'Validacao exclusiva de homologacao');
  validateApi(API, process.env.HOMOLOG_ADMIN_PASSWORD).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}

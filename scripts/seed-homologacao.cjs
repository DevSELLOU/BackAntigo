#!/usr/bin/env node
'use strict';
const { isDeepStrictEqual } = require('node:util');

// No dotenv, application bootstrap, email, uploads or production credentials.
const DATABASE = 'sellou_homologacao';
const INTERNAL_HOST = 'dpg-db4ko6vavr4c73fkjdag-a';
const COMPANY = 'Sellou Homologação';
const LEGACY_COMPANY = 'Sellou Homologacao Ficticia';
const REFERENCE_DATE = '2026-10-14';
const USERS = [
  { email: 'admin@sellou-homologacao.example', name: 'Administrador Ficticio Homologacao', role: 'ADMINISTRATOR', position: 'Administrador de homologacao' },
  { email: 'gerente@sellou-homologacao.example', name: 'Gerente Fictício', role: 'REGIONAL_MANAGER', position: 'Gerente' },
  { email: 'representante1@sellou-homologacao.example', name: 'Representante Fictício 1', role: 'SALES_REP', position: 'Representante Comercial' },
  { email: 'representante2@sellou-homologacao.example', name: 'Representante Fictício 2', role: 'SALES_REP', position: 'Representante Comercial' },
  { email: 'interno1@sellou-homologacao.example', name: 'Vendedor Interno Fictício 1', role: 'SALES_REP', position: 'Vendedor Interno' },
  { email: 'interno2@sellou-homologacao.example', name: 'Vendedor Interno Fictício 2', role: 'SALES_REP', position: 'Vendedor Interno' },
];
const STATUSES = ['ON_BUDGET', 'IN_APPROVAL', 'APPROVED', 'INVOICED', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELED', 'BLOCKED'];
const TABLES = ['Companies', 'Cities', 'Users', 'UserCompanies', 'UserHierarchies', 'Categories', 'SubCategories', 'Segments', 'SubSegments', 'PaymentConditions', 'PaymentMethods', 'OrderSetups', 'Customers', 'CustomerPaymentConditions', 'CustomerPaymentMethods', 'customer_sellers', 'Products', 'StockMovements', 'ProductSubCategories', 'PriceTables', 'PriceTableItems', 'Orders', 'OrderItems', 'order_responsible_users', 'UserGoals', 'UserGoalProducts'];
const ref = name => ({ ref: name });
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const invariant = (condition, message) => { if (!condition) throw new Error(message); };

function assertHomologacao(env) {
  invariant(env.APP_ENV === 'homologacao' && env.NODE_ENV === 'production', 'Seed exclusivo de homologacao; APP_ENV deve ser homologacao');
  invariant(env.DB_DATABASE === DATABASE && env.DB_USERNAME === DATABASE, 'Banco e usuario devem ser sellou_homologacao');
  invariant(env.DB_TLS === 'true', 'TLS obrigatorio');
  invariant(env.DB_HOST === INTERNAL_HOST || /^dpg-db4ko6vavr4c73fkjdag-a\.[a-z0-9-]+-postgres\.render\.com$/.test(env.DB_HOST || ''), 'Host nao pertence ao recurso de homologacao autorizado');
  invariant(!env.DB_PORT || env.DB_PORT === '5432', 'Porta de homologacao deve ser 5432');
  invariant(env.DB_HOST === INTERNAL_HOST || env.DB_TLS_REJECT_UNAUTHORIZED !== 'false', 'Host externo exige validacao do certificado TLS');
  invariant(['true', 'false', undefined].includes(env.DB_TLS_REJECT_UNAUTHORIZED), 'Opcao TLS invalida');
  invariant(Boolean(env.DB_PASSWORD), 'Configure DB_PASSWORD como segredo');
  const password = env.HOMOLOG_ADMIN_PASSWORD;
  invariant(typeof password === 'string' && password.length >= 12 && password.length <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) && Buffer.byteLength(password) <= 72, 'HOMOLOG_ADMIN_PASSWORD deve ter 12 a 72 bytes, maiuscula, minuscula, numero e simbolo');
}

// Stable aliases and natural keys preserve the v1 seed and make every join repeatable.
function buildDataset(referenceDate = REFERENCE_DATE) {
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(referenceDate) && new Date(referenceDate).toISOString().slice(0, 10) === referenceDate, 'Data de referencia invalida');
  const reference = new Date(referenceDate + 'T00:00:00Z');
  const entries = [];
  const add = (alias, table, key, data, extra = {}) => entries.push({ alias, table, key, data, ...extra });
  const companyId = ref('company');
  const scoped = name => ({ name, companyId });
  add('company', 'Companies', { cnpj: '00000000000000' }, { corporateName: COMPANY, fantasyName: 'sellou-homologacao', cnpj: '00000000000000', status: 'ACTIVE', about: 'Empresa ficticia exclusiva para homologacao', customColor: '#2563eb', allowOrdersWithoutStock: false });
  // Coverage dashboards require city coordinates, including matching city/UF pairs.
  const fictionalCities = ['Cidade Ficticia', 'Cidade Fictícia Alfa', 'Cidade Fictícia Beta', 'Cidade Fictícia Gama'];
  let cityIndex = 0;
  fictionalCities.forEach((name, n) => (n === 0 ? ['SP'] : ['SP', 'RJ', 'MG', 'PR']).forEach(stateAbbreviation => {
    const index = ++cityIndex;
    const key = { name, stateAbbreviation };
    add('city' + index, 'Cities', key, { ...key, stateName: 'Estado Fictício ' + stateAbbreviation, ibgeCode: String(index).padStart(7, '0'), latitude: String(-21 - index * 0.2), longitude: String(-44 - index * 0.15) });
  }));
  USERS.forEach((user, i) => {
    add('user' + i, 'Users', { email: user.email }, { ...user, companyId, status: 'ACTIVE', standardCommissionPercentage: i < 2 ? 0 : 3 });
    const userId = ref('user' + i);
    add('membership' + i, 'UserCompanies', { userId, companyId }, { userId, companyId, role: user.role, status: 'ACTIVE', position: user.position });
    if (i >= 2) add('hierarchy' + i, 'UserHierarchies', { subordinateId: userId, companyId }, { subordinateId: userId, companyId, managerId: ref('user1') });
  });
  for (let i = 0; i < 3; i++) {
    const name = i === 0 ? 'Categoria Ficticia' : ['','Papelaria Fictícia', 'Acessórios Fictícios'][i];
    add('category' + i, 'Categories', scoped(name), { ...scoped(name), description: 'Apoio de homologacao' });
    const segment = i === 0 ? 'Segmento Ficticio' : ['','Varejo Fictício', 'Serviços Fictícios'][i];
    add('segment' + i, 'Segments', scoped(segment), { ...scoped(segment), description: 'Apoio de homologacao' });
    for (let j = 0; j < 2; j++) {
      const index = i * 2 + j;
      const subName = index === 0 ? 'Subcategoria Ficticia' : 'Subcategoria Fictícia ' + (index + 1);
      add('subcategory' + index, 'SubCategories', { name: subName, categoryId: ref('category' + i) }, { name: subName, categoryId: ref('category' + i) });
      const subSegment = index === 0 ? 'Subsegmento Ficticio' : 'Subsegmento Fictício ' + (index + 1);
      add('subsegment' + index, 'SubSegments', { name: subSegment, segmentId: ref('segment' + i) }, { name: subSegment, segmentId: ref('segment' + i) });
    }
    const condition = ['A vista ficticio', '30 dias fictício', '60 dias fictício'][i];
    add('condition' + i, 'PaymentConditions', scoped(condition), { ...scoped(condition), description: i === 0 ? 'Sem integracao financeira' : 'Condição simulada, sem integração financeira' });
    const method = ['Pagamento simulado', 'PIX simulado', 'Boleto simulado'][i];
    add('method' + i, 'PaymentMethods', scoped(method), { ...scoped(method), description: i === 0 ? 'Exclusivamente ficticio' : 'Meio fictício sem processamento financeiro' });
  }
  add('setup', 'OrderSetups', { companyId }, { companyId, minDays: 0, maxDays: 30 });
  for (let i = 0; i < 20; i++) {
    const email = i === 0 ? 'cliente@sellou-homologacao.example' : 'cliente' + (i + 1) + '@sellou-homologacao.example';
    const customerId = ref('customer' + i);
    const legacy = { corporateName: 'Cliente Ficticio Homologacao', fantasyName: 'Cliente Ficticio', document: '00000000000000', email, phoneNumber: '00000000000', cep: '00000000', address: 'Rua Ficticia 0', city: 'Cidade Ficticia', UF: 'SP', neighborhood: 'Bairro Ficticio', creditLimit: 10000, creditLimitUsed: 0, status: 'ACTIVE', customerType: 'END_CONSUMER', taxRegime: 'SIMPLES_NACIONAL', subSegmentId: ref('subsegment0'), companyId };
    const customerDate = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 11 + Math.floor(i / 9), 1));
    add('customer' + i, 'Customers', { email, companyId }, i === 0 ? { ...legacy, createdAt: customerDate, updatedAt: customerDate } : { ...legacy, corporateName: 'Cliente Fictício ' + (i + 1), fantasyName: 'Loja Fictícia ' + (i + 1), document: String(i).padStart(14, '0'), address: 'Rua Imaginária ' + (i + 1), city: ['Cidade Fictícia Alfa', 'Cidade Fictícia Beta', 'Cidade Fictícia Gama'][i % 3], UF: ['SP', 'RJ', 'MG', 'PR'][i % 4], customerType: ['END_CONSUMER', 'WHOLESALE', 'RESALE'][i % 3], taxRegime: ['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL'][i % 3], subSegmentId: ref('subsegment' + (i % 6)), segment: ['Segmento Ficticio', 'Varejo Fictício', 'Serviços Fictícios'][Math.floor((i % 6) / 2)], createdAt: customerDate, updatedAt: customerDate });
    for (let j = 0; j < 3; j++) {
      const ck = { customerId, paymentConditionId: ref('condition' + j) };
      add('customercondition' + i + '-' + j, 'CustomerPaymentConditions', ck, ck);
      const mk = { customerId, paymentMethodId: ref('method' + j) };
      add('customermethod' + i + '-' + j, 'CustomerPaymentMethods', mk, mk);
    }
    for (const seller of [i % 4, (i + 2) % 4]) {
      const key = { customerId, userId: ref('user' + (seller + 2)) };
      add('seller' + i + '-' + seller, 'customer_sellers', key, key);
    }
  }
  // Preserve the v1 administrator's customer link and sample quotation.
  const adminCustomer = { customerId: ref('customer0'), userId: ref('user0') };
  add('admincustomer', 'customer_sellers', adminCustomer, adminCustomer);
  add('pricetable', 'PriceTables', scoped('Tabela Ficticia Homologacao'), { ...scoped('Tabela Ficticia Homologacao'), description: 'Precos de teste', price: 0, status: 'ACTIVE' });
  const prices = [];
  for (let i = 0; i < 30; i++) {
    const reference = 'DEV-PROD-' + String(i + 1).padStart(3, '0');
    const price = i === 0 ? 100 : 25 + i * 7;
    prices.push(price);
    const productId = ref('product' + i);
    add('product' + i, 'Products', { reference, companyId }, { name: i === 0 ? 'Produto Ficticio Homologacao' : 'Produto Fictício ' + (i + 1), description: 'Produto ficticio sem imagem ou integracao externa', reference, price, minPrice: price, stock: i === 0 ? 100 : 1000, unitOfMeasure: 'UN', brand: i === 0 ? 'Marca Ficticia' : 'Marca Fictícia ' + (i % 3 + 1), active: true, favorite: false, companyId });
    const movement = { productId, type: 'IN', orderId: null };
    add('initialstock' + i, 'StockMovements', movement, { ...movement, quantity: i === 0 ? 100 : 1000 });
    const category = { productId, subCategoryId: ref('subcategory' + (i % 6)) };
    add('productcategory' + i, 'ProductSubCategories', category, category);
    const priceKey = { priceTableId: ref('pricetable'), productId };
    add('priceitem' + i, 'PriceTableItems', priceKey, { ...priceKey, manualPrice: price, isManual: true });
  }
  const monthInfo = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 11 + m, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    const prefix = start.toISOString().slice(0, 7);
    monthInfo.push({ start, end, prefix });
    for (let seller = 0; seller < 4; seller++) {
      for (const type of ['sales_value', 'line_items', ...(m === 11 ? ['product_sales'] : [])]) {
        const key = { userId: ref('user' + (seller + 2)), companyId, type, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
        const alias = 'goal-' + prefix + '-' + seller + '-' + type;
        add(alias, 'UserGoals', key, { ...key, targetValue: type === 'sales_value' ? 15000 : type === 'line_items' ? 30 : 100, currentValue: 0 });
        if (type === 'product_sales') for (let p = 0; p < 30; p++) {
          const productKey = { userGoalId: ref(alias), productId: ref('product' + p) };
          add(alias + '-product' + p, 'UserGoalProducts', productKey, { ...productKey, totalToSell: 4 });
        }
      }
    }
  }
  add('legacyorder', 'Orders', { purchaseOrderNumber: 'DEV-ORC-001', companyId }, { purchaseOrderNumber: 'DEV-ORC-001', observation: 'Orcamento ficticio; sem faturamento ou envio', companyId, customerId: ref('customer0'), responsibleUserId: ref('user0'), paymentConditionId: ref('condition0'), paymentMethodId: ref('method0'), status: 'ON_BUDGET', totalValue: 200, amountPaid: 0, discount: 0, isCustomerClientOrder: false });
  const legacyItem = { orderId: ref('legacyorder'), productId: ref('product0') };
  add('legacyitem', 'OrderItems', legacyItem, { ...legacyItem, quantity: 2, discount: 0 });
  const legacyResponsible = { orderId: ref('legacyorder'), userId: ref('user0') };
  add('legacyresponsible', 'order_responsible_users', legacyResponsible, legacyResponsible);
  monthInfo.forEach(({ start, prefix }, m) => STATUSES.forEach((status, s) => {
    const index = m * STATUSES.length + s;
    const customerIndex = index % 20;
    const seller = customerIndex % 4;
    const userId = ref('user' + (seller + 2));
    const alias = 'order-' + prefix + '-' + s;
    const orderId = ref(alias);
    const purchaseOrderNumber = 'HOM-' + prefix + '-' + String(s + 1).padStart(3, '0');
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), m === 11 ? Math.max(1, reference.getUTCDate() - s) : 5 + s, 9));
    const items = [index % 30, (index + 11) % 30].map((p, j) => ({ productId: ref('product' + p), quantity: 1 + ((index + j) % 4), discount: 0, price: prices[p] }));
    const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const path = status === 'CANCELED' || status === 'BLOCKED' ? ['ON_BUDGET', 'IN_APPROVAL', status] : STATUSES.slice(0, s + 1);
    const statusHistory = path.slice(1).map((newStatus, i) => ({ oldStatus: path[i], newStatus, userId, createdAt: new Date(date.getTime() + (i + 1) * 60000).toISOString() }));
    const approved = path.includes('APPROVED');
    const amountPaid = approved ? (status === 'DELIVERED' ? totalValue : Math.floor(totalValue / 2)) : 0;
    const weight = (approved ? 1 : 0) + (path.includes('INVOICED') ? 1 : 0) - (status === 'RETURNED' ? 1 : 0);
    add(alias, 'Orders', { purchaseOrderNumber, companyId }, { purchaseOrderNumber, observation: 'Pedido 100% fictício; nenhum faturamento ou envio externo', companyId, customerId: ref('customer' + customerIndex), responsibleUserId: userId, managerId: ref('user1'), paymentConditionId: ref('condition' + (index % 3)), paymentMethodId: ref('method' + (index % 3)), status, totalValue, amountPaid, discount: 0, isCustomerClientOrder: false, statusHistory: JSON.stringify(statusHistory), ...(status === 'RETURNED' ? { returnReason: 'Devolução simulada' } : {}), ...(status === 'CANCELED' ? { cancelReason: 'Cancelamento simulado' } : {}), ...(status === 'BLOCKED' ? { blockReason: 'Bloqueio simulado' } : {}), createdAt: date, updatedAt: new Date(date.getTime() + path.length * 60000) }, { effects: { approved, returned: status === 'RETURNED', credit: approved ? totalValue - amountPaid : 0, items, goals: ['sales_value', 'line_items', ...(m === 11 ? ['product_sales'] : [])].map(type => ({ goal: ref('goal-' + prefix + '-' + seller + '-' + type), delta: weight * (type === 'sales_value' ? totalValue : type === 'line_items' ? items.length : items[0].quantity) })) } });
    items.forEach((item, j) => {
      const { price, ...data } = item;
      add(alias + '-item' + j, 'OrderItems', { orderId, productId: item.productId }, { ...data, orderId });
      if (approved) {
        const movement = { orderId, productId: item.productId, type: 'OUT' };
        add(alias + '-out' + j, 'StockMovements', movement, { ...movement, quantity: item.quantity, createdAt: date, updatedAt: date });
        if (status === 'RETURNED') {
          const returned = { ...movement, type: 'IN' };
          add(alias + '-return' + j, 'StockMovements', returned, { ...returned, quantity: item.quantity, createdAt: date, updatedAt: date });
        }
      }
    });
    const responsible = { orderId, userId };
    add(alias + '-responsible', 'order_responsible_users', responsible, responsible);
  }));
  return entries;
}

function resolve(value, rows) {
  if (value && typeof value === 'object' && value.ref) {
    invariant(rows.has(value.ref), 'Referencia ausente: ' + value.ref);
    return rows.get(value.ref).id;
  }
  return value;
}

async function seed(client, password, dataset, bcrypt) {
  const rows = new Map();
  const updatedIds = Object.fromEntries(TABLES.map(table => [table, new Set()]));
  const counts = Object.fromEntries(TABLES.map(table => [table, { created: 0, reused: 0, updated: 0, seedTotal: 0 }]));
  await client.query('BEGIN');
  try {
    // Same lock as v1: rolling deployments cannot race the original seed.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('sellou-homologacao-seed-v1'))");
    const identity = (await client.query('SELECT current_database() AS db, current_user AS username')).rows[0];
    invariant(identity.db === DATABASE && identity.username === DATABASE, 'Identidade inesperada; nenhuma escrita permitida');
    const companies = (await client.query('SELECT * FROM "Companies"')).rows;
    invariant(companies.every(c => c.cnpj === '00000000000000' && [COMPANY, LEGACY_COMPANY].includes(c.corporateName)), 'Empresa alheia ao seed encontrada; recusando banco nao dedicado');
    const hash = await bcrypt.hash(password, 10);
    for (const entry of dataset) {
      const key = Object.fromEntries(Object.entries(entry.key).map(([k, v]) => [k, resolve(v, rows)]));
      const data = Object.fromEntries(Object.entries(entry.data).map(([k, v]) => [k, resolve(v, rows)]));
      if (entry.table === 'Orders' && data.statusHistory) {
        data.statusHistory = JSON.stringify(JSON.parse(data.statusHistory).map(h => ({ ...h, userId: resolve(h.userId, rows) })));
      }
      if (entry.table === 'Users') data.password = hash;
      const where = Object.keys(key).map((k, i) => quote(k) + ' IS NOT DISTINCT FROM $' + (i + 1)).join(' AND ');
      const existing = (await client.query('SELECT * FROM ' + quote(entry.table) + ' WHERE ' + where, Object.values(key))).rows;
      invariant(existing.length <= 1, 'Identidade ambigua em ' + entry.table);
      let row;
      if (existing.length) {
        row = existing[0];
        // Do not reset passwords, stock, credit, goals or timestamps on rerun.
        if (entry.table === 'Users') invariant(await bcrypt.compare(password, row.password), 'Senha existente difere; nenhuma redefinicao realizada');
        if (entry.alias === 'company' && row.corporateName === LEGACY_COMPANY) {
          row = (await client.query('UPDATE "Companies" SET "corporateName"=$1,"updatedAt"=NOW() WHERE id=$2 RETURNING *', [COMPANY, row.id])).rows[0];
          counts.Companies.updated++;
          updatedIds.Companies.add(row.id);
        }
        for (const [k, v] of Object.entries(data)) {
          if (['password', 'stock', 'creditLimitUsed', 'currentValue', 'createdAt', 'updatedAt'].includes(k)) continue;
          const matches = typeof v === 'number' ? row[k] !== null && Number(row[k]) === v : k === 'statusHistory' ? isDeepStrictEqual(row[k], JSON.parse(v)) : row[k] instanceof Date ? row[k].toISOString().slice(0, 10) === v : row[k] === v;
          invariant(matches, 'Registro existente diverge: ' + entry.table + '.' + k + '; nenhuma sobrescrita realizada');
        }
        counts[entry.table].reused++;
      } else {
        if (entry.table === 'UserGoals') {
          const overlap = await client.query('SELECT id FROM "UserGoals" WHERE "userId"=$1 AND type=$2 AND "startDate" <= $4 AND "endDate" >= $3', [data.userId, data.type, data.startDate, data.endDate]);
          invariant(overlap.rowCount === 0, 'Meta comercial sobreposta; nenhuma regra alterada');
        }
        const insert = { ...data, createdAt: data.createdAt || new Date(), updatedAt: data.updatedAt || new Date() };
        const keys = Object.keys(insert);
        row = (await client.query('INSERT INTO ' + quote(entry.table) + ' (' + keys.map(quote).join(',') + ') VALUES (' + keys.map((_, i) => '$' + (i + 1)).join(',') + ') RETURNING *', Object.values(insert))).rows[0];
        counts[entry.table].created++;
        if (entry.effects) {
          const effects = entry.effects;
          if (effects.approved) {
            // Approval consumes stock and credit; returning restores stock only in the real service.
            if (!effects.returned) for (const item of effects.items) {
              const result = await client.query('UPDATE "Products" SET stock=stock-$1,"updatedAt"=NOW() WHERE id=$2 AND stock >= $1 RETURNING id', [item.quantity, resolve(item.productId, rows)]);
              invariant(result.rowCount === 1, 'Estoque insuficiente; rollback integral');
              counts.Products.updated++;
              updatedIds.Products.add(resolve(item.productId, rows));
            }
            const credit = await client.query('UPDATE "Customers" SET "creditLimitUsed"="creditLimitUsed"+$1,"updatedAt"=NOW() WHERE id=$2 AND "creditLimitUsed"+$1 <= "creditLimit" RETURNING id', [effects.credit, row.customerId]);
            invariant(credit.rowCount === 1, 'Limite de credito excedido; rollback integral');
            counts.Customers.updated++;
            updatedIds.Customers.add(row.customerId);
            // Replay existing approval/invoice/return goal increments without changing business rules.
            for (const goal of effects.goals) if (goal.delta) {
              await client.query('UPDATE "UserGoals" SET "currentValue"="currentValue"+$1,"updatedAt"=NOW() WHERE id=$2', [goal.delta, resolve(goal.goal, rows)]);
              counts.UserGoals.updated++;
              updatedIds.UserGoals.add(resolve(goal.goal, rows));
            }
          }
        }
      }
      rows.set(entry.alias, row);
      counts[entry.table].seedTotal++;
    }
    for (const table of TABLES) counts[table].updated = updatedIds[table].size;
    const result = { database: DATABASE, companyId: rows.get('company').id, referenceDate: REFERENCE_DATE, users: USERS.map((u, i) => rows.has('user' + i) ? { id: rows.get('user' + i).id, email: u.email, role: u.role, position: u.position, passwordSource: 'HOMOLOG_ADMIN_PASSWORD' } : null).filter(Boolean), tables: counts };
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function main() {
  assertHomologacao(process.env); // Reject before importing drivers or connecting.
  const { Client } = require('pg');
  const bcrypt = require('bcrypt');
  const { databaseTlsOptions } = require('../dist/src/utils/database-tls');
  const client = new Client({ host: process.env.DB_HOST, port: 5432, user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE, ...databaseTlsOptions(process.env), connectionTimeoutMillis: 10000, statement_timeout: 60000 });
  try {
    await client.connect();
    const result = await seed(client, process.env.HOMOLOG_ADMIN_PASSWORD, buildDataset(), bcrypt);
    console.log(JSON.stringify(result, null, 2));
  } finally { await client.end().catch(() => {}); }
}

module.exports = { assertHomologacao, buildDataset, seed, USERS, TABLES, STATUSES, REFERENCE_DATE };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

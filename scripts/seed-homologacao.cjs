#!/usr/bin/env node
'use strict';
// Dedicated homologacao identity and TLS required; never loads dotenv or production credentials.
const { Client } = require('pg');
const { databaseTlsOptions } = require('../dist/src/utils/database-tls');
const bcrypt = require('bcrypt');
const EMAIL = 'admin@sellou-homologacao.example';
const PASSWORD = process.env.HOMOLOG_ADMIN_PASSWORD;
const COMPANY = 'Sellou Homologacao Ficticia';
function assertHomologacao() {
  if (process.env.APP_ENV !== 'homologacao' || process.env.NODE_ENV !== 'production') throw new Error('Seed is exclusively for homologacao');
  databaseTlsOptions(process.env);
  if (!process.env.DB_HOST || !process.env.DB_PASSWORD) throw new Error('Dedicated homologacao DB connection required');
  if (!PASSWORD || PASSWORD.length < 12) throw new Error('Set HOMOLOG_ADMIN_PASSWORD with at least 12 fictitious characters');
}
const quote = value => '"' + value.replaceAll('"', '""') + '"';
async function main() {
  assertHomologacao();
  const client = new Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||5432),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE,...databaseTlsOptions(process.env),connectionTimeoutMillis:10000});
  await client.connect();
  try {
    const identity = (await client.query('SELECT current_database() AS db, current_user AS username, host(inet_server_addr()) AS address')).rows[0];
    if (identity.db !== 'sellou_homologacao' || identity.username !== 'sellou_homologacao') throw new Error('Unexpected database identity; no data written');
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('sellou-homologacao-seed-v1'))");
    const created = {};
    async function ensure(table, key, data) {
      const where = Object.keys(key).map((k,i)=>`${quote(k)} IS NOT DISTINCT FROM $${i+1}`).join(' AND ');
      const existing = (await client.query(`SELECT * FROM ${quote(table)} WHERE ${where}`,Object.values(key))).rows;
      if (existing.length > 1) throw new Error('Ambiguous seed identity: ' + table);
      if (existing.length) {
        for (const [k,v] of Object.entries(data)) {
          if (k === 'password') { if (!await bcrypt.compare(PASSWORD,existing[0][k])) throw new Error('Existing seed password differs; no reset performed'); }
          else if (typeof v === 'number') { if (existing[0][k] === null || Number(existing[0][k]) !== v) throw new Error(`Existing ${table}.${k} differs; refusing overwrite`); }
          else if (v !== null && typeof v !== 'object' && String(existing[0][k]) !== String(v)) throw new Error(`Existing ${table}.${k} differs; refusing overwrite`);
        }
        return existing[0];
      }
      const row = {...data, createdAt:new Date(), updatedAt:new Date()};
      const keys = Object.keys(row);
      const result = await client.query(`INSERT INTO ${quote(table)} (${keys.map(quote).join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,Object.values(row));
      created[table] = (created[table] || 0) + 1;
      return result.rows[0];
    }
    if ((await client.query('SELECT 1 FROM \"Companies\" WHERE \"cnpj\" <> $1 OR \"corporateName\" <> $2 LIMIT 1', ['00000000000000', COMPANY])).rowCount) throw new Error('Non-seed company exists; refusing to seed a non-dedicated database');
    const company = await ensure('Companies',{cnpj:'00000000000000'},{corporateName:COMPANY,fantasyName:'sellou-homologacao',cnpj:'00000000000000',status:'ACTIVE',about:'Empresa ficticia exclusiva para homologacao',customColor:'#2563eb',allowOrdersWithoutStock:false});
    const user = await ensure('Users',{email:EMAIL},{name:'Administrador Ficticio Homologacao',email:EMAIL,password:await bcrypt.hash(PASSWORD,10),role:'ADMINISTRATOR',status:'ACTIVE',position:'Administrador de homologacao',companyId:company.id,standardCommissionPercentage:0});
    await ensure('UserCompanies',{userId:user.id,companyId:company.id},{userId:user.id,companyId:company.id,role:'ADMINISTRATOR',status:'ACTIVE',position:'Administrador de homologacao'});
    const scoped = (name) => ({name,companyId:company.id});
    const category = await ensure('Categories',scoped('Categoria Ficticia'),{...scoped('Categoria Ficticia'),description:'Apoio de homologacao'});
    const subCategory = await ensure('SubCategories',{name:'Subcategoria Ficticia',categoryId:category.id},{name:'Subcategoria Ficticia',categoryId:category.id});
    const segment = await ensure('Segments',scoped('Segmento Ficticio'),{...scoped('Segmento Ficticio'),description:'Apoio de homologacao'});
    const subSegment = await ensure('SubSegments',{name:'Subsegmento Ficticio',segmentId:segment.id},{name:'Subsegmento Ficticio',segmentId:segment.id});
    const condition = await ensure('PaymentConditions',scoped('A vista ficticio'),{...scoped('A vista ficticio'),description:'Sem integracao financeira'});
    const method = await ensure('PaymentMethods',scoped('Pagamento simulado'),{...scoped('Pagamento simulado'),description:'Exclusivamente ficticio'});
    await ensure('OrderSetups',{companyId:company.id},{companyId:company.id,minDays:0,maxDays:30});
    const customer = await ensure('Customers',{email:'cliente@sellou-homologacao.example',companyId:company.id},{corporateName:'Cliente Ficticio Homologacao',fantasyName:'Cliente Ficticio',document:'00000000000000',email:'cliente@sellou-homologacao.example',phoneNumber:'00000000000',cep:'00000000',address:'Rua Ficticia 0',city:'Cidade Ficticia',UF:'SP',neighborhood:'Bairro Ficticio',creditLimit:10000,creditLimitUsed:0,status:'ACTIVE',customerType:'END_CONSUMER',taxRegime:'SIMPLES_NACIONAL',subSegmentId:subSegment.id,companyId:company.id});
    await ensure('CustomerPaymentConditions',{customerId:customer.id,paymentConditionId:condition.id},{customerId:customer.id,paymentConditionId:condition.id});
    await ensure('CustomerPaymentMethods',{customerId:customer.id,paymentMethodId:method.id},{customerId:customer.id,paymentMethodId:method.id});
    await ensure('customer_sellers',{customerId:customer.id,userId:user.id},{customerId:customer.id,userId:user.id});
    const product = await ensure('Products',{reference:'DEV-PROD-001',companyId:company.id},{name:'Produto Ficticio Homologacao',description:'Produto ficticio sem imagem ou integracao externa',reference:'DEV-PROD-001',price:100,minPrice:100,stock:100,unitOfMeasure:'UN',brand:'Marca Ficticia',active:true,favorite:false,companyId:company.id});
    await ensure('StockMovements',{productId:product.id,type:'IN',orderId:null},{productId:product.id,type:'IN',orderId:null,quantity:100});
    await ensure('ProductSubCategories',{productId:product.id,subCategoryId:subCategory.id},{productId:product.id,subCategoryId:subCategory.id});
    const priceTable = await ensure('PriceTables',scoped('Tabela Ficticia Homologacao'),{...scoped('Tabela Ficticia Homologacao'),description:'Precos de teste',price:0,status:'ACTIVE'});
    await ensure('PriceTableItems',{priceTableId:priceTable.id,productId:product.id},{priceTableId:priceTable.id,productId:product.id,manualPrice:100,isManual:true});
    const order = await ensure('Orders',{purchaseOrderNumber:'DEV-ORC-001',companyId:company.id},{purchaseOrderNumber:'DEV-ORC-001',observation:'Orcamento ficticio; sem faturamento ou envio',companyId:company.id,customerId:customer.id,responsibleUserId:user.id,paymentConditionId:condition.id,paymentMethodId:method.id,status:'ON_BUDGET',totalValue:200,amountPaid:0,discount:0,isCustomerClientOrder:false});
    await ensure('OrderItems',{orderId:order.id,productId:product.id},{orderId:order.id,productId:product.id,quantity:2,discount:0});
    await ensure('order_responsible_users',{orderId:order.id,userId:user.id},{orderId:order.id,userId:user.id});
    await client.query('COMMIT');
    console.log(JSON.stringify({database:'sellou_homologacao',companyId:company.id,userId:user.id,customerId:customer.id,productId:product.id,orderId:order.id,email:EMAIL,created},null,2));
  } catch(error) {
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  } finally { await client.end(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

-- ============================================================
-- SEEDS DE PEDIDOS PARA TESTAR RELATÓRIOS (Alfa Soluções)
-- ============================================================
-- Este arquivo adiciona pedidos distribuídos entre Jul/2025
-- e Jun/2026 para testar os filtros mês/ano dos relatórios.
-- Deve ser executado APÓS o seeds.sql principal.
-- ============================================================

-- ============================================================
-- PEDIDOS (Orders)
-- ============================================================

-- -------------------------------------------------------
-- JULHO 2025
-- -------------------------------------------------------

-- Pedido 8: Indústria Nacional - DELIVERED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Pedido mensal de materiais de limpeza',
    1896.00, 0, 'DELIVERED', FALSE,
    1896.00, '2025-07-15',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-07-01T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-07-02T09:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-07-03T10:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-07-05T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-07-01 08:00:00Z'::timestamptz, '2025-07-05 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Indústria Nacional' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 9: Hospital Vida Plena - INVOICED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Compra emergencial de EPIs',
    0, 0, 'INVOICED', FALSE,
    1325.00, '2025-07-20',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'patricia.lima@alfa.com')::text || ',"createdAt":"2025-07-08T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-07-10T11:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2025-07-08 10:00:00Z'::timestamptz, '2025-07-10 11:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Hospital Vida Plena' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- AGOSTO 2025
-- -------------------------------------------------------

-- Pedido 10: Oliveira Comercial - DELIVERED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Material de escritório - reposição',
    617.00, 0, 'DELIVERED', FALSE,
    617.00, '2025-08-10',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-08-01T09:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-08-02T10:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-08-03T11:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-08-05T16:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-08-01 09:00:00Z'::timestamptz, '2025-08-05 16:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Oliveira Comercial' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 11: Forte Engenharia - DISPATCHED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Ferramentas para obra',
    0, 0, 'DISPATCHED', FALSE,
    1599.00, '2025-08-25',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-08-10T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-08-12T09:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-08-14T10:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2025-08-10 08:00:00Z'::timestamptz, '2025-08-14 10:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Forte Engenharia' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- SETEMBRO 2025
-- -------------------------------------------------------

-- Pedido 12: Tech Solutions - DELIVERED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Atualização de parque de micros',
    10198.00, 50.00, 'DELIVERED', FALSE,
    10148.00, '2025-09-15',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-09-01T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-09-03T08:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-09-05T09:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-09-08T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Transferência Bancária' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60/90 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-09-01 10:00:00Z'::timestamptz, '2025-09-08 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 13: Hospital Vida Plena - APPROVED (Carlos Eduardo, pedido portal cliente)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Pedido de insumos hospitalares via portal',
    0, 0, 'APPROVED', TRUE,
    580.00, '2025-09-30',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'paulo.souza@hospitalvidaplena.com.br')::text || ',"createdAt":"2025-09-15T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '45 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'paulo.souza@hospitalvidaplena.com.br'),
    c.id, cmp.id, '2025-09-15 14:00:00Z'::timestamptz, '2025-09-15 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Hospital Vida Plena' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- OUTUBRO 2025
-- -------------------------------------------------------

-- Pedido 14: Indústria Nacional - DELIVERED (Fernando)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Fornecimento de água mineral mensal',
    456.00, 0, 'DELIVERED', FALSE,
    456.00, '2025-10-10',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-10-01T09:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-10-02T10:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-10-03T11:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-10-05T15:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    c.id, cmp.id, '2025-10-01 09:00:00Z'::timestamptz, '2025-10-05 15:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Indústria Nacional' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 15: Oliveira Comercial - INVOICED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Equipamentos de informática',
    0, 0, 'INVOICED', FALSE,
    5598.00, '2025-10-28',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-10-15T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-10-17T09:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Transferência Bancária' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-10-15 08:00:00Z'::timestamptz, '2025-10-17 09:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Oliveira Comercial' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- NOVEMBRO 2025
-- -------------------------------------------------------

-- Pedido 16: Tech Solutions - DELIVERED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Material de expediente mensal',
    364.00, 0, 'DELIVERED', FALSE,
    364.00, '2025-11-12',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-11-03T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-11-04T11:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-11-05T12:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-11-07T16:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2025-11-03 10:00:00Z'::timestamptz, '2025-11-07 16:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 17: Forte Engenharia - DELIVERED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Compra de EPIs para obra',
    935.00, 0, 'DELIVERED', FALSE,
    935.00, '2025-11-25',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-11-10T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-11-12T09:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-11-13T10:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-11-15T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-11-10 08:00:00Z'::timestamptz, '2025-11-15 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Forte Engenharia' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- DEZEMBRO 2025
-- -------------------------------------------------------

-- Pedido 18: Hospital Vida Plena - DELIVERED (Fernando)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Pedido mensal dezembro - limpeza e EPIs',
    1068.00, 0, 'DELIVERED', FALSE,
    1068.00, '2025-12-15',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-12-01T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-12-02T11:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-12-03T12:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-12-05T15:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '45 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    c.id, cmp.id, '2025-12-01 10:00:00Z'::timestamptz, '2025-12-05 15:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Hospital Vida Plena' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 19: Indústria Nacional - INVOICED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Compra de notebooks para equipe de vendas',
    0, 200.00, 'INVOICED', FALSE,
    19498.00, '2025-12-30',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-12-10T09:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-12-12T10:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Transferência Bancária' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60/90 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-12-10 09:00:00Z'::timestamptz, '2025-12-12 10:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Indústria Nacional' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- JANEIRO 2026
-- -------------------------------------------------------

-- Pedido 20: Tech Solutions - DELIVERED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Material de escritório e limpeza - início ano',
    652.00, 0, 'DELIVERED', FALSE,
    652.00, '2026-01-15',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-01-05T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-01-06T09:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-01-07T10:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-01-10T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2026-01-05 08:00:00Z'::timestamptz, '2026-01-10 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 21: Oliveira Comercial - DELIVERED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Material promocional de verão',
    1038.00, 0, 'DELIVERED', FALSE,
    1038.00, '2026-01-25',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-01-12T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-01-14T08:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-01-15T09:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-01-18T16:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2026-01-12 10:00:00Z'::timestamptz, '2026-01-18 16:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Oliveira Comercial' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- FEVEREIRO 2026
-- -------------------------------------------------------

-- Pedido 22: Hospital Vida Plena - DELIVERED (Fernando)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Pedido mensal fevereiro - insumos hospitalares',
    1118.00, 0, 'DELIVERED', FALSE,
    1118.00, '2026-02-12',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-02-02T09:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-02-03T10:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-02-04T11:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-02-06T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '45 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    c.id, cmp.id, '2026-02-02 09:00:00Z'::timestamptz, '2026-02-06 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Hospital Vida Plena' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 23: Forte Engenharia - INVOICED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Ferramentas e EPIs para nova obra',
    0, 0, 'INVOICED', FALSE,
    2175.00, '2026-02-28',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-02-10T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-02-12T09:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2026-02-10 08:00:00Z'::timestamptz, '2026-02-12 09:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Forte Engenharia' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- MARÇO 2026
-- -------------------------------------------------------

-- Pedido 24: Indústria Nacional - DELIVERED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Pedido de limpeza e higiene - março',
    567.00, 0, 'DELIVERED', FALSE,
    567.00, '2026-03-10',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-03-02T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-03-03T11:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-03-04T12:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-03-06T15:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2026-03-02 10:00:00Z'::timestamptz, '2026-03-06 15:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Indústria Nacional' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 25: Tech Solutions - DISPATCHED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Upgrade de monitores - 10 unidades',
    0, 50.00, 'DISPATCHED', FALSE,
    8940.00, '2026-03-25',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-03-10T09:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-03-12T10:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-03-14T11:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Transferência Bancária' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60/90 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2026-03-10 09:00:00Z'::timestamptz, '2026-03-14 11:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- ABRIL 2026
-- -------------------------------------------------------

-- Pedido 26: Oliveira Comercial - DELIVERED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Materiais diversos para revenda',
    2695.00, 0, 'DELIVERED', FALSE,
    2695.00, '2026-04-15',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-04-01T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-04-02T11:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-04-03T12:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-04-05T15:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2026-04-01 10:00:00Z'::timestamptz, '2026-04-05 15:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Oliveira Comercial' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 27: Hospital Vida Plena - DELIVERED (Fernando)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Pedido mensal abril - limpeza hospitalar',
    868.00, 0, 'DELIVERED', FALSE,
    868.00, '2026-04-20',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-04-05T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-04-06T09:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-04-07T10:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-04-09T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    c.id, cmp.id, '2026-04-05 08:00:00Z'::timestamptz, '2026-04-09 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Hospital Vida Plena' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- MAIO 2026
-- -------------------------------------------------------

-- Pedido 28: Indústria Nacional - DELIVERED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Materiais de limpeza e EPIs - maio',
    790.00, 0, 'DELIVERED', FALSE,
    790.00, '2026-05-12',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-05-04T09:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-05-05T10:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-05-06T11:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-05-08T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2026-05-04 09:00:00Z'::timestamptz, '2026-05-08 14:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Indústria Nacional' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 29: Tech Solutions - INVOICED (Luciana)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Renovação de parque tecnológico',
    0, 0, 'INVOICED', FALSE,
    14297.00, '2026-05-30',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-05-10T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-05-12T09:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Transferência Bancária' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60/90 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2026-05-10 08:00:00Z'::timestamptz, '2026-05-12 09:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções';

-- -------------------------------------------------------
-- JUNHO 2026
-- -------------------------------------------------------

-- Pedido 30: Forte Engenharia - DELIVERED (Fernando)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Materiais para obra de grande porte',
    4525.00, 0, 'DELIVERED', FALSE,
    4525.00, '2026-06-15',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-06-01T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-06-02T11:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-06-03T12:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-06-05T15:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    c.id, cmp.id, '2026-06-01 10:00:00Z'::timestamptz, '2026-06-05 15:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Forte Engenharia' AND cmp."fantasyName" = 'Alfa Soluções';

-- Pedido 31: Hospital Vida Plena - INVOICED (Carlos Eduardo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Compra de EPIs e limpeza - junho',
    0, 0, 'INVOICED', FALSE,
    1220.00, '2026-06-28',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2026-06-10T09:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2026-06-12T10:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2026-06-10 09:00:00Z'::timestamptz, '2026-06-12 10:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Hospital Vida Plena' AND cmp."fantasyName" = 'Alfa Soluções';

-- ============================================================
-- ITENS DOS PEDIDOS (OrderItems)
-- ============================================================

-- Pedido 8 (Indústria Nacional - DELIVERED, Jul/2025): Detergente + Sabão + Álcool
INSERT INTO "OrderItems" ("quantity", "discount", "orderId", "productId", "createdAt", "updatedAt")
SELECT 20, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1896.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1896.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 40, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1896.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 9 (Hospital Vida Plena - INVOICED, Jul/2025): Luvas + Máscaras + Fita
SELECT 15, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1325.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1325.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1325.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 10 (Oliveira Comercial - DELIVERED, Ago/2025): Papel + Canetas + Caixa
SELECT 15, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 617.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 2, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 617.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 617.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 11 (Forte Engenharia - DISPATCHED, Ago/2025): Parafusadeira + Luva + Fita
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1599.00 AND p."reference" = 'PAR-BOS-550' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1599.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 25, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1599.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 12 (Tech Solutions - DELIVERED, Set/2025): Notebook + Monitor + Teclado
SELECT 1, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 10148.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 4, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 10148.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 10148.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 13 (Hospital Vida Plena - APPROVED, Set/2025): Álcool + Máscara + Luva
SELECT 30, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 580.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 580.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 580.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 14 (Indústria Nacional - DELIVERED, Out/2025): Água Mineral
SELECT 12, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 456.00 AND p."reference" = 'AGU-MIN-20' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 15 (Oliveira Comercial - INVOICED, Out/2025): Monitor + Mouse + Teclado
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 5598.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 5598.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 5598.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 16 (Tech Solutions - DELIVERED, Nov/2025): Papel + Canetas + Detergente
SELECT 8, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 364.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 2, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 364.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 364.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 17 (Forte Engenharia - DELIVERED, Nov/2025): Luva + Máscara + Fita
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 935.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 935.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 935.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 18 (Hospital Vida Plena - DELIVERED, Dez/2025): Detergente + Sabão + Álcool + Luva
SELECT 8, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 12, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 4, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 19 (Indústria Nacional - INVOICED, Dez/2025): Notebook x4
SELECT 4, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 19498.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 2, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 19498.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 20 (Tech Solutions - DELIVERED, Jan/2026): Papel + Canetas + Caixa + Detergente
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 2, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 4, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 6, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 21 (Oliveira Comercial - DELIVERED, Jan/2026): Teclado + Mouse + Caixa + Fita
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 20, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 22 (Hospital Vida Plena - DELIVERED, Fev/2026): Detergente + Sabão + Álcool + Luva + Máscara
SELECT 6, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 25, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 23 (Forte Engenharia - INVOICED, Fev/2026): Parafusadeira x3 + Luva x10 + Fita x50
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2175.00 AND p."reference" = 'PAR-BOS-550' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2175.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 50, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2175.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 24 (Indústria Nacional - DELIVERED, Mar/2026): Detergente + Sabão + Álcool
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 567.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 8, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 567.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 25, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 567.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 25 (Tech Solutions - DISPATCHED, Mar/2026): Monitor x10
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 8940.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 26 (Oliveira Comercial - DELIVERED, Abr/2026): Notebook + Teclado + Mouse
SELECT 1, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2695.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 8, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2695.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2695.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 27 (Hospital Vida Plena - DELIVERED, Abr/2026): Detergente + Sabão + Álcool + Luva
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 15, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 20, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 28 (Indústria Nacional - DELIVERED, Mai/2026): Luva + Máscara + Detergente
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 790.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 790.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 790.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 29 (Tech Solutions - INVOICED, Mai/2026): Notebook + Monitor + Teclado + Mouse
SELECT 2, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 14297.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 3, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 14297.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 14297.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 14297.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 30 (Forte Engenharia - DELIVERED, Jun/2026): Parafusadeira x5 + Luva x20 + Máscara x10 + Fita x100
SELECT 5, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'PAR-BOS-550' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 20, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 100, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 31 (Hospital Vida Plena - INVOICED, Jun/2026): Luva + Máscara + Detergente + Sabão + Álcool
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1220.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 8, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1220.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1220.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 20, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1220.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1220.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- ============================================================
-- MOVIMENTAÇÕES DE ESTOQUE (StockMovements)
-- Saídas referentes aos pedidos entregues/faturados/despachados
-- ============================================================

-- Pedido 8 (Indústria Nacional - DELIVERED)
INSERT INTO "StockMovements" ("quantity", "type", "productId", "orderId", "createdAt", "updatedAt")
SELECT 20, 'OUT'::"enum_StockMovements_type", p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1896.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1896.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 40, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1896.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 10 (Oliveira Comercial - DELIVERED)
SELECT 15, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 617.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 2, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 617.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 3, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 617.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 11 (Forte Engenharia - DISPATCHED)
SELECT 3, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1599.00 AND p."reference" = 'PAR-BOS-550' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1599.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 25, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1599.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 12 (Tech Solutions - DELIVERED)
SELECT 1, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 10148.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 4, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 10148.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 10148.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 14 (Indústria Nacional - DELIVERED)
SELECT 12, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 456.00 AND p."reference" = 'AGU-MIN-20' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 16 (Tech Solutions - DELIVERED)
SELECT 8, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 364.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 2, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 364.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 364.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 17 (Forte Engenharia - DELIVERED)
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 935.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 935.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 935.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 18 (Hospital Vida Plena - DELIVERED)
SELECT 8, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 12, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 30, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 4, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1068.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 20 (Tech Solutions - DELIVERED)
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 2, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 4, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 6, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 652.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 21 (Oliveira Comercial - DELIVERED)
SELECT 3, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 3, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 20, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1038.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 22 (Hospital Vida Plena - DELIVERED)
SELECT 6, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 25, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 3, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 1118.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 24 (Indústria Nacional - DELIVERED)
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 567.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 8, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 567.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 25, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 567.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 26 (Oliveira Comercial - DELIVERED)
SELECT 1, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2695.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 8, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2695.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 2695.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 27 (Hospital Vida Plena - DELIVERED)
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 15, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 20, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 868.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 28 (Indústria Nacional - DELIVERED)
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 790.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 790.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 790.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Indústria Nacional'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
-- Pedido 30 (Forte Engenharia - DELIVERED)
SELECT 5, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'PAR-BOS-550' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 20, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 100, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4525.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id AND o."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

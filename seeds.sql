-- ============================================================
-- SEEDS COMPLETOS - Demo Sellou
-- ============================================================
-- Este arquivo povoa o banco com dados realistas para
-- demonstrar todas as funcionalidades do sistema.
-- Pode ser executado múltiplas vezes sem duplicar dados.
-- ============================================================

-- Limpa dados existentes antes de inserir
-- Lista TODAS as tabelas explicitamente para que o PostgreSQL
-- resolva dependências circulares (Users <-> Customers) internamente.
TRUNCATE TABLE
    "Companies",
    "Segments",
    "SubSegments",
    "Categories",
    "SubCategories",
    "Products",
    "ProductPhotos",
    "ProductSubCategories",
    "PaymentConditions",
    "PaymentMethods",
    "OrderSetups",
    "Customers",
    "CustomerPaymentConditions",
    "CustomerPaymentMethods",
    "Users",
    "UserHierarchies",
    "Orders",
    "OrderItems",
    "StockMovements",
    "PriceTables",
    "PriceTableItems",
    "PriceTableRules",
    "AccessRequests",
    "UserGoals",
    "UserGoalProducts"
RESTART IDENTITY CASCADE;

-- ============================================================
-- 1. EMPRESAS (Companies)
-- ============================================================
INSERT INTO "Companies" (
    "corporateName",
    "fantasyName",
    "cnpj",
    "status",
    "logoUrl",
    "customColor",
    "shopColor",
    "allowOrdersWithoutStock",
    "createdAt",
    "updatedAt"
) VALUES
('Alfa Distribuidora S.A.',           'Alfa Soluções',  '00111222000101', 'ACTIVE',  NULL, '2563EB', '2563EB', TRUE,  '2023-01-15 10:00:00Z', '2025-06-10 14:30:00Z'),
('Beta Tecnologia Ltda.',              'Beta Tech',      '11222333000111', 'ACTIVE',  NULL, '059669', '059669', FALSE, '2022-07-01 09:00:00Z', '2025-05-20 11:00:00Z'),
('Gamma Comércio e Serviços EIRELI',   'Gamma Serviços', '22333444000122', 'ACTIVE',  NULL, 'DC2626', 'DC2626', TRUE,  '2021-11-20 15:00:00Z', '2025-04-15 08:00:00Z');

-- ============================================================
-- 2. SEGMENTOS (Segments)
-- ============================================================
INSERT INTO "Segments" ("name", "description", "companyId", "createdAt", "updatedAt")
SELECT 'Tecnologia',  'Empresas de TI, software e equipamentos eletrônicos', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Varejo',      'Comércio varejista e atacadista',                    id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Indústria',   'Indústrias de transformação e manufatura',          id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Serviços',    'Prestação de serviços profissionais',               id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Saúde',       'Hospitais, clínicas e laboratórios',                id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 3. SUBSEGMENTOS (SubSegments)
-- ============================================================
INSERT INTO "SubSegments" ("name", "segmentId", "createdAt", "updatedAt")
SELECT 'Software',             id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Tecnologia' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Hardware',             id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Tecnologia' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Supermercados',        id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Varejo'     AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Material de Construção', id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Varejo'   AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Metalúrgica',          id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Indústria' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Alimentícia',          id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Indústria' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Consultoria',          id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Serviços'  AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Laboratórios',         id, NOW(), NOW() FROM "Segments" WHERE "name" = 'Saúde'     AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- ============================================================
-- 4. CATEGORIAS (Categories)
-- ============================================================
INSERT INTO "Categories" ("name", "description", "companyId", "createdAt", "updatedAt")
SELECT 'Eletrônicos e Informática', 'Computadores, periféricos e acessórios', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Material de Escritório',    'Papéis, canetas e materiais para o dia a dia', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Limpeza e Higiene',         'Produtos de limpeza profissional e higiene', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Ferramentas e EPIs',        'Ferramentas elétricas, manuais e equipamentos de segurança', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Alimentos e Bebidas',       'Alimentos não perecíveis e bebidas', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 5. SUBCATEGORIAS (SubCategories)
-- ============================================================
-- Eletrônicos
INSERT INTO "SubCategories" ("name", "categoryId", "createdAt", "updatedAt")
SELECT 'Notebooks',  id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Eletrônicos e Informática' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Monitores',  id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Eletrônicos e Informática' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Periféricos',id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Eletrônicos e Informática' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- Material de Escritório
INSERT INTO "SubCategories" ("name", "categoryId", "createdAt", "updatedAt")
SELECT 'Papéis e Cadernos',     id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Material de Escritório' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Canetas e Marcadores',  id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Material de Escritório' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Organização',           id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Material de Escritório' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- Limpeza
INSERT INTO "SubCategories" ("name", "categoryId", "createdAt", "updatedAt")
SELECT 'Limpeza Geral',    id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Limpeza e Higiene' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'Higiene Pessoal',  id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Limpeza e Higiene' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- Ferramentas e EPIs
INSERT INTO "SubCategories" ("name", "categoryId", "createdAt", "updatedAt")
SELECT 'Ferramentas Elétricas', id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Ferramentas e EPIs' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
UNION ALL
SELECT 'EPIs',                  id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Ferramentas e EPIs' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- Alimentos e Bebidas
INSERT INTO "SubCategories" ("name", "categoryId", "createdAt", "updatedAt")
SELECT 'Bebidas', id, NOW(), NOW() FROM "Categories" WHERE "name" = 'Alimentos e Bebidas' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- ============================================================
-- 6. PRODUTOS (Products)
-- ============================================================
-- companyId = Alfa Soluções
INSERT INTO "Products" ("name", "description", "price", "stock", "active", "brand", "ncm", "unitOfMeasure", "reference", "barcode", "companyId", "createdAt", "updatedAt")
SELECT 'Notebook Dell Inspiron 15 3000',    'Intel Core i5 8GB 256GB SSD Tela 15.6 Polegadas Windows 11',          4599.00, 15, TRUE, 'Dell',    '84713019', 'UN', 'NOTE-DELL-I15', '7898765400011', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Monitor LG 24MK430H',               'Monitor LED 24 Full HD HDMI VGA',                                     899.00,  28, TRUE, 'LG',      '85285210', 'UN', 'MON-LG-24',    '7898765400028', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Teclado Wireless Logitech K380',    'Teclado sem fio Bluetooth Multi-dispositivo',                          189.00,  50, TRUE, 'Logitech','84716059', 'UN', 'TEC-LOG-K380', '7898765400035', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Mouse Óptico USB Dell',             'Mouse óptico com fio 3 botoes',                                       45.00,   80, TRUE, 'Dell',   '84716069', 'UN', 'MOU-DELL-USB', '7898765400042', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Papel A4 Chamex 500 folhas',        'Papel sulfite branco A4 75g/m2 pacote com 500 folhas',                28.00,   200, TRUE,'Chamex', '48025610', 'PCT','PAP-A4-CHM',   '7898765400059', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Caneta Esferográfica Azul cx50',    'Caneta esferográfica ponta média 1.0mm azul caixa com 50 unidades',   89.00,   120, TRUE,'Bic',    '96081000', 'CX', 'CAN-BIC-AZ50', '7898765400066', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Detergente Líquido Neutro 5L',      'Detergente líquido neutro concentrado galão 5 litros',                18.00,   300, TRUE,'Ypê',    '34022000', 'UN', 'DET-YPE-5L',  '7898765400073', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Sabão em Pó OMO 1kg',               'Sabão em pó para lavar roupas pacote 1kg',                           12.00,   250, TRUE,'OMO',    '34011190', 'UN', 'SAB-OMO-1K',  '7898765400080', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Álcool em Gel 70% 500ml',           'Álcool em gel antisséptico 70% frasco 500ml',                        9.00,    500, TRUE,'Rioquimica','38089419','UN','ALC-RIO-500','7898765400097', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Luva de Látex Descartável cx100',   'Luva de látex para procedimentos não cirúrgicos caixa com 100 pares', 45.00,   180, TRUE,'Descarpack','61161000','CX','LUV-DES-100','7898765400103', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Fita Crepe 50mm x 50m',             'Fita crepe para pintura e uso geral 50mm x 50 metros',               12.00,   400, TRUE,'3M',      '39191000', 'UN', 'FIT-3M-CRP',  '7898765400110', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Caixa Organizadora Plástica 30L',   'Caixa organizadora plástica resistente 30 litros',                   35.00,   90,  TRUE,'PlastBox','39231090', 'UN', 'CAI-PBX-30',  '7898765400127', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Parafusadeira Elétrica Bosch',       'Parafusadeira elétrica 220V 550W com mandril universal',              299.00,  35,  TRUE,'Bosch',  '84672100', 'UN', 'PAR-BOS-550', '7898765400134', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Máscara Descartável Tripla cx50',   'Máscara de proteção tripla camada com elástico caixa 50 unidades',    25.00,   350, TRUE,'DescartM','63079010', 'CX','MAS-DES-50',  '7898765400141', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Água Mineral Galão 20L',            'Água mineral natural galão retornável 20 litros',                    38.00,   60,  TRUE,'Minalba','22011000', 'UN', 'AGU-MIN-20', '7898765400158', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 7. FOTOS DOS PRODUTOS (ProductPhotos)
-- ============================================================
INSERT INTO "ProductPhotos" ("url", "description", "productId", "createdAt", "updatedAt")
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Notebook+Dell',       'Notebook Dell Inspiron 15',  id, NOW(), NOW() FROM "Products" WHERE "reference" = 'NOTE-DELL-I15'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Monitor+LG',          'Monitor LG 24',              id, NOW(), NOW() FROM "Products" WHERE "reference" = 'MON-LG-24'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Teclado+Logitech',    'Teclado Logitech K380',      id, NOW(), NOW() FROM "Products" WHERE "reference" = 'TEC-LOG-K380'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Mouse+Dell',          'Mouse Dell USB',             id, NOW(), NOW() FROM "Products" WHERE "reference" = 'MOU-DELL-USB'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Papel+A4',            'Papel A4 Chamex',            id, NOW(), NOW() FROM "Products" WHERE "reference" = 'PAP-A4-CHM'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Canetas+Azul',        'Caneta Bic Azul cx50',       id, NOW(), NOW() FROM "Products" WHERE "reference" = 'CAN-BIC-AZ50'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Detergente+5L',       'Detergente Ype 5L',          id, NOW(), NOW() FROM "Products" WHERE "reference" = 'DET-YPE-5L'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Sabao+OMO',           'Sabao OMO 1kg',              id, NOW(), NOW() FROM "Products" WHERE "reference" = 'SAB-OMO-1K'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Alcool+em+Gel',       'Alcool em Gel 500ml',        id, NOW(), NOW() FROM "Products" WHERE "reference" = 'ALC-RIO-500'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Luvas+cx100',         'Luva latex cx100',           id, NOW(), NOW() FROM "Products" WHERE "reference" = 'LUV-DES-100'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Fita+Crepe',          'Fita Crepe 3M',              id, NOW(), NOW() FROM "Products" WHERE "reference" = 'FIT-3M-CRP'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Caixa+30L',           'Caixa Organizadora 30L',     id, NOW(), NOW() FROM "Products" WHERE "reference" = 'CAI-PBX-30'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Parafusadeira',       'Parafusadeira Bosch',        id, NOW(), NOW() FROM "Products" WHERE "reference" = 'PAR-BOS-550'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Mascara+cx50',        'Mascara tripla cx50',        id, NOW(), NOW() FROM "Products" WHERE "reference" = 'MAS-DES-50'
UNION ALL
SELECT 'https://placehold.co/400x400/2563EB/FFFFFF?text=Agua+20L',            'Agua Mineral 20L',           id, NOW(), NOW() FROM "Products" WHERE "reference" = 'AGU-MIN-20';

-- ============================================================
-- 8. RELACIONAMENTO PRODUTO <-> SUBCATEGORIA
-- ============================================================
INSERT INTO "ProductSubCategories" ("productId", "subCategoryId", "createdAt", "updatedAt")
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'NOTE-DELL-I15' AND sc."name" = 'Notebooks'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Eletrônicos e Informática' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'MON-LG-24' AND sc."name" = 'Monitores'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Eletrônicos e Informática' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'TEC-LOG-K380' AND sc."name" = 'Periféricos'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Eletrônicos e Informática' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'MOU-DELL-USB' AND sc."name" = 'Periféricos'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Eletrônicos e Informática' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'PAP-A4-CHM' AND sc."name" = 'Papéis e Cadernos'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Material de Escritório' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'CAN-BIC-AZ50' AND sc."name" = 'Canetas e Marcadores'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Material de Escritório' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'CAI-PBX-30' AND sc."name" = 'Organização'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Material de Escritório' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'DET-YPE-5L' AND sc."name" = 'Limpeza Geral'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Limpeza e Higiene' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'SAB-OMO-1K' AND sc."name" = 'Limpeza Geral'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Limpeza e Higiene' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'ALC-RIO-500' AND sc."name" = 'Higiene Pessoal'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Limpeza e Higiene' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'LUV-DES-100' AND sc."name" = 'EPIs'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Ferramentas e EPIs' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'MAS-DES-50' AND sc."name" = 'EPIs'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Ferramentas e EPIs' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'FIT-3M-CRP' AND sc."name" = 'Organização'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Material de Escritório' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'PAR-BOS-550' AND sc."name" = 'Ferramentas Elétricas'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Ferramentas e EPIs' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'))
UNION ALL
SELECT p.id, sc.id, NOW(), NOW()
FROM "Products" p, "SubCategories" sc
WHERE p."reference" = 'AGU-MIN-20' AND sc."name" = 'Bebidas'
  AND sc."categoryId" = (SELECT id FROM "Categories" WHERE "name" = 'Alimentos e Bebidas' AND "companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'));

-- ============================================================
-- 9. CONDIÇÕES DE PAGAMENTO (PaymentConditions)
-- ============================================================
INSERT INTO "PaymentConditions" ("name", "description", "companyId", "createdAt", "updatedAt")
SELECT 'À Vista',         'Pagamento à vista com 5% de desconto',             id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT '15 Dias',         'Pagamento em 15 dias corridos',                    id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT '30 Dias',         'Pagamento em 30 dias corridos',                    id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT '45 Dias',         'Pagamento em 45 dias corridos',                    id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT '30/60 Dias',      'Parcelado em 2x (30 e 60 dias)',                   id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT '30/60/90 Dias',   'Parcelado em 3x (30, 60 e 90 dias)',              id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 10. MÉTODOS DE PAGAMENTO (PaymentMethods)
-- ============================================================
INSERT INTO "PaymentMethods" ("name", "description", "companyId", "createdAt", "updatedAt")
SELECT 'Boleto Bancário', 'Boleto bancário registrado com vencimento na data escolhida', id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'PIX',             'Pagamento instantâneo via PIX (aprovado em minutos)',          id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Transferência Bancária', 'Transferência bancária para conta da empresa',          id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Cartão de Crédito', 'Pagamento via cartão de crédito (operadora externa)',         id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 11. CONFIGURAÇÃO DE PEDIDO (OrderSetups)
-- ============================================================
INSERT INTO "OrderSetups" ("minDays", "maxDays", "companyId", "createdAt", "updatedAt")
SELECT 1,  30, id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 2,  45, id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Beta Tech'
UNION ALL
SELECT 1,  60, id, NOW(), NOW() FROM "Companies" WHERE "fantasyName" = 'Gamma Serviços';

-- ============================================================
-- 12. CLIENTES (Customers)
-- ============================================================
INSERT INTO "Customers" (
    "corporateName", "fantasyName", "document", "creditLimit", "creditLimitUsed",
    "status", "customerType", "cep", "address", "city", "UF", "neighborhood",
    "phoneNumber", "email", "observations", "taxRegime", "operationNature",
    "invoiceEmail", "orderEmail", "customerGroupCode",
    "companyId", "subSegmentId", "createdAt", "updatedAt"
)
SELECT
    'Tech Solutions Comércio Ltda.',  'Tech Solutions', '33444555000133', 80000.00, 32000.00,
    'ACTIVE'::"enum_Customers_status", 'WHOLESALE'::"enum_Customers_customerType", '01311000', 'Av. Paulista, 1000', 'São Paulo', 'SP', 'Bela Vista',
    '+5511988880001', 'compras@techsolutions.com.br', 'Cliente premium, pagamentos em dia.',
    'LUCRO_PRESUMIDO'::"enum_Customers_taxRegime", 'Revenda de Produtos de TI',
    'faturamento@techsolutions.com.br', 'pedidos@techsolutions.com.br', 'PREMIUM',
    cmp.id, (SELECT id FROM "SubSegments" WHERE "name" = 'Hardware'), NOW(), NOW()
FROM "Companies" cmp WHERE cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    'Comercial Oliveira S.A.',  'Oliveira Comercial', '44555666000144', 45000.00, 15000.00,
    'ACTIVE'::"enum_Customers_status", 'RESALE'::"enum_Customers_customerType", '20040002', 'Rua da Alfândega, 200', 'Rio de Janeiro', 'RJ', 'Centro',
    '+5521988880002', 'admin@oliveiracomercial.com.br', 'Cliente em crescimento, bom potencial.',
    'SIMPLES_NACIONAL'::"enum_Customers_taxRegime", 'Comércio Varejista',
    'nf@oliveiracomercial.com.br', NULL, 'STANDARD',
    cmp.id, (SELECT id FROM "SubSegments" WHERE "name" = 'Supermercados'), NOW(), NOW()
FROM "Companies" cmp WHERE cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    'Indústria Nacional de Alimentos S.A.',  'Indústria Nacional', '55666777000155', 150000.00, 98000.00,
    'ACTIVE'::"enum_Customers_status", 'WHOLESALE'::"enum_Customers_customerType", '30140000', 'Av. Amazonas, 3500', 'Belo Horizonte', 'MG', 'Sion',
    '+5531988880003', 'suprimentos@industrianacional.com.br', 'Parceiro estratégico, contrato anual de fornecimento.',
    'LUCRO_REAL'::"enum_Customers_taxRegime", 'Indústria Alimentícia',
    'financeiro@industrianacional.com.br', 'compras@industrianacional.com.br', 'ESTRATEGICO',
    cmp.id, (SELECT id FROM "SubSegments" WHERE "name" = 'Alimentícia'), NOW(), NOW()
FROM "Companies" cmp WHERE cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    'Hospital Vida Plena S.A.',  'Hospital Vida Plena', '66777888000166', 200000.00, 145000.00,
    'ACTIVE'::"enum_Customers_status", 'END_CONSUMER'::"enum_Customers_customerType", '70040000', 'Setor Hospitalar Sul, Lote 10', 'Brasília', 'DF', 'Asa Sul',
    '+5561988880004', 'compras@hospitalvidaplena.com.br', 'Grande hospital, pedidos recorrentes de EPIs e limpeza.',
    'LUCRO_PRESUMIDO'::"enum_Customers_taxRegime", 'Prestação de Serviços Hospitalares',
    'faturamento@hospitalvidaplena.com.br', 'suprimentos@hospitalvidaplena.com.br', 'HOSPITALAR',
    cmp.id, (SELECT id FROM "SubSegments" WHERE "name" = 'Laboratórios'), NOW(), NOW()
FROM "Companies" cmp WHERE cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    'Construtora Forte Engenharia Ltda.',  'Forte Engenharia', '77888999000177', 60000.00, 12000.00,
    'ACTIVE'::"enum_Customers_status", 'WHOLESALE'::"enum_Customers_customerType", '80020000', 'Rua XV de Novembro, 500', 'Curitiba', 'PR', 'Centro',
    '+5541988880005', 'obras@forteengenharia.com.br', 'Novo cliente, primeiro pedido recente.',
    'LUCRO_REAL'::"enum_Customers_taxRegime", 'Construção Civil',
    'adm@forteengenharia.com.br', 'obras@forteengenharia.com.br', 'CONSTRUCAO',
    cmp.id, (SELECT id FROM "SubSegments" WHERE "name" = 'Material de Construção'), NOW(), NOW()
FROM "Companies" cmp WHERE cmp."fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 13. VÍNCULO CLIENTE <-> CONDIÇÃO DE PAGAMENTO
-- ============================================================
INSERT INTO "CustomerPaymentConditions" ("customerId", "paymentConditionId", "createdAt", "updatedAt")
SELECT c.id, pc.id, NOW(), NOW()
FROM "Customers" c, "PaymentConditions" pc
WHERE c."fantasyName" IN ('Tech Solutions', 'Oliveira Comercial', 'Indústria Nacional', 'Hospital Vida Plena', 'Forte Engenharia')
  AND pc."name" IN ('À Vista', '30 Dias', '30/60 Dias', '30/60/90 Dias')
  AND pc."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
  AND c."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- ============================================================
-- 14. VÍNCULO CLIENTE <-> MÉTODO DE PAGAMENTO
-- ============================================================
INSERT INTO "CustomerPaymentMethods" ("customerId", "paymentMethodId", "createdAt", "updatedAt")
SELECT c.id, pm.id, NOW(), NOW()
FROM "Customers" c, "PaymentMethods" pm
WHERE c."fantasyName" IN ('Tech Solutions', 'Oliveira Comercial', 'Indústria Nacional', 'Hospital Vida Plena', 'Forte Engenharia')
  AND pm."name" IN ('Boleto Bancário', 'PIX', 'Transferência Bancária')
  AND pm."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções')
  AND c."companyId" = (SELECT id FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções');

-- ============================================================
-- 15. USUÁRIOS (Users)
-- ============================================================
-- Senhas BCrypt (todas: "Teste@123"):
--   ADMIN (joao.silva@alfa.com):   $2b$10$FjSxQLs.AEFx0drzj3nMxOrvT7rXKEw5aK6fT/ry./S4Ca.hlY84.
--   INTERNAL (demais usuarios Alfa):$2b$10$8AITGv57diQoM3kpLzttqebdeXvxm2a9POiom78jf.pQqvo7Ef6RK
--   COMPANY_ADMIN (maria.oliveira):$2b$10$RBxm.05G1JvIINFowuogG.KpQfp/3DLCZuh2gaOX/xVkLD7N.nAtm
--   CUSTOMER (clientes):           $2b$10$IOq41sGbMeNmxT55LYWM/O2mamGXXYRR2.hTGJ9bGmA/IcpDcmpRy

INSERT INTO "Users" (
    "name", "email", "password", "role", "status", "position",
    "phoneNumber", "companyId", "customerId", "createdAt", "updatedAt"
)
-- Administrador global
SELECT 'João Silva',     'joao.silva@alfa.com',
    '$2b$10$FjSxQLs.AEFx0drzj3nMxOrvT7rXKEw5aK6fT/ry./S4Ca.hlY84.',
    'ADMINISTRATOR'::"enum_Users_role", 'ACTIVE'::"enum_Users_status", 'CEO',
    '+5511911112222', id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
-- Administradores da empresa
SELECT 'Ana Paula',      'ana.paula@alfa.com',
    '$2b$10$8AITGv57diQoM3kpLzttqebdeXvxm2a9POiom78jf.pQqvo7Ef6RK',
    'COMPANY_ADMINISTRATOR', 'ACTIVE', 'Analista Financeiro',
    '+5511977778888',     id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Maria Oliveira', 'maria.oliveira@beta.com',
    '$2b$10$RBxm.05G1JvIINFowuogG.KpQfp/3DLCZuh2gaOX/xVkLD7N.nAtm',
    'COMPANY_ADMINISTRATOR', 'ACTIVE', 'Gerente',
    '+5521933334444',     id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Beta Tech'
UNION ALL
-- Diretor de Vendas
SELECT 'Roberto Carlos', 'roberto.carlos@alfa.com',
    '$2b$10$8AITGv57diQoM3kpLzttqebdeXvxm2a9POiom78jf.pQqvo7Ef6RK',
    'DIRECTOR_OF_SALES', 'ACTIVE', 'Diretor de Vendas',
    '+5511933335555',     id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
-- Gerente Regional
SELECT 'Patrícia Lima',  'patricia.lima@alfa.com',
    '$2b$10$8AITGv57diQoM3kpLzttqebdeXvxm2a9POiom78jf.pQqvo7Ef6RK',
    'REGIONAL_MANAGER', 'ACTIVE', 'Gerente Regional SP',
    '+5511944446666',     id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
-- Coordenador de Vendas
SELECT 'Fernando Santos', 'fernando.santos@alfa.com',
    '$2b$10$8AITGv57diQoM3kpLzttqebdeXvxm2a9POiom78jf.pQqvo7Ef6RK',
    'SALES_COORDINATOR', 'ACTIVE', 'Coordenador de Vendas',
    '+5511955557777',     id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
-- Representante de Vendas
SELECT 'Luciana Mendes', 'luciana.mendes@alfa.com',
    '$2b$10$8AITGv57diQoM3kpLzttqebdeXvxm2a9POiom78jf.pQqvo7Ef6RK',
    'SALES_REP', 'ACTIVE', 'Representante de Vendas',
    '+5511966668888',     id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Carlos Eduardo', 'carlos.eduardo@alfa.com',
    '$2b$10$8AITGv57diQoM3kpLzttqebdeXvxm2a9POiom78jf.pQqvo7Ef6RK',
    'SALES_REP', 'ACTIVE', 'Representante de Vendas',
    '+5511977779999',     id, NULL::integer, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
-- Clientes (CustomerClient)
SELECT 'Carlos Souza',   'carlos.souza@techsolutions.com.br',
    '$2b$10$IOq41sGbMeNmxT55LYWM/O2mamGXXYRR2.hTGJ9bGmA/IcpDcmpRy',
    'CUSTOMER_CLIENT', 'ACTIVE', 'Comprador',
    '+5511955556666', NULL::integer, c.id, NOW(), NOW()
FROM "Customers" c WHERE c."fantasyName" = 'Tech Solutions'
UNION ALL
SELECT 'Marina Dias',    'marina.dias@industrianacional.com.br',
    '$2b$10$IOq41sGbMeNmxT55LYWM/O2mamGXXYRR2.hTGJ9bGmA/IcpDcmpRy',
    'CUSTOMER_CLIENT', 'ACTIVE', 'Analista de Suprimentos',
    '+5531988880100', NULL::integer, c.id, NOW(), NOW()
FROM "Customers" c WHERE c."fantasyName" = 'Indústria Nacional'
UNION ALL
SELECT 'Dr. Paulo Souza','paulo.souza@hospitalvidaplena.com.br',
    '$2b$10$IOq41sGbMeNmxT55LYWM/O2mamGXXYRR2.hTGJ9bGmA/IcpDcmpRy',
    'CUSTOMER_CLIENT', 'ACTIVE', 'Coordenador de Suprimentos Hospitalares',
    '+5561988880200', NULL::integer, c.id, NOW(), NOW()
FROM "Customers" c WHERE c."fantasyName" = 'Hospital Vida Plena';

-- ============================================================
-- 16. HIERARQUIA DE USUÁRIOS (UserHierarchy)
-- ============================================================
INSERT INTO "UserHierarchies" ("subordinateId", "managerId", "companyId", "createdAt", "updatedAt")
SELECT
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    (SELECT id FROM "Users" WHERE "email" = 'patricia.lima@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 17. PEDIDOS (Orders)
-- ============================================================
-- Pedido 1: Aprovado e entregue (mais antigo)
INSERT INTO "Orders" (
    "observation", "amountPaid", "discount", "status", "isCustomerClientOrder",
    "totalValue", "programmedDate",
    "statusHistory",
    "paymentMethodId", "paymentConditionId",
    "responsibleUserId", "customerId", "companyId", "createdAt", "updatedAt"
)
SELECT
    'Pedido regular de material de escritório',
    459.00, 0, 'DELIVERED'::"enum_Orders_status", FALSE,
    459.00, '2025-04-10'::date,
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-04-01T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-04-02T08:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-04-03T09:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-04-05T16:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-04-01 09:00:00Z'::timestamptz, '2025-04-05 16:00:00Z'::timestamptz
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
-- Pedido 2: Em aprovação
SELECT
    'Pedido de EPIs para obra',
    0, 0, 'IN_APPROVAL', FALSE,
    370.00, '2025-07-01',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"IN_APPROVAL","userId":' || (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com')::text || ',"createdAt":"2025-06-12T14:30:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2025-06-12 14:30:00Z', '2025-06-12 14:30:00Z'
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Forte Engenharia' AND cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
-- Pedido 3: Faturado (já emitido NF)
SELECT
    'Compra de materiais para estoque',
    3885.00, 120.00, 'INVOICED', FALSE,
    3765.00, '2025-06-28',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com')::text || ',"createdAt":"2025-06-10T11:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-06-12T09:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Transferência Bancária' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-06-10 11:00:00Z', '2025-06-12 09:00:00Z'
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
-- Pedido 4: Entregue (hospital)
SELECT
    'Pedido mensal de EPIs e limpeza',
    968.00, 0, 'DELIVERED', FALSE,
    968.00, '2025-06-15',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'patricia.lima@alfa.com')::text || ',"createdAt":"2025-06-01T08:00:00Z"},{"oldStatus":"APPROVED","newStatus":"INVOICED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-06-02T10:00:00Z"},{"oldStatus":"INVOICED","newStatus":"DISPATCHED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-06-03T11:00:00Z"},{"oldStatus":"DISPATCHED","newStatus":"DELIVERED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-06-05T14:00:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '45 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    c.id, cmp.id, '2025-06-01 08:00:00Z', '2025-06-05 14:00:00Z'
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Hospital Vida Plena' AND cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
-- Pedido 5: Orçamento (ainda não aprovado)
SELECT
    'Orçamento para equipamentos de TI',
    0, 0, 'ON_BUDGET', FALSE,
    5488.00, NULL,
    ('[]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    c.id, cmp.id, '2025-06-13 16:00:00Z', '2025-06-13 16:00:00Z'
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Oliveira Comercial' AND cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
-- Pedido 6: Pedido de cliente by customer client portal
SELECT
    'Pedido realizado pelo portal do cliente',
    0, 0, 'IN_APPROVAL', TRUE,
    8298.00, '2025-07-10',
    ('[{"oldStatus":"ON_BUDGET","newStatus":"IN_APPROVAL","userId":' || (SELECT id FROM "Users" WHERE "email" = 'carlos.souza@techsolutions.com.br')::text || ',"createdAt":"2025-06-14T09:15:00Z"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'Boleto Bancário' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = '30/60/90 Dias' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'carlos.souza@techsolutions.com.br'),
    c.id, cmp.id, '2025-06-14 09:15:00Z', '2025-06-14 09:15:00Z'
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções'
UNION ALL
-- Pedido 7: Cancelado
SELECT
    'Pedido cancelado por falta de estoque',
    0, 0, 'CANCELED', FALSE,
    4599.00, NULL,
    ('[{"oldStatus":"ON_BUDGET","newStatus":"APPROVED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com')::text || ',"createdAt":"2025-05-10T10:00:00Z"},{"oldStatus":"APPROVED","newStatus":"CANCELED","userId":' || (SELECT id FROM "Users" WHERE "email" = 'ana.paula@alfa.com')::text || ',"createdAt":"2025-05-12T15:00:00Z","cancelReason":"Produto indisponível em estoque"}]')::jsonb,
    (SELECT id FROM "PaymentMethods" WHERE "name" = 'PIX' AND "companyId" = cmp.id),
    (SELECT id FROM "PaymentConditions" WHERE "name" = 'À Vista' AND "companyId" = cmp.id),
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    c.id, cmp.id, '2025-05-10 10:00:00Z', '2025-05-12 15:00:00Z'
FROM "Customers" c, "Companies" cmp
WHERE c."fantasyName" = 'Tech Solutions' AND cmp."fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 18. ITENS DOS PEDIDOS (OrderItems)
-- ============================================================
-- Pedido 1 (Tech Solutions - DELIVERED): Papel A4 + Canetas + Caixa organizadora
INSERT INTO "OrderItems" ("quantity", "discount", "orderId", "productId", "createdAt", "updatedAt")
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 459.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 3,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 459.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 2,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 459.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
-- Pedido 2 (Forte Engenharia - IN_APPROVAL): Luvas + Máscaras + Fita
SELECT 4,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 370.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id
UNION ALL
SELECT 2,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 370.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 370.00 AND p."reference" = 'FIT-3M-CRP' AND c."fantasyName" = 'Forte Engenharia'
  AND o."customerId" = c.id
UNION ALL
-- Pedido 3 (Tech Solutions - INVOICED): Notebook + Monitor + Mouse
SELECT 1,  100.00, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 3765.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 2,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 3765.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 5,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 3765.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
-- Pedido 4 (Hospital - DELIVERED): Detergente + Sabão + Álcool + Luvas + Máscaras
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 15, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 20, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 5,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 3,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
-- Pedido 5 (Oliveira Comercial - ON_BUDGET): Teclado + Mouse + Monitor
SELECT 5,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 5488.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id
UNION ALL
SELECT 10, 0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 5488.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id
UNION ALL
SELECT 3,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 5488.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Oliveira Comercial'
  AND o."customerId" = c.id
UNION ALL
-- Pedido 6 (Tech Solutions by customer - IN_APPROVAL): Notebook + Monitor + Teclado
SELECT 1,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 8298.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 2,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 8298.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 3,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 8298.00 AND p."reference" = 'TEC-LOG-K380' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
-- Pedido 7 (Tech Solutions - CANCELED): Notebook
SELECT 1,  0, o.id, p.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 4599.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id;

-- ============================================================
-- 19. MOVIMENTAÇÕES DE ESTOQUE (StockMovements)
-- ============================================================
-- Saídas de estoque referentes aos pedidos entregues/faturados
INSERT INTO "StockMovements" ("quantity", "type", "productId", "orderId", "createdAt", "updatedAt")
SELECT 10, 'OUT'::"enum_StockMovements_type", p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 459.00 AND p."reference" = 'PAP-A4-CHM' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 3,  'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 459.00 AND p."reference" = 'CAN-BIC-AZ50' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 2,  'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 459.00 AND p."reference" = 'CAI-PBX-30' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 1,  'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 3765.00 AND p."reference" = 'NOTE-DELL-I15' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 2,  'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 3765.00 AND p."reference" = 'MON-LG-24' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 5,  'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 3765.00 AND p."reference" = 'MOU-DELL-USB' AND c."fantasyName" = 'Tech Solutions'
  AND o."customerId" = c.id
UNION ALL
SELECT 10, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'DET-YPE-5L' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 15, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'SAB-OMO-1K' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 20, 'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'ALC-RIO-500' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 5,  'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'LUV-DES-100' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id
UNION ALL
SELECT 3,  'OUT', p.id, o.id, NOW(), NOW()
FROM "Orders" o, "Products" p, "Customers" c
WHERE o."totalValue" = 968.00 AND p."reference" = 'MAS-DES-50' AND c."fantasyName" = 'Hospital Vida Plena'
  AND o."customerId" = c.id;

-- ============================================================
-- 20. TABELAS DE PREÇO (PriceTables)
-- ============================================================
INSERT INTO "PriceTables" ("name", "description", "adjustmentType", "adjustmentValue", "status", "companyId", "createdAt", "updatedAt")
SELECT 'Tabela Promocional Maio 2025', 'Preços especiais para clientes premium - Maio/2025', 'PERCENTAGE_DISCOUNT'::"enum_PriceTables_adjustmentType", 10.00, 'ACTIVE'::"enum_PriceTables_status", id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Tabela Hospitalar', 'Condições especiais para hospitais e clinicas', 'PERCENTAGE_DISCOUNT', 15.00, 'ACTIVE', id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Tabela Indústria', 'Preços diferenciados para indústrias parceiras', 'PERCENTAGE_DISCOUNT', 8.00, 'DRAFT', id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 21. ITENS DAS TABELAS DE PREÇO (PriceTableItems)
-- ============================================================
INSERT INTO "PriceTableItems" ("priceTableId", "productId", "manualPrice", "isManual", "createdAt", "updatedAt")
SELECT pt.id, p.id, 3999.00, TRUE, NOW(), NOW()
FROM "PriceTables" pt, "Products" p
WHERE pt."name" = 'Tabela Promocional Maio 2025' AND p."reference" = 'NOTE-DELL-I15'
UNION ALL
SELECT pt.id, p.id, 799.00, TRUE, NOW(), NOW()
FROM "PriceTables" pt, "Products" p
WHERE pt."name" = 'Tabela Promocional Maio 2025' AND p."reference" = 'MON-LG-24'
UNION ALL
SELECT pt.id, p.id, NULL, FALSE, NOW(), NOW()
FROM "PriceTables" pt, "Products" p
WHERE pt."name" = 'Tabela Hospitalar' AND p."reference" = 'LUV-DES-100'
UNION ALL
SELECT pt.id, p.id, NULL, FALSE, NOW(), NOW()
FROM "PriceTables" pt, "Products" p
WHERE pt."name" = 'Tabela Hospitalar' AND p."reference" = 'MAS-DES-50'
UNION ALL
SELECT pt.id, p.id, NULL, FALSE, NOW(), NOW()
FROM "PriceTables" pt, "Products" p
WHERE pt."name" = 'Tabela Hospitalar' AND p."reference" = 'DET-YPE-5L'
UNION ALL
SELECT pt.id, p.id, NULL, FALSE, NOW(), NOW()
FROM "PriceTables" pt, "Products" p
WHERE pt."name" = 'Tabela Hospitalar' AND p."reference" = 'ALC-RIO-500';

-- ============================================================
-- 22. SOLICITAÇÕES DE ACESSO (AccessRequests)
-- ============================================================
INSERT INTO "AccessRequests" ("fullName", "companyName", "phoneNumber", "cnpj", "email", "status", "companyId", "createdAt", "updatedAt")
SELECT 'Pedro Alves', 'Padaria Pão Quente Ltda.', '+5511988880500', '88999000188', 'pedro.alves@paoquente.com.br', 'PENDING'::"enum_AccessRequests_status", id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT 'Lucia Mendes', 'Mercearia do Bairro Ltda.', '+5511988880501', '99000111099', 'lucia@merceariabairro.com.br', 'REALIZED', id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 23. METAS DE USUÁRIOS (UserGoals)
-- ============================================================
INSERT INTO "UserGoals" ("targetValue", "currentValue", "type", "startDate", "endDate", "userId", "companyId", "createdAt", "updatedAt")
SELECT
    100000.00, 78000.00, 'sales_value'::"enum_UserGoals_type", '2025-06-01'::date, '2025-06-30'::date,
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    80000.00, 45000.00, 'sales_value', '2025-06-01', '2025-06-30',
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    5, 3, 'new_clients', '2025-06-01', '2025-06-30',
    (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    50, 32, 'line_items', '2025-06-01', '2025-06-30',
    (SELECT id FROM "Users" WHERE "email" = 'carlos.eduardo@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções'
UNION ALL
SELECT
    10, 8, 'clients_with_orders', '2025-06-01', '2025-06-30',
    (SELECT id FROM "Users" WHERE "email" = 'fernando.santos@alfa.com'),
    id, NOW(), NOW()
FROM "Companies" WHERE "fantasyName" = 'Alfa Soluções';

-- ============================================================
-- 24. PRODUTOS DAS METAS (UserGoalProducts)
-- ============================================================
INSERT INTO "UserGoalProducts" ("totalToSell", "userGoalId", "productId", "createdAt", "updatedAt")
SELECT
    15000.00, ug.id, p.id, NOW(), NOW()
FROM "UserGoals" ug, "Products" p
WHERE ug."type" = 'sales_value' AND p."reference" = 'NOTE-DELL-I15'
  AND ug."userId" = (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com')
UNION ALL
SELECT
    5000.00, ug.id, p.id, NOW(), NOW()
FROM "UserGoals" ug, "Products" p
WHERE ug."type" = 'sales_value' AND p."reference" = 'MON-LG-24'
  AND ug."userId" = (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com')
UNION ALL
SELECT
    3000.00, ug.id, p.id, NOW(), NOW()
FROM "UserGoals" ug, "Products" p
WHERE ug."type" = 'sales_value' AND p."reference" = 'LUV-DES-100'
  AND ug."userId" = (SELECT id FROM "Users" WHERE "email" = 'luciana.mendes@alfa.com');

-- ============================================================
-- 25. CORREÇÃO DE ESTOQUE APÓS MOVIMENTAÇÕES
-- Registra as entradas de estoque iniciais para cada produto
-- (iguais ao valor da coluna stock), para que a fórmula
--   saldo_atual = SUM(entradas) - SUM(saídas)
-- funcione corretamente nas views/consultas.
-- ============================================================
INSERT INTO "StockMovements" ("quantity", "type", "productId", "orderId", "createdAt", "updatedAt")
SELECT st.initial, 'IN'::"enum_StockMovements_type", p.id, NULL, NOW(), NOW()
FROM "Products" p
JOIN (VALUES
    ('NOTE-DELL-I15', 15),
    ('MON-LG-24',     28),
    ('TEC-LOG-K380',  50),
    ('MOU-DELL-USB',  80),
    ('PAP-A4-CHM',    200),
    ('CAN-BIC-AZ50',  120),
    ('DET-YPE-5L',    300),
    ('SAB-OMO-1K',    250),
    ('ALC-RIO-500',   500),
    ('LUV-DES-100',   180),
    ('FIT-3M-CRP',    400),
    ('CAI-PBX-30',    90),
    ('PAR-BOS-550',   35),
    ('MAS-DES-50',    350),
    ('AGU-MIN-20',    60)
) AS st(ref, initial) ON p."reference" = st.ref;

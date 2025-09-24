-- Script para verificar exatamente quais colunas existem na tabela propostas_corretores
-- e identificar o problema do erro PGRST204

-- 1. Verificar todas as colunas da tabela propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
ORDER BY ordinal_position;

-- 2. Verificar se a coluna 'bairro' existe especificamente
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as status_bairro,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
AND column_name = 'bairro';

-- 3. Verificar se existem colunas de endereço
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
AND (
    column_name LIKE '%endereco%' OR 
    column_name LIKE '%rua%' OR 
    column_name LIKE '%bairro%' OR 
    column_name LIKE '%cidade%' OR 
    column_name LIKE '%estado%' OR 
    column_name LIKE '%cep%'
)
ORDER BY column_name;

-- 4. Verificar se existem colunas básicas (nome, email, telefone)
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
AND column_name IN ('nome', 'email', 'telefone', 'cpf', 'rg')
ORDER BY column_name;

-- 5. Contar total de colunas
SELECT 
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores';

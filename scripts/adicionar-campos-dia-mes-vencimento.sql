-- Script para adicionar campos de dia e mês de vencimento na tabela propostas
-- Estes campos armazenam os valores selecionados pelo corretor (10 ou 20 para dia, 1-12 para mês)

-- 1. ADICIONAR COLUNA DIA_VENCIMENTO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'dia_vencimento') THEN
        ALTER TABLE propostas ADD COLUMN dia_vencimento INTEGER;
        RAISE NOTICE '✅ Coluna dia_vencimento adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna dia_vencimento já existe';
    END IF;
END $$;

-- 2. ADICIONAR COLUNA MES_VENCIMENTO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'mes_vencimento') THEN
        ALTER TABLE propostas ADD COLUMN mes_vencimento INTEGER;
        RAISE NOTICE '✅ Coluna mes_vencimento adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna mes_vencimento já existe';
    END IF;
END $$;

-- 3. ADICIONAR CONSTRAINTS PARA VALIDAÇÃO
-- Dia de vencimento deve ser 10 ou 20
ALTER TABLE propostas 
DROP CONSTRAINT IF EXISTS propostas_dia_vencimento_check;

ALTER TABLE propostas 
ADD CONSTRAINT propostas_dia_vencimento_check 
CHECK (dia_vencimento IN (10, 20) OR dia_vencimento IS NULL);

-- Mês de vencimento deve ser entre 1 e 12
ALTER TABLE propostas 
DROP CONSTRAINT IF EXISTS propostas_mes_vencimento_check;

ALTER TABLE propostas 
ADD CONSTRAINT propostas_mes_vencimento_check 
CHECK (mes_vencimento >= 1 AND mes_vencimento <= 12 OR mes_vencimento IS NULL);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_propostas_dia_vencimento ON propostas(dia_vencimento);
CREATE INDEX IF NOT EXISTS idx_propostas_mes_vencimento ON propostas(mes_vencimento);
CREATE INDEX IF NOT EXISTS idx_propostas_dia_mes_vencimento ON propostas(dia_vencimento, mes_vencimento);

-- 5. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN propostas.dia_vencimento IS 'Dia do mês para vencimento (10 ou 20)';
COMMENT ON COLUMN propostas.mes_vencimento IS 'Mês do ano para vencimento (1-12)';
COMMENT ON COLUMN propostas.data_vencimento IS 'Data completa de vencimento calculada (YYYY-MM-DD)';

-- 6. VERIFICAR ESTRUTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
AND column_name IN ('dia_vencimento', 'mes_vencimento', 'data_vencimento')
ORDER BY column_name;

-- 7. VERIFICAR CONSTRAINTS CRIADAS
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'propostas'::regclass
AND conname LIKE '%vencimento%'
ORDER BY conname;

-- 8. VERIFICAR ÍNDICES CRIADOS
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'propostas' 
AND indexname LIKE '%vencimento%'
ORDER BY indexname;

-- 9. EXEMPLO DE DADOS
-- Após executar este script, os dados serão salvos assim:
-- dia_vencimento: 10 ou 20
-- mes_vencimento: 1 a 12 (1=Janeiro, 2=Fevereiro, etc.)
-- data_vencimento: Data completa calculada (ex: 2024-12-10)

RAISE NOTICE '✅ Script executado com sucesso!';
RAISE NOTICE 'ℹ️ As colunas dia_vencimento e mes_vencimento foram adicionadas';
RAISE NOTICE 'ℹ️ Constraints de validação foram criadas';
RAISE NOTICE 'ℹ️ Índices foram criados para melhor performance';


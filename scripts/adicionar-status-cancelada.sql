-- Script para adicionar o status "cancelada" à tabela propostas
-- Este script atualiza a constraint para incluir o novo status

-- 1. Remover constraint existente
DO $$
BEGIN
    -- Verificar se existe constraint na tabela propostas
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'propostas' 
        AND constraint_name = 'propostas_status_check'
    ) THEN
        ALTER TABLE propostas DROP CONSTRAINT propostas_status_check;
        RAISE NOTICE '✅ Constraint antiga removida com sucesso!';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint não encontrada, continuando...';
    END IF;
END $$;

-- 2. Criar nova constraint com o status "cancelada"
ALTER TABLE propostas 
ADD CONSTRAINT propostas_status_check 
CHECK (status IN ('parcial', 'aguardando_cliente', 'pendente', 'aprovada', 'rejeitada', 'cadastrado', 'cancelada'));

-- 3. Verificar se a constraint foi criada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'propostas_status_check'
    ) THEN
        RAISE NOTICE '✅ Constraint atualizada com sucesso! Status "cancelada" adicionado.';
    ELSE
        RAISE NOTICE '❌ Erro ao criar constraint!';
    END IF;
END $$;

-- 4. Verificar valores permitidos na constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'propostas_status_check';

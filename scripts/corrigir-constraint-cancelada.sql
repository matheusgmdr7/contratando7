-- Script para corrigir a constraint e adicionar status "cancelada" corretamente

-- 1. Verificar constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'propostas'::regclass;

-- 2. Remover constraint "cancelada" se existir (pode estar duplicada)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'propostas' 
        AND constraint_name = 'cancelada'
    ) THEN
        ALTER TABLE propostas DROP CONSTRAINT cancelada;
        RAISE NOTICE '✅ Constraint "cancelada" removida (era duplicada)';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint "cancelada" não encontrada';
    END IF;
END $$;

-- 3. Remover constraint "propostas_status_check" se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'propostas' 
        AND constraint_name = 'propostas_status_check'
    ) THEN
        ALTER TABLE propostas DROP CONSTRAINT propostas_status_check;
        RAISE NOTICE '✅ Constraint "propostas_status_check" removida';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint "propostas_status_check" não encontrada';
    END IF;
END $$;

-- 4. Criar nova constraint com todos os status incluindo "cancelada"
ALTER TABLE propostas 
ADD CONSTRAINT propostas_status_check 
CHECK (status IN ('parcial', 'aguardando_cliente', 'pendente', 'aprovada', 'rejeitada', 'cadastrado', 'cancelada'));

-- 5. Verificar se foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'propostas_status_check';

-- 6. Testar se aceita o status "cancelada"
DO $$
BEGIN
    RAISE NOTICE '✅ Constraint criada com sucesso!';
    RAISE NOTICE '✅ Status "cancelada" deve ser aceito pela tabela propostas.';
    RAISE NOTICE '🎯 Agora você pode testar a função de cancelar proposta!';
END $$;

-- Script para adicionar colunas de cancelamento na tabela propostas
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna data_cancelamento
ALTER TABLE propostas 
ADD COLUMN data_cancelamento TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna motivo_cancelamento
ALTER TABLE propostas 
ADD COLUMN motivo_cancelamento TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN propostas.data_cancelamento IS 'Data e hora do cancelamento da proposta';
COMMENT ON COLUMN propostas.motivo_cancelamento IS 'Motivo do cancelamento da proposta';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'propostas' 
AND column_name IN ('data_cancelamento', 'motivo_cancelamento');

# 📋 Instruções: Adicionar Campos Dia e Mês de Vencimento

## 🎯 **Objetivo**

Adicionar as colunas `dia_vencimento` e `mes_vencimento` na tabela `propostas` para armazenar os valores selecionados pelo corretor.

---

## 📊 **Estrutura dos Campos**

### **Campos que serão adicionados:**

| Campo | Tipo | Valores | Descrição |
|-------|------|---------|-----------|
| `dia_vencimento` | INTEGER | 10 ou 20 | Dia do mês para vencimento |
| `mes_vencimento` | INTEGER | 1 a 12 | Mês do ano para vencimento |
| `data_vencimento` | DATE | YYYY-MM-DD | Data completa calculada (já existe) |

---

## 🔧 **Como Executar o Script**

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. **Acesse** o [Supabase Dashboard](https://app.supabase.com)
2. **Selecione** seu projeto
3. **Vá para** `SQL Editor` (menu lateral esquerdo)
4. **Clique** em `New Query`
5. **Copie e cole** o conteúdo do arquivo `scripts/adicionar-campos-dia-mes-vencimento.sql`
6. **Clique** em `Run` ou pressione `Ctrl+Enter`
7. **Aguarde** a execução e verifique as mensagens de sucesso

### **Opção 2: Via Terminal (se tiver psql instalado)**

```bash
# Navegue até a pasta do projeto
cd "/Users/matheus/Downloads/CONTRATANDO PLANOS - ULTIMA VERSAO"

# Execute o script
psql -h <SEU_HOST> -U <SEU_USUARIO> -d <SEU_DATABASE> -f scripts/adicionar-campos-dia-mes-vencimento.sql
```

---

## ✅ **Verificação Pós-Execução**

Após executar o script, você verá mensagens como:

```
✅ Coluna dia_vencimento adicionada
✅ Coluna mes_vencimento adicionada
✅ Constraints de validação foram criadas
✅ Índices foram criados para melhor performance
```

### **Verificar se as colunas foram criadas:**

Execute no SQL Editor:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'propostas' 
AND column_name IN ('dia_vencimento', 'mes_vencimento', 'data_vencimento')
ORDER BY column_name;
```

**Resultado esperado:**

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| data_vencimento | date | YES |
| dia_vencimento | integer | YES |
| mes_vencimento | integer | YES |

---

## 📝 **O que o Script Faz**

### **1. Adiciona Colunas**
- ✅ `dia_vencimento` (INTEGER)
- ✅ `mes_vencimento` (INTEGER)

### **2. Cria Constraints de Validação**
- ✅ `dia_vencimento` só aceita 10 ou 20
- ✅ `mes_vencimento` só aceita valores entre 1 e 12

### **3. Cria Índices**
- ✅ `idx_propostas_dia_vencimento` - para consultas por dia
- ✅ `idx_propostas_mes_vencimento` - para consultas por mês
- ✅ `idx_propostas_dia_mes_vencimento` - para consultas combinadas

### **4. Adiciona Comentários**
- ✅ Documentação das colunas no banco de dados

---

## 💾 **Como os Dados Serão Salvos**

### **Exemplo 1:**
```
Corretor seleciona:
- Dia: 10
- Mês: Dezembro (12)

Dados salvos:
- dia_vencimento: 10
- mes_vencimento: 12
- data_vencimento: 2024-12-10
```

### **Exemplo 2:**
```
Corretor seleciona:
- Dia: 20
- Mês: Março (3)

Dados salvos:
- dia_vencimento: 20
- mes_vencimento: 3
- data_vencimento: 2025-03-20 (se março já passou no ano atual)
```

---

## 🔍 **Consultas Úteis**

### **Ver todas as propostas por dia de vencimento:**
```sql
SELECT 
    nome,
    dia_vencimento,
    mes_vencimento,
    data_vencimento,
    status
FROM propostas
WHERE dia_vencimento = 10
ORDER BY data_vencimento;
```

### **Contar propostas por dia de vencimento:**
```sql
SELECT 
    dia_vencimento,
    COUNT(*) as total
FROM propostas
WHERE dia_vencimento IS NOT NULL
GROUP BY dia_vencimento
ORDER BY dia_vencimento;
```

### **Ver propostas que vencem em um mês específico:**
```sql
SELECT 
    nome,
    dia_vencimento,
    mes_vencimento,
    data_vencimento,
    status
FROM propostas
WHERE mes_vencimento = 12  -- Dezembro
ORDER BY dia_vencimento, data_vencimento;
```

---

## 🚨 **Importante**

### **Propostas Antigas**
- ✅ Propostas criadas **antes** deste update terão `dia_vencimento` e `mes_vencimento` como `NULL`
- ✅ Apenas a `data_vencimento` estará preenchida (se existir)
- ✅ Propostas **novas** terão todos os três campos preenchidos

### **Compatibilidade**
- ✅ O sistema continua funcionando normalmente
- ✅ Não há quebra de funcionalidades existentes
- ✅ Os campos são opcionais (nullable)

---

## 📊 **Benefícios**

### **1. Relatórios Melhores**
- 📈 Agrupar propostas por dia de vencimento (10 ou 20)
- 📈 Filtrar por mês específico
- 📈 Análises de padrões de vencimento

### **2. Consultas Mais Rápidas**
- ⚡ Índices otimizados para buscas
- ⚡ Não precisa extrair dia/mês da data completa

### **3. Histórico Completo**
- 📝 Saber exatamente qual dia e mês foram selecionados
- 📝 Mesmo que a data calculada mude de ano

### **4. Validação no Banco**
- ✅ Constraints garantem dados válidos
- ✅ Impossível salvar dia diferente de 10 ou 20
- ✅ Impossível salvar mês fora do range 1-12

---

## 🧪 **Testar Após Execução**

1. **Acesse** `http://localhost:3001`
2. **Faça login** como corretor
3. **Crie uma nova proposta** em `/corretor/propostas/nova`
4. **Selecione** dia e mês de vencimento
5. **Envie** a proposta
6. **Verifique** no banco de dados:

```sql
SELECT 
    nome,
    dia_vencimento,
    mes_vencimento,
    data_vencimento,
    created_at
FROM propostas
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- ✅ `dia_vencimento`: 10 ou 20
- ✅ `mes_vencimento`: 1 a 12
- ✅ `data_vencimento`: Data completa calculada

---

## ❓ **Troubleshooting**

### **Erro: "column already exists"**
✅ **Solução:** As colunas já foram criadas. Não é necessário executar novamente.

### **Erro: "constraint already exists"**
✅ **Solução:** As constraints já existem. O script tenta remover antes de criar.

### **Campos aparecem como NULL em propostas antigas**
✅ **Normal:** Apenas propostas novas terão esses campos preenchidos.

---

**Data de Criação**: 09/10/2024  
**Arquivo SQL**: `scripts/adicionar-campos-dia-mes-vencimento.sql`  
**Status**: ✅ **Pronto para Execução**


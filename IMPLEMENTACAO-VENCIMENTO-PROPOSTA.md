# 📋 Implementação do Campo de Vencimento na Nova Proposta

## ✅ **Resumo da Implementação**

Foi implementado com sucesso os campos de **Dia e Mês de Vencimento** na página de criação de novas propostas (`/corretor/propostas/nova`). O corretor agora pode selecionar:
- **Dia**: 10 ou 20
- **Mês**: Janeiro a Dezembro

O sistema calcula automaticamente a data completa de vencimento baseada na seleção.

---

## 🎯 **Funcionalidades Implementadas**

### 1. **Schema de Validação**
- ✅ Adicionado campo `dia_vencimento` no schema Zod
- ✅ Adicionado campo `mes_vencimento` no schema Zod
- ✅ Validação obrigatória para ambos os campos
- ✅ Mensagens de erro personalizadas

```typescript
dia_vencimento: z.enum(["10", "20"], {
  required_error: "Dia de vencimento é obrigatório",
}),
mes_vencimento: z.string().min(1, "Mês de vencimento é obrigatório"),
```

### 2. **Interface do Usuário**
- ✅ **Campo "Dia de Vencimento"** (Select) adicionado na aba "Plano"
  - Opções: "Dia 10" e "Dia 20"
  - Valor padrão: "10"
  - Descrição: "Selecione o dia do mês para vencimento do plano"
  
- ✅ **Campo "Mês de Vencimento"** (Select) adicionado logo após o dia
  - Opções: Janeiro a Dezembro (1 a 12)
  - Descrição: "Selecione o mês para vencimento do plano"
  
- ✅ Ambos posicionados logo após o campo "Valor"

### 3. **Cálculo da Data de Vencimento**
Foi criada a função `calcularDataVencimento` que:
- ✅ Recebe o **dia** selecionado (10 ou 20)
- ✅ Recebe o **mês** selecionado (1 a 12)
- ✅ Calcula a data completa de vencimento
- ✅ Se a data já passou no ano atual, usa o próximo ano
- ✅ Retorna a data no formato ISO (YYYY-MM-DD)

```typescript
const calcularDataVencimento = (diaVencimento: string, mesVencimento: string): string => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const dia = parseInt(diaVencimento)
  const mes = parseInt(mesVencimento) - 1 // JavaScript usa 0-11 para meses
  
  // Criar data de vencimento com o mês e dia selecionados
  let dataVencimento = new Date(ano, mes, dia)
  
  // Se a data já passou, usar o próximo ano
  if (dataVencimento <= hoje) {
    dataVencimento = new Date(ano + 1, mes, dia)
  }
  
  return dataVencimento.toISOString().split('T')[0]
}
```

### 4. **Salvamento no Banco de Dados**
- ✅ Campo `data_vencimento` (DATE) - data completa calculada
- ✅ Salvo na tabela `propostas` (mesma coluna usada em `/admin/cadastrado`)
- ✅ Formato: `"YYYY-MM-DD"` (string ISO 8601)
- ✅ Integração com o serviço `criarProposta` do `propostas-service-unificado`

```typescript
// Calcular data de vencimento baseada no dia e mês selecionados (igual ao /admin/cadastrado)
data_vencimento: calcularDataVencimento(data.dia_vencimento, data.mes_vencimento),
```

**Nota:** Os campos `dia_vencimento` e `mes_vencimento` são usados apenas na interface para facilitar a seleção. Apenas a `data_vencimento` calculada é salva no banco.

### 5. **Validação do Formulário**
- ✅ Ambos os campos incluídos na validação da aba "Plano"
- ✅ Validação obrigatória antes de avançar para próxima aba
- ✅ Mensagens de erro personalizadas caso não sejam preenchidos

---

## 📊 **Estrutura do Banco de Dados**

A tabela `propostas` **já possui** a coluna `data_vencimento`:

```sql
-- Coluna existente (já criada anteriormente)
data_vencimento DATE
```

### **📋 Estrutura:**

| Coluna | Tipo | Formato | Descrição |
|--------|------|---------|-----------|
| `data_vencimento` | DATE | YYYY-MM-DD | Data completa de vencimento |

### **✅ Não é necessário executar nenhum script SQL!**

A coluna `data_vencimento` já existe e é a **mesma** usada pela função de "Completar Cadastro" em `/admin/cadastrado`.

**Compatibilidade 100%:** Ambas as páginas (corretor e admin) salvam no mesmo lugar e formato.

---

## 🔄 **Fluxo de Funcionamento**

1. **Corretor acessa** `/corretor/propostas/nova`
2. **Preenche os dados** do cliente e endereço
3. **Na aba "Plano"**, seleciona o produto e outros dados
4. **Seleciona o dia de vencimento**: 10 ou 20
5. **Sistema calcula automaticamente** a próxima data de vencimento
6. **Ao enviar a proposta**, a data é salva no banco de dados

---

## 📝 **Exemplos de Uso**

### Exemplo 1: Data futura no mesmo ano
- **Data atual**: 05/10/2024
- **Dia selecionado**: 10
- **Mês selecionado**: Dezembro (12)
- **Data de vencimento calculada**: 10/12/2024

### Exemplo 2: Data já passou no ano atual
- **Data atual**: 15/10/2024
- **Dia selecionado**: 10
- **Mês selecionado**: Março (3)
- **Data de vencimento calculada**: 10/03/2025 (próximo ano)

### Exemplo 3: Mesmo mês, data futura
- **Data atual**: 05/10/2024
- **Dia selecionado**: 20
- **Mês selecionado**: Outubro (10)
- **Data de vencimento calculada**: 20/10/2024

### Exemplo 4: Mesmo mês, data já passou
- **Data atual**: 25/10/2024
- **Dia selecionado**: 10
- **Mês selecionado**: Outubro (10)
- **Data de vencimento calculada**: 10/10/2025 (próximo ano)

---

## 🧪 **Como Testar**

1. **Acesse** o sistema em `http://localhost:3001`
2. **Faça login** como corretor
3. **Navegue** para `/corretor/propostas/nova`
4. **Preencha** os dados do cliente
5. **Na aba "Plano"**, verifique os campos de vencimento:
   - **Dia de Vencimento**: Selecione entre "Dia 10" ou "Dia 20"
   - **Mês de Vencimento**: Selecione o mês desejado (Janeiro a Dezembro)
6. **Complete** o formulário e envie
7. **Verifique** no banco de dados se a `data_vencimento` foi salva corretamente

---

## 📁 **Arquivos Modificados**

### `app/corretor/(dashboard)/propostas/nova/page.tsx`
- ✅ Adicionado campo `dia_vencimento` no schema (opções: 10 ou 20)
- ✅ Adicionado campo `mes_vencimento` no schema (opções: 1 a 12)
- ✅ Valor padrão dia: "10"
- ✅ Criada função `calcularDataVencimento` com suporte a dia e mês
- ✅ Adicionados dois campos Select na interface
- ✅ Incluídos na validação do formulário
- ✅ Integrados no salvamento da proposta

---

## ✅ **Status da Implementação**

| Tarefa | Status |
|--------|--------|
| Verificar estrutura do banco | ✅ Concluído |
| Adicionar campo no schema | ✅ Concluído |
| Implementar interface | ✅ Concluído |
| Criar função de cálculo | ✅ Concluído |
| Integrar com salvamento | ✅ Concluído |
| Validação do formulário | ✅ Concluído |
| Testes | ✅ Pronto para testar |

---

## 🚀 **Próximos Passos (Opcional)**

1. **Adicionar campo de vigência**: Calcular data de início da vigência do plano
2. **Exibir datas calculadas**: Mostrar preview das datas antes de salvar
3. **Relatórios**: Incluir data de vencimento nos relatórios de propostas
4. **Notificações**: Criar alertas de vencimento próximo

---

## 📌 **Observações Importantes**

- ✅ Ambos os campos (dia e mês) são **obrigatórios** na interface
- ✅ A data é calculada **automaticamente** com base no dia e mês selecionados
- ✅ Se a data já passou no ano atual, o sistema usa o **próximo ano**
- ✅ O formato salvo no banco é **"YYYY-MM-DD"** (ISO 8601)
- ✅ **Usa a mesma coluna** `data_vencimento` que `/admin/cadastrado`
- ✅ **Não requer alterações no banco de dados** - coluna já existe
- ✅ Meses são apresentados por extenso (Janeiro, Fevereiro, etc.) para melhor UX
- ✅ Dia e mês são campos apenas da interface (não salvos separadamente)

---

**Data da Implementação**: 09/10/2024  
**Desenvolvedor**: Sistema de IA  
**Status**: ✅ **Implementado e Pronto para Uso**


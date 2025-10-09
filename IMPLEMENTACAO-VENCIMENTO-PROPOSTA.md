# 📋 Implementação do Campo de Vencimento na Nova Proposta

## ✅ **Resumo da Implementação**

Foi implementado com sucesso o campo de **Dia de Vencimento** na página de criação de novas propostas (`/corretor/propostas/nova`). O corretor agora pode selecionar entre os dias **10** ou **20** do mês para o vencimento do plano.

---

## 🎯 **Funcionalidades Implementadas**

### 1. **Schema de Validação**
- ✅ Adicionado campo `dia_vencimento` no schema Zod
- ✅ Validação obrigatória com opções: "10" ou "20"
- ✅ Mensagem de erro personalizada

```typescript
dia_vencimento: z.enum(["10", "20"], {
  required_error: "Dia de vencimento é obrigatório",
}),
```

### 2. **Interface do Usuário**
- ✅ Campo de seleção (Select) adicionado na aba "Plano"
- ✅ Posicionado logo após o campo "Valor"
- ✅ Duas opções disponíveis: "Dia 10" e "Dia 20"
- ✅ Descrição informativa: "Selecione o dia do mês para vencimento do plano"
- ✅ Valor padrão: "10"

### 3. **Cálculo da Data de Vencimento**
Foi criada a função `calcularDataVencimento` que:
- ✅ Recebe o dia selecionado (10 ou 20)
- ✅ Calcula a próxima data de vencimento
- ✅ Se o dia já passou no mês atual, usa o próximo mês
- ✅ Retorna a data no formato ISO (YYYY-MM-DD)

```typescript
const calcularDataVencimento = (diaVencimento: string): string => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const dia = parseInt(diaVencimento)
  
  // Criar data de vencimento para o mês atual
  let dataVencimento = new Date(ano, mes, dia)
  
  // Se o dia já passou no mês atual, usar o próximo mês
  if (dataVencimento <= hoje) {
    dataVencimento = new Date(ano, mes + 1, dia)
  }
  
  return dataVencimento.toISOString().split('T')[0]
}
```

### 4. **Salvamento no Banco de Dados**
- ✅ Campo `data_vencimento` é calculado automaticamente
- ✅ Valor é salvo na tabela `propostas`
- ✅ Integração com o serviço `criarProposta` do `propostas-service-unificado`

```typescript
// Calcular data de vencimento baseada no dia selecionado
data_vencimento: calcularDataVencimento(data.dia_vencimento),
```

### 5. **Validação do Formulário**
- ✅ Campo incluído na validação da aba "Plano"
- ✅ Validação obrigatória antes de avançar para próxima aba
- ✅ Mensagem de erro caso não seja preenchido

---

## 📊 **Estrutura do Banco de Dados**

A tabela `propostas` já possui a coluna `data_vencimento`:

```sql
ALTER TABLE propostas 
ADD COLUMN IF NOT EXISTS data_vencimento DATE;
```

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

### Exemplo 1: Dia 10 selecionado
- **Data atual**: 05/10/2024
- **Dia selecionado**: 10
- **Data de vencimento calculada**: 10/10/2024

### Exemplo 2: Dia já passou
- **Data atual**: 15/10/2024
- **Dia selecionado**: 10
- **Data de vencimento calculada**: 10/11/2024 (próximo mês)

### Exemplo 3: Dia 20 selecionado
- **Data atual**: 15/10/2024
- **Dia selecionado**: 20
- **Data de vencimento calculada**: 20/10/2024

---

## 🧪 **Como Testar**

1. **Acesse** o sistema em `http://localhost:3001`
2. **Faça login** como corretor
3. **Navegue** para `/corretor/propostas/nova`
4. **Preencha** os dados do cliente
5. **Na aba "Plano"**, verifique o campo "Dia de Vencimento"
6. **Selecione** entre "Dia 10" ou "Dia 20"
7. **Complete** o formulário e envie
8. **Verifique** no banco de dados se a `data_vencimento` foi salva corretamente

---

## 📁 **Arquivos Modificados**

### `app/corretor/(dashboard)/propostas/nova/page.tsx`
- ✅ Adicionado campo `dia_vencimento` no schema
- ✅ Adicionado valor padrão "10"
- ✅ Criada função `calcularDataVencimento`
- ✅ Adicionado campo na interface (Select)
- ✅ Incluído na validação do formulário
- ✅ Integrado no salvamento da proposta

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

- ✅ O campo é **obrigatório** para criar uma nova proposta
- ✅ A data é calculada **automaticamente** com base no dia selecionado
- ✅ Se o dia já passou no mês atual, o sistema usa o **próximo mês**
- ✅ O formato salvo no banco é **YYYY-MM-DD** (ISO 8601)
- ✅ Compatível com a estrutura existente da tabela `propostas`

---

**Data da Implementação**: 09/10/2024  
**Desenvolvedor**: Sistema de IA  
**Status**: ✅ **Implementado e Pronto para Uso**


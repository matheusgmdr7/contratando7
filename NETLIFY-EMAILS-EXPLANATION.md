# 📧 Explicação: Netlify Email Functions vs Supabase Edge Functions

## 🤔 **Por que você perguntou sobre `NETLIFY_EMAILS_DIRECTORY` e `NETLIFY_EMAILS_SECRET`?**

Essas variáveis são específicas do **Netlify Email Functions**, um serviço diferente do que estamos usando atualmente. Vou explicar a diferença e por que isso pode estar causando confusão.

## 🏗️ **Arquitetura Atual do Sistema**

### **✅ Sistema Atual (Funcionando):**
```
Frontend (Next.js) 
    ↓
Supabase Edge Function (`enviar-email`)
    ↓
Resend API
    ↓
Email enviado para o cliente
```

**Variáveis usadas:**
- `RESEND_API_KEY` - Chave da API do Resend
- `FROM_EMAIL` - Email remetente

### **❌ Sistema Alternativo (Netlify Email Functions):**
```
Frontend (Next.js)
    ↓
Netlify Email Function
    ↓
Email enviado diretamente
```

**Variáveis usadas:**
- `NETLIFY_EMAILS_DIRECTORY` - Diretório dos templates
- `NETLIFY_EMAILS_SECRET` - Secret de autenticação

## 🔍 **Por que isso pode estar relacionado ao problema do nome do corretor?**

### **1. Conflito de Configuração:**
Se você tiver configurações do Netlify Email Functions no seu ambiente, elas podem estar interferindo com o sistema atual.

### **2. Variáveis de Ambiente Conflitantes:**
O Netlify pode estar tentando usar seu próprio sistema de email em vez do Supabase Edge Functions.

### **3. Configuração Incorreta:**
Se as variáveis do Netlify estiverem definidas mas não configuradas corretamente, pode causar problemas.

## 🛠️ **Como Verificar e Corrigir**

### **1. Verificar Variáveis de Ambiente no Netlify:**

Acesse o painel do Netlify:
1. Vá para seu site
2. **Site settings** → **Environment variables**
3. Verifique se existem:
   - `NETLIFY_EMAILS_DIRECTORY`
   - `NETLIFY_EMAILS_SECRET`

### **2. Se existirem, você tem duas opções:**

#### **Opção A: Remover as variáveis do Netlify (Recomendado)**
- Delete `NETLIFY_EMAILS_DIRECTORY`
- Delete `NETLIFY_EMAILS_SECRET`
- Mantenha apenas `RESEND_API_KEY` e `FROM_EMAIL`

#### **Opção B: Migrar para Netlify Email Functions**
- Configure `NETLIFY_EMAILS_DIRECTORY=netlify/emails`
- Configure `NETLIFY_EMAILS_SECRET` com um valor aleatório
- Crie templates de email no diretório `netlify/emails/`

### **3. Verificar se há plugins do Netlify:**

No arquivo `netlify.toml`, verifique se há:
```toml
[[plugins]]
  package = "@netlify/plugin-emails"  # ← Se isso existir, pode estar causando conflito
```

## 📋 **Checklist de Verificação**

### **✅ Para usar Supabase Edge Functions (Atual):**
- [ ] `RESEND_API_KEY` configurada no Supabase Dashboard
- [ ] `FROM_EMAIL` configurada no Supabase Dashboard
- [ ] `NETLIFY_EMAILS_DIRECTORY` **NÃO** configurada no Netlify
- [ ] `NETLIFY_EMAILS_SECRET` **NÃO** configurada no Netlify
- [ ] Edge Function `enviar-email` deployada no Supabase

### **✅ Para usar Netlify Email Functions:**
- [ ] `NETLIFY_EMAILS_DIRECTORY=netlify/emails` no Netlify
- [ ] `NETLIFY_EMAILS_SECRET` configurada no Netlify
- [ ] Templates de email criados em `netlify/emails/`
- [ ] Plugin `@netlify/plugin-emails` instalado
- [ ] Código migrado para usar Netlify Email Functions

## 🚨 **Problemas Comuns**

### **1. Conflito de Sistemas:**
```
❌ Problema: Netlify tentando usar Email Functions
✅ Solução: Remover variáveis do Netlify ou migrar completamente
```

### **2. Templates Não Encontrados:**
```
❌ Problema: NETLIFY_EMAILS_DIRECTORY aponta para diretório inexistente
✅ Solução: Criar diretório e templates ou remover a variável
```

### **3. Secret Não Configurado:**
```
❌ Problema: NETLIFY_EMAILS_SECRET vazia ou inválida
✅ Solução: Configurar secret válido ou remover a variável
```

## 🎯 **Recomendação**

### **Mantenha o sistema atual (Supabase + Resend) porque:**
1. ✅ Já está funcionando
2. ✅ Mais flexível
3. ✅ Melhor controle sobre templates
4. ✅ Logs mais detalhados
5. ✅ Integração nativa com Supabase

### **Para corrigir o problema do nome do corretor:**
1. **Remova** as variáveis do Netlify Email Functions se existirem
2. **Verifique** se `RESEND_API_KEY` está configurada no Supabase
3. **Teste** o sistema com os logs que adicionamos

## 🔧 **Comandos para Verificar**

### **Verificar variáveis no Netlify:**
```bash
# Via CLI do Netlify
netlify env:list

# Ou acesse o painel web
# https://app.netlify.com/sites/SEU_SITE/settings/deploys#environment-variables
```

### **Verificar variáveis no Supabase:**
```bash
# Via CLI do Supabase
supabase secrets list

# Ou acesse o painel web
# https://supabase.com/dashboard/project/SEU_PROJECT/settings/functions
```

## 📞 **Próximos Passos**

1. **Verifique** se existem variáveis do Netlify Email Functions
2. **Se existirem**: Remova-as ou configure-as corretamente
3. **Teste** o sistema com os logs detalhados que adicionamos
4. **Monitore** os logs para identificar onde o nome do corretor está sendo perdido

**A resposta é: SIM, essas variáveis podem estar causando o problema!** 🎯

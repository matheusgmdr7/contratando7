# 🔧 Guia de Configuração de Variáveis de Ambiente

## 📋 Variáveis Obrigatórias

### 🗄️ **Supabase (ESSENCIAL)**

Para o sistema funcionar, você **DEVE** configurar estas variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Como obter:
1. Acesse [supabase.com](https://supabase.com)
2. Vá para seu projeto
3. Acesse **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📧 Variáveis de Email (Recomendadas)

### **Resend (Recomendado)**
```env
RESEND_API_KEY=re_seu_api_key_aqui
FROM_EMAIL=contato@contratandoplanos.com.br
```

#### Como configurar:
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta
3. Gere uma API Key
4. Configure seu domínio de email

### **SendGrid (Alternativo)**
```env
SENDGRID_API_KEY=SG.seu_api_key_aqui
```

## 🚀 Configuração Rápida

### **1. Crie o arquivo .env.local**

```bash
# Na raiz do projeto, crie:
cp env.example .env.local
```

### **2. Configure as variáveis essenciais**

Edite o arquivo `.env.local` com suas credenciais reais:

```env
# OBRIGATÓRIAS
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-real.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_real_aqui

# RECOMENDADAS
RESEND_API_KEY=re_sua_chave_real_aqui
FROM_EMAIL=seu-email@dominio.com
```

### **3. Reinicie o servidor**

```bash
npm run dev
```

## 🔍 Verificação das Variáveis

### **Teste de Conexão Supabase**

Crie um arquivo `test-env.js` na raiz:

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('propostas').select('count').limit(1)
    if (error) throw error
    console.log('✅ Conexão com Supabase funcionando!')
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
  }
}

testConnection()
```

Execute: `node test-env.js`

## 🏗️ Configuração por Ambiente

### **Desenvolvimento (.env.local)**
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Produção (.env.production)**
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://contratandoplanos.com.br
```

## 🔐 Segurança

### **Variáveis Públicas vs Privadas**

#### **✅ Públicas (NEXT_PUBLIC_)**
- Visíveis no browser
- Use apenas para URLs e chaves públicas
- Exemplo: `NEXT_PUBLIC_SUPABASE_URL`

#### **🔒 Privadas**
- Apenas no servidor
- Use para API keys secretas
- Exemplo: `RESEND_API_KEY`

### **⚠️ NUNCA faça:**
- Commit de arquivos `.env.local`
- Compartilhe chaves privadas
- Use chaves de produção em desenvolvimento

## 📁 Estrutura de Arquivos ENV

```
projeto/
├── .env.example          # Template público
├── .env.local           # Desenvolvimento (não commitado)
├── .env.production      # Produção (não commitado)
└── .env.test           # Testes (não commitado)
```

## 🚨 Troubleshooting

### **Erro: "supabase is not defined"**
```bash
# Verifique se as variáveis estão definidas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### **Erro: "Module not found"**
```bash
# Reinstale dependências
npm install
```

### **Erro: "Invalid API key"**
- Verifique se copiou a chave completa
- Confirme se não há espaços extras
- Teste com uma nova chave

## 📊 Variáveis por Funcionalidade

### **🏥 Sistema de Propostas**
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### **📧 Envio de Emails**
```env
RESEND_API_KEY=...
FROM_EMAIL=...
```

### **📁 Upload de Arquivos**
```env
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### **🔐 Autenticação**
```env
JWT_SECRET=...
NEXTAUTH_SECRET=...
```

## ✅ Checklist de Configuração

- [ ] Arquivo `.env.local` criado
- [ ] Variáveis do Supabase configuradas
- [ ] Teste de conexão passou
- [ ] Email configurado (opcional)
- [ ] Servidor reiniciado
- [ ] Sistema funcionando

## 🆘 Suporte

Se tiver problemas:

1. **Verifique o console** do navegador
2. **Teste a conexão** com Supabase
3. **Confirme as variáveis** estão corretas
4. **Reinicie o servidor** de desenvolvimento

**Lembre-se**: As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são **OBRIGATÓRIAS** para o sistema funcionar!

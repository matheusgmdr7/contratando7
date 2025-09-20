# 🏥 Sistema Contratando Planos

Sistema completo para gestão de propostas de planos de saúde, desenvolvido com Next.js e Supabase.

## 🚀 Funcionalidades

### 👤 **Dashboard do Corretor**
- ✅ Visualização de propostas enviadas e aprovadas
- ✅ Gestão de clientes ativos
- ✅ Interface corporativa e responsiva
- ✅ Filtros inteligentes por status

### 🏢 **Painel Administrativo**
- ✅ Gerenciamento completo de propostas
- ✅ Controle de corretores e produtos
- ✅ Sistema de aprovação/rejeição
- ✅ Relatórios e estatísticas
- ✅ Edição inline de dados

### 📱 **Proposta Digital**
- ✅ Formulário responsivo para mobile
- ✅ Questionário de saúde obrigatório
- ✅ Assinatura digital precisa
- ✅ Upload de documentos
- ✅ Redirecionamento automático para propostas finalizadas

### 🎨 **Design Corporativo**
- ✅ Interface moderna e profissional
- ✅ Totalmente responsiva para mobile
- ✅ Componentes padronizados
- ✅ Animações de carregamento corporativas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Formulários**: React Hook Form, Zod
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Notificações**: Sonner (Toast)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd contratando-planos
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Execute o projeto
```bash
npm run dev
# ou
yarn dev
```

O projeto estará disponível em `http://localhost:3000`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `propostas`
- Dados do titular e dependentes
- Informações do plano escolhido
- Status da proposta
- Documentos anexados
- Assinatura digital

#### `questionario_saude`
- Respostas do questionário de saúde
- Vinculado à proposta

#### `corretores`
- Dados dos corretores
- Controle de acesso

#### `produtos`
- Catálogo de planos disponíveis
- Valores e características

## 🎯 Funcionalidades Principais

### Sistema de Status
- **Pendente**: Proposta criada, aguardando análise
- **Aprovada**: Proposta aprovada pelo admin
- **Cadastrada**: Cliente ativo no sistema
- **Rejeitada**: Proposta não aprovada

### Responsividade Mobile
- Design mobile-first
- Touch targets adequados (44px mínimo)
- Layouts adaptativos
- Navegação otimizada para toque

### Validações
- Formulários com validação em tempo real
- Campos obrigatórios destacados
- Mensagens de erro claras
- Upload de documentos obrigatório

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm run start

# Linting
npm run lint

# Verificação de tipos
npm run type-check
```

## 📱 Páginas Principais

### Corretor
- `/corretor/dashboard` - Dashboard principal
- `/corretor/propostas` - Lista de propostas
- `/corretor/propostas/nova` - Nova proposta
- `/corretor/clientes` - Gestão de clientes
- `/corretor/produtos` - Catálogo de produtos

### Admin
- `/admin` - Dashboard administrativo
- `/admin/propostas` - Gestão de propostas
- `/admin/corretores` - Gestão de corretores
- `/admin/cadastrado` - Clientes cadastrados
- `/admin/leads` - Controle de leads

### Proposta Digital
- `/proposta-digital/completar/[id]` - Completar proposta
- `/proposta-digital/sucesso` - Confirmação de envio

## 🎨 Componentes Principais

### UI Components (Shadcn/ui)
- `Button`, `Card`, `Input`, `Select`
- `Table`, `Tabs`, `Dialog`, `Alert`
- `Progress`, `Badge`, `Avatar`

### Componentes Customizados
- `Step7Signature` - Assinatura digital
- `Step5HealthQuestionnaire` - Questionário de saúde
- `AdminSidebar` - Navegação administrativa

## 🔒 Segurança

- Autenticação via Supabase
- Validação de permissões
- Sanitização de dados
- Upload seguro de arquivos
- Logs de auditoria

## 📈 Performance

- Carregamento lazy de componentes
- Otimização de imagens
- Cache de dados
- Animações suaves
- Bundle splitting

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato:
- Email: contato@contratandoplanos.com.br

---

**Desenvolvido com ❤️ para otimizar a gestão de planos de saúde**

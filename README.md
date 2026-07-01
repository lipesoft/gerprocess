# Gerprocess - Sistema de Gerenciamento de Contratos de Obras

Plataforma web para gestão de contratos de obras da Engenharia TJBA (Tribunal de Justiça da Bahia).

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript
- **Banco:** PostgreSQL + Prisma ORM
- **Autenticação:** JWT + Refresh Token (cookies httpOnly) + 2FA (TOTP)

## Requisitos

- Node.js >= 18
- PostgreSQL >= 14 (ou Docker)
- npm ou yarn

## Setup Rápido

### 1. Clone o repositório

```bash
git clone https://github.com/lipesoft/gerprocess.git
cd gerprocess
```

### 2. Suba o banco com Docker

```bash
docker-compose up -d
```

### 3. Configure as variáveis de ambiente

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 4. Instale dependências e rode as migrations

```bash
# Backend
cd server
npm install
npx prisma migrate dev
npx prisma db seed
cd ..

# Frontend
cd client
npm install
cd ..
```

### 5. Rode o projeto

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 6. Acesse

- Frontend: http://localhost:5173
- Backend API: http://localhost:3333

## Usuário padrão (seed)

- **E-mail:** admin@gerprocess.com
- **Senha:** Admin@123
- **Perfil:** Administrador

## Estrutura do Projeto

```
gerprocess/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   ├── auth/        # Login, Cadastro, 2FA, Recuperação
│   │   │   ├── contracts/   # CRUD de contratos
│   │   │   ├── dashboard/   # KPIs, gráficos, calendário
│   │   │   ├── layout/      # Header, Sidebar, Footer
│   │   │   └── shared/      # Botões, inputs, modais
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Chamadas à API
│   │   ├── contexts/        # Context API (auth, theme)
│   │   ├── types/           # TypeScript types/interfaces
│   │   └── utils/           # Helpers e formatadores
│   └── ...
├── server/                  # Backend Node.js
│   ├── src/
│   │   ├── controllers/     # Controllers (entrada HTTP)
│   │   ├── services/        # Regras de negócio
│   │   ├── repositories/    # Acesso ao banco (Prisma)
│   │   ├── middlewares/     # Auth, RBAC, rate limit, etc.
│   │   ├── routes/          # Definição de rotas
│   │   ├── config/          # Configs (env, cors, etc.)
│   │   ├── utils/           # Helpers (crypto, email, etc.)
│   │   ├── types/           # Types compartilhados
│   │   └── jobs/            # Jobs agendados (notificações)
│   ├── prisma/              # Schema e migrations
│   └── uploads/             # Armazenamento local de docs
├── docker-compose.yml       # PostgreSQL para dev
└── README.md
```

## Segurança

- Cookies httpOnly + Secure + SameSite=Strict
- Rate limiting em rotas sensíveis (login, recuperação)
- CORS restrito
- Helmet (headers de segurança)
- Sanitização de inputs (XSS/SQL Injection)
- Bcrypt para hash de senhas
- Criptografia AES-256 para dados sensíveis em repouso
- CSRF protection
- Validação com Zod em todas as rotas
- Logs de auditoria completos

## Perfis de Acesso (RBAC)

| Perfil | Permissões |
|--------|-----------|
| Administrador | Acesso total, gerencia usuários e permissões |
| Gestor | Visualiza dashboard, gerencia contratos e pagamentos |
| Engenheiro | Cadastra/edita contratos, anexa documentos |
| Auditor | Visualiza logs, histórico e relatórios (read-only) |
| Financeiro | Controle de pagamentos e saldos |

## Licença

Propriedade privada - Engenharia TJBA

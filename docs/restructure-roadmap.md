# Plano de reestruturação do Gerprocess

## Diagnóstico atual

O projeto já tem uma base funcional: React/Vite no frontend, Express/Prisma no backend, autenticação JWT com refresh token, RBAC, contratos, pagamentos, usuários, comentários no schema e auditoria.

Pontos corrigidos nesta rodada:

- Redesign do shell, dashboard, contratos, detalhe, novo contrato e login.
- Página de relatórios criada para a rota que já existia no menu.
- Busca global no topo agora navega para a listagem de contratos.
- Comentários de contrato agora possuem endpoint backend.
- Build do backend corrigido ao remover `prisma/seed.ts` do `include` do `tsconfig`.
- API do frontend passou a respeitar `VITE_API_URL`.

Pontos críticos ainda abertos:

- README promete CSRF, documentos, relatórios e componentes que ainda não existem por completo.
- Upload/download de documentos não tem fluxo completo no backend exposto por rota.
- Não há testes automatizados.
- Não há módulo de medições, aditivos, garantias, diário de obra ou fornecedores/prepostos.
- A auditoria registra ações, mas ainda não entrega tela de consulta para auditor.
- O build do frontend ainda emite alerta de bundle acima de 500 kB.
- O seed cria apenas usuário admin; faltam dados de demonstração realistas.

## Norte do produto

Transformar o Gerprocess em plataforma de execução e fiscalização de contratos de obras públicas, não apenas cadastro de contratos.

## Arquitetura recomendada

### Frontend

- Separar UI compartilhada em `src/components/ui`: `Button`, `Input`, `StatusBadge`, `MetricCard`, `DataTable`, `EmptyState`, `PageHeader`.
- Usar React Query para server state em contratos, dashboard, usuários e relatórios; hoje há muito `useEffect` manual.
- Criar camada de domínio em `src/features/contracts`, `src/features/payments`, `src/features/reports`.
- Padronizar formulários com `react-hook-form` + schemas Zod compartilháveis.
- Adicionar code splitting por rota com `React.lazy` para reduzir bundle inicial.

### Backend

- Separar rotas por arquivo: `auth.routes.ts`, `contract.routes.ts`, `payment.routes.ts`, `user.routes.ts`.
- Adicionar camada repository apenas onde houver consultas complexas; não criar abstração vazia.
- Padronizar respostas de erro e validação.
- Criar testes unitários dos services e testes de integração das rotas principais.
- Transformar auditoria em middleware/evento de domínio para reduzir chamadas manuais.
- Revisar claims de segurança do README: implementar CSRF ou remover promessa.

### Banco de dados

Adicionar entidades de domínio:

- `Vendor`: empresa contratada, CNPJ, preposto, contatos.
- `ContractAmendment`: aditivos de prazo, valor, acréscimo, supressão e justificativa.
- `Measurement`: medições, período, valor medido, glosa, retenções, status.
- `WorkDiary`: diário de obra com data, clima, equipe, fotos, localização e serviços.
- `Inspection`: checklist de fiscalização, não conformidades e recebimento provisório.
- `Guarantee`: caução, seguro-garantia, validade e valor.
- `ContractMilestone`: marcos físicos e financeiros.
- `Attachment`: anexo genérico vinculado a contrato, medição, diário ou fiscalização.
- `NotificationPreference`: preferências por usuário/perfil.

Índices importantes:

- Contrato por `status`, `endDate`, `responsibleId`, `company`, `contractNumber`.
- Pagamento por `status`, `dueDate`, `contractId`.
- Medição por `contractId`, `periodStart`, `periodEnd`, `status`.
- Eventos por `contractId`, `createdAt`.

## Roadmap sugerido

### Fase 1 - Produto mínimo confiável

- Completar upload/download de documentos.
- Criar edição de contrato.
- Criar criação e baixa de pagamentos pela UI.
- Criar tela de auditoria para perfil auditor/admin.
- Adicionar dados seed completos: contratos, pagamentos, comentários e usuários.
- Adicionar testes de build, auth, contrato e comentários.

### Fase 2 - Gestão real de obra

- Módulo de aditivos.
- Módulo de medições.
- Alertas por vigência, pagamento, garantia e medição pendente.
- Relatório PDF/CSV por contrato.
- Timeline única com eventos, documentos, comentários, medições e pagamentos.

### Fase 3 - Fiscalização técnica

- Diário de obra.
- Checklist de fiscalização.
- Registro de não conformidades.
- Recebimento provisório e definitivo.
- Painel de pendências por fiscal/responsável.

### Fase 4 - Integrações e governança

- Estudo de integração com PNCP, Contratos.gov.br e Obrasgov.br.
- Integração com SEI ou sistema de processo eletrônico do órgão.
- Exportações no layout exigido pelo órgão.
- Portal de transparência ou API pública de consulta, quando aplicável.

### Fase 5 - Escala e qualidade

- Observabilidade: logs estruturados, métricas e rastreamento de erros.
- Permissões granulares por unidade, contrato e papel.
- Backup e política de retenção de documentos.
- Hardening de segurança: CSRF, CSP revisada, rotação de refresh token, trilha de auditoria imutável.
- Testes end-to-end com Playwright.

## Melhorias de UX pendentes

- Mobile real para fiscais em campo.
- Empty states com ação direta.
- Filtros avançados por responsável, prazo, empresa e valor.
- Ordenação de tabelas.
- Exportação de listagens.
- Notificações reais no header.
- Preferências de alertas por usuário.

## Critério de sucesso

O sistema deve responder rapidamente a quatro perguntas:

1. Quais contratos estão em risco de prazo ou saldo?
2. O que foi medido, pago, glosado ou retido?
3. Quais evidências comprovam a fiscalização?
4. O que precisa ser feito por responsável nesta semana?

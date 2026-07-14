<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

@AGENTS.md

# Instruções para o Assistente DeepSeek – Projeto Limeira On

## Contexto do Projeto

- **Aplicação**: Next.js 16 (com breaking changes em relação a versões anteriores).
- **Backend/Serviços**: Supabase (autenticação, banco de dados, storage).
- **Estilização**: Tailwind CSS 4 + `shadcn/ui` + `class-variance-authority` + `clsx` + `tailwind-merge`.
- **Formulários**: `react-hook-form` + `zod` (resolver `@hookform/resolvers/zod`).
- **Gerenciamento de estado**: React hooks (useState, useEffect, context) – sem Redux.
- **Linting/Formatação**: Biome (comandos `pnpm lint` e `pnpm format` – ou `npm run`).
- **UI**: `radix-ui` para componentes acessíveis, `lucide-react` para ícones.
- **Notificações**: `react-toastify`.
- **Build**: Next.js com `output: 'standalone'`? (não informado, mas manter padrão).

## Regras Obrigatórias

### 1. Next.js 16 – Leia a documentação local

O Next.js instalado é a versão 16.2.10, com mudanças significativas. **Sempre** consulte a documentação em `node_modules/next/dist/docs/` antes de implementar qualquer recurso que envolva:

- App Router (`app/` vs `pages/`)
- Server Components e Client Components
- Data fetching (fetch, cache, revalidate)
- Middleware
- Configurações no `next.config`

**NUNCA** confie cegamente em padrões de versões anteriores.

### 2. Estrutura de diretórios (sugerida)

src/
├── app/ # App Router (páginas, layouts, loading, error)
├── components/ # Componentes reutilizáveis (shadcn/ui, customizados)
│ ├── ui/ # Componentes shadcn/ui
│ └── shared/ # Componentes de negócio
├── lib/ # Utilitários, configurações (Supabase client, etc.)
├── hooks/ # Custom hooks
├── types/ # Tipos TypeScript compartilhados
├── utils/ # Funções auxiliares (formatadores, validadores)
│ └── supabase/ # Funções auxiliares (formatadores, validadores)
└── styles/ # Globais (se não usar apenas Tailwind)

### 3. Estilização – Use sempre Tailwind + shadcn

- Prefira classes utilitárias do Tailwind.
- Para variantes, use `cva` (class-variance-authority).
- Combine classes com `clsx` e `tailwind-merge` via `cn()` (função auxiliar que você deve ter em `lib/utils`).
- Componentes shadcn/ui já estão instalados – importe de `@/components/ui/`.
- Ícones: `lucide-react`.

### 4. Formulários – react-hook-form + zod

- Definir esquemas com `zod` e tipagem inferida (`z.infer<typeof schema>`).
- Usar `useForm` com `resolver: zodResolver(schema)`.
- Campos controlados via `register` ou `Controller` para componentes shadcn.
- Validação no front‑end e, se necessário, revalidação no back‑end (Supabase).

### 5. Supabase – Clientes e SSR

- Use o pacote `@supabase/ssr` para criar clientes no servidor e no cliente.
- Configure um único cliente em `lib/supabase/client` e `lib/supabase/server`.
- Para autenticação, utilize cookies gerenciados pelo Next.js (com `cookies()`).
- Nunca exponha a `service_role key` no cliente.

### 6. Biome – Código limpo e consistente

- Execute `pnpm lint` (ou `npm run lint`) antes de commitar.
- Execute `pnpm format` para formatar automaticamente.
- Siga as regras do Biome (sem `eslint` nem `prettier`).

### 7. TypeScript

- Use tipos estritos (`strict: true` no `tsconfig.json`).
- Evite `any`; prefira `unknown` e type guards.
- Exporte tipos sempre que possível.

### 8. Performance e boas práticas

- Server Components por padrão, Client Components apenas quando necessário (use a diretiva `'use client'`).
- Use `next/dynamic` para carregamento lazy de componentes pesados.
- Otimize imagens com `next/image`.
- Use `Suspense` e `loading.tsx` para feedback de carregamento.

### 9. Mensagens de erro e notificações

- Use `react-toastify` para feedback ao usuário (toasts).
- Em ações assíncronas, sempre trate erros e exiba mensagens amigáveis.

### 10. Estilo de resposta do assistente

- Forneça **código completo** e **explicações concisas**.
- Sempre que possível, mostre exemplos baseados na stack atual.
- Se algo não estiver claro, peça mais contexto antes de sugerir.
- Prefira soluções que respeitem as convenções do Next.js 16 e da equipe.

---

## Integração com AGENTS.md existente

O arquivo `AGENTS.md` na raiz contém um aviso importante sobre o Next.js. Mantenha-o e, se desejar, pode referenciá-lo aqui ou copiar o conteúdo. As instruções acima já reforçam a necessidade de consultar a documentação local.

---

**Nota**: Este arquivo é lido pelo assistente DeepSeek sempre que você interagir com ele no Zed. Atualize-o conforme o projeto evoluir.

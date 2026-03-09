# Convex no projeto Civic Rise

Este diretório contém o backend Convex usado pelo frontend para **persistir conversas de chat** (títulos e mensagens). O Convex é **opcional**: se não for configurado, o app usa apenas estado local (TanStack Store) e as conversas não são salvas entre sessões.

---

## O que o Convex faz neste projeto

- **Persistência de conversas**: lista de conversas, títulos e mensagens (user/assistant) são armazenados na nuvem Convex.
- **Sincronização em tempo real**: quando Convex está ativo, a lista de conversas e as mensagens são refletidas na UI via `useQuery` / mutations.
- **Fallback sem Convex**: se `VITE_CONVEX_URL` não estiver definida ou for inválida, o app roda só com estado local (memória); o chat com a LLM continua funcionando, mas as conversas não são persistidas.

Fluxo resumido:

- **Frontend** → `ConvexClientProvider` (em `src/convex.tsx`) → usa `api.conversations.*` em `src/store/hooks.ts` (create, list, addMessage, updateTitle, remove).
- **Convex (nuvem)** → funções em `convex/conversations.ts` e schema em `convex/schema.ts`.

---

## Estrutura do diretório `convex/`

| Arquivo / pasta      | Descrição |
|----------------------|-----------|
| `schema.ts`          | Schema do banco: tabela `conversations` (title, messages). |
| `conversations.ts`   | Funções Convex: `list`, `get`, `create`, `updateTitle`, `addMessage`, `remove`. |
| `_generated/`        | Código gerado pelo Convex (api, dataModel, server). Não editar. |
| `convex.json`        | Config do projeto/team (preenchido ao rodar `npx convex dev` ou pelo dashboard). |
| `tsconfig.json`      | TypeScript para as funções Convex. |

---

## Schema (dados)

A tabela `conversations` tem:

- **title** (string): título da conversa (ex.: primeiras palavras da primeira mensagem).
- **messages** (array de objetos): cada item tem `id`, `role` (`"user"` ou `"assistant"`), `content` (string).

Definição em `schema.ts`; funções em `conversations.ts` (queries e mutations) leem/escrevem nessa tabela.

---

## Configuração

### 1. Variável de ambiente no frontend

No **frontend**, crie ou edite o `.env` (pode usar `.env.example` como base):

```bash
# Convex: URL do deployment (sem barra no final)
VITE_CONVEX_URL=https://seu-deployment.convex.cloud
```

- **Obrigatório** para usar Convex: valor deve ser uma URL absoluta (`https://...convex.cloud`).
- **Sem barra no final**: evita URL de WebSocket com `//api` (ex.: `wss://....convex.cloud//api/...`), que pode causar falha de conexão.
- Se **não** definir `VITE_CONVEX_URL` (ou deixar vazio), o app ignora Convex e usa só estado local.

### 2. Criar um projeto no Convex (primeira vez)

1. Acesse [convex.dev](https://convex.dev) e crie conta / login.
2. Crie um novo projeto (ex.: “civic_rise”).
3. No dashboard, em **Settings** ou **Health**, copie a **Cloud URL** (ex.: `https://xxxx.convex.cloud`).
4. Coloque essa URL em `VITE_CONVEX_URL` no `.env` do frontend (sem barra final).

### 3. Vincular este código ao projeto Convex (CLI)

Na raiz do **frontend** (onde está o `package.json` e a pasta `convex/`):

```bash
cd frontend
npx convex dev
```

- Na primeira execução o CLI pede login e permite vincular o diretório a um projeto existente (ou criar um novo).
- Isso atualiza `convex/convex.json` (project/team) e faz o **deploy** das funções em `convex/*.ts` para o deployment ligado a essa URL.

Depois de vinculado, o mesmo `npx convex dev` usa esse projeto; a URL que você coloca em `VITE_CONVEX_URL` deve ser a **Cloud URL** desse deployment (sem trailing slash).

---

## Desenvolvimento (dev)

### Rodar o frontend com Convex em dev

1. **Configurar `.env`** no frontend com `VITE_CONVEX_URL=https://seu-deployment.convex.cloud` (sem barra no final).
2. **Subir as funções Convex** (um terminal):

   ```bash
   cd frontend
   npx convex dev
   ```

   - Mantenha esse processo rodando enquanto desenvolve.
   - Ele observa mudanças em `convex/*.ts`, faz deploy e mostra logs do Convex.

3. **Subir o frontend** (outro terminal):

   ```bash
   cd frontend
   yarn dev
   # ou: npm run dev
   ```

O app em `http://localhost:3000` (ou a porta configurada) usará a Cloud URL do `.env`; conversas criadas no chat serão persistidas no Convex.

### Rodar o frontend **sem** Convex (só estado local)

- Não defina `VITE_CONVEX_URL` no `.env` (ou deixe vazia).
- Rode só `yarn dev` (ou `npm run dev`). Não é necessário rodar `npx convex dev`.
- O chat com a LLM funciona; as conversas ficam só em memória e somem ao recarregar.

---

## Produção

### Build e deploy do frontend

- No build (ex.: `yarn build`), a variável `VITE_CONVEX_URL` é embutida no bundle. Defina essa variável no **ambiente de build** do seu host (Netlify, Vercel, etc.) com a **Cloud URL do deployment de produção** do Convex (sem barra no final).

### Convex em produção

- Use um **deployment de produção** no Convex (dashboard: criar/alternar deployment para Production).
- Copie a **Cloud URL** desse deployment e use em `VITE_CONVEX_URL` no ambiente de produção do frontend.
- As funções em `convex/*.ts` são implantadas quando você roda, no pipeline ou localmente, algo como:

  ```bash
  cd frontend
  npx convex deploy
  ```

  (Ou o equivalente ao “push” do seu fluxo; o `convex dev` em geral é só para desenvolvimento.)

### Resumo rápido

| Ambiente   | O que fazer |
|-----------|-------------|
| **Dev**   | `VITE_CONVEX_URL` no `.env` do frontend (URL do deployment de dev, sem `/` no final); rodar `npx convex dev` + `yarn dev`. |
| **Prod**  | `VITE_CONVEX_URL` no ambiente de build do frontend (URL do deployment de prod); deploy das funções com `npx convex deploy` (ou fluxo equivalente). |

---

## Onde o Convex é usado no código

- **Provider**: `src/convex.tsx` – lê `VITE_CONVEX_URL`, normaliza (remove barra final), cria `ConvexReactClient` e `ConvexClientProvider`; se não houver URL válida, só renderiza os filhos (sem Convex).
- **App**: `src/routes/__root.tsx` – envolve a app com `<ConvexClientProvider>`.
- **Dados**: `src/store/hooks.ts` – usa `useQuery(api.conversations.list)` e mutations `api.conversations.create`, `updateTitle`, `addMessage`, `remove` quando Convex está disponível; senão usa apenas TanStack Store (estado local).
- **API gerada**: `convex/_generated/api` (e tipos em `_generated/dataModel`) – importados em `hooks.ts` para chamar as funções definidas em `convex/conversations.ts`.

---

## Referências

- [Convex – Docs](https://docs.convex.dev)
- [Convex – Functions](https://docs.convex.dev/functions)
- [Convex – Database](https://docs.convex.dev/database)
- CLI: `npx convex -h`, documentação local: `npx convex docs`

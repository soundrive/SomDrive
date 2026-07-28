# SomDrive — Diretrizes de Qualidade, Estabilidade e Performance

Este arquivo serve como uma **Trava de Qualidade Fixa** e persistente. Toda e qualquer alteração futura realizada no código por agentes de IA ou desenvolvedores deve ler e respeitar obrigatoriamente as diretrizes listadas abaixo para evitar regressões de carregamento lento, travamento e problemas de compatibilidade mobile.

---

## 🚫 Restrições de Alteração Escopo (Proibições Absolutas)
**NÃO** alterar, modificar ou interferir nas seguintes regras ou componentes, a menos que solicitado explicitamente pelo usuário:
- Planos de assinatura e regras de faturamento.
- Integração com Mercado Pago, Webhooks ou fluxos de pagamento.
- Painel de Administração (`AdminArea.tsx`) e gerenciamento geral de usuários.
- Upload de arquivos de áudio, capas, integração direta com Cloudflare R2 ou Firebase Storage.
- Regras de segurança do Firestore (`firestore.rules`) ou políticas de autenticação (Auth).
- Conversores de áudio ou otimizadores de arquivos.
- Regra de bloqueio de músicas por limite de plays ou liberação manual.
- Fila do player e mecânica do botão repetir.

---

## 🚀 Diretrizes de Performance e Carregamento Rápido

### 1. Roteamento SPA síncrono no carregamento inicial (`App.tsx`)
- **Regra**: O estado inicial de `currentView` e `routePayload` **deve** ser computado de forma síncrona dentro da função inicializadora do `useState`.
- **Por quê**: Isso evita que o aplicativo monte a Landing Page primeiro por um ciclo de renderização antes de ler o path da URL e mudar para o catálogo público. Garante carregamento instantâneo, sem cintilação ("landing-page flashing") para ouvintes móveis.

### 2. Code Splitting e Lazy Loading estrito
- **Regra**: Telas pesadas (`LandingPage`, `AuthScreen`, `Dashboard`, `AdminArea`, `PaymentReturnScreen`) devem ser importadas via `lazy(() => import(...))` e envelopadas por um `<Suspense fallback={<LoadingFallback />}>`.
- **Exceção**: O catálogo público (`ArtistPublic`) e o reprodutor (`Player`) **deve** permanecer estáticos no bundle principal para garantir que os ouvintes tenham renderização imediata ao abrir um link direto.

### 3. Evitar pré-carregamento de áudio abusivo
- **Regra**: O áudio no player deve respeitar o estado de economia de dados e carregar metadados (`preload = "metadata"`) ou nenhum dado (`preload = "none"`) até que o usuário clique em "Play". Nunca faça prefetch do arquivo de áudio inteiro no primeiro render para não travar a conexão do celular.

### 4. Chamadas Firestore Assíncronas e Inteligentes
- **Regra**: Incremento de visualizações, métricas de clique no WhatsApp e logs não podem bloquear a thread de renderização da UI ou atrasar o redirecionamento. Rode essas chamadas de forma assíncrona com `.catch()` tratado e nunca espere o resultado (`await`) se o usuário estiver sendo redirecionado.

### 5. Sem loops de efeitos (`useEffect` com dependências estáveis)
- **Regra**: Nunca inclua objetos, arrays ou funções instáveis no array de dependências do `useEffect`. Priorize dependências primitivas (strings, IDs, booleans) para evitar loops infinitos de re-renderização e requisições duplicadas ao Firebase.

---

## 📱 Diretrizes de Comunicação e Mobile (WhatsApp e Contatos)

### 1. Formatação de Links e Redirecionamento Direto no Celular
- **Regra**: Em celulares/dispositivos móveis, redirecionamentos para o WhatsApp devem usar `window.location.href = whatsappUrl` em vez de `window.open` para garantir que o aplicativo do WhatsApp abra de forma síncrona e não seja bloqueado por pop-up blockers (iOS Safari e Android Chrome).
- **Tratamento de Números**: Números de telefone/WhatsApp devem ser limpos mantendo apenas dígitos (`\D`). Se o número limpo tiver 10 ou 11 dígitos, o DDI `55` do Brasil deve ser concatenado de forma automática no início do número antes de gerar o link `wa.me`.
- **Fallback Sem Número**: Se o artista não possuir número de contato válido, exibir um alerta claro e polido ao usuário com `triggerAlert` (ou equivalente) em vez de falhar silenciosamente ou redirecionar para um número padrão.

---

## 🔍 Checklist Obrigatório Pré-Deploy
Antes de finalizar qualquer tarefa de desenvolvimento ou commit, rode:
1. `npm run lint` — Garantir que o linter passe sem erros de TypeScript ou imports.
2. `npm run build` — Garantir que a compilação de produção e empacotamento ocorram com sucesso.
3. Teste em Mobile Fake/Responsivo (Chrome DevTools):
   - Confirmar se o link direto `/catalogo/slug` carrega o catálogo de forma instantânea.
   - Confirmar se os botões de contato abrem a conversa sem atrasos.

# La Cuentita: especificação

App de mesa para um jogo de cartas de bar, em que cada rodada é um bar e alguém sempre fica com a conta. As cartas continuam na mesa; o app guarda a poupança de cada um, calcula a conta de cada bar do jeito certo e anuncia quem ganhou. Mesmo stack e mesmo fluxo do Flip Score, que é a base deste repositório.

Referências obrigatórias:
- Regras do jogo: seção 3 deste arquivo
- Design final do app: seção "Design" no fim deste arquivo (quando existir)

## 1. Regras do dono (valem para todo código)

- Nunca escrever comentários no código. Nenhum `//`, `/* */`, TODO ou docblock. Se precisar explicar, extraia função com nome claro.
- Identificadores sempre em inglês. Português só no texto que aparece na tela.
- Todo texto de tela em PT-BR, direto, com acentuação correta.
- Nenhum erro cru ou em inglês na tela. Use o padrão de `src/lib/errors.ts` (`checked`, `databaseError`, `ServiceError`) no servidor e `src/lib/friendly.ts` (`FriendlyError`, `readableError`) no cliente.
- Commits sem `Co-Authored-By` e sem assinatura de IA.
- Nomes em teste e dado de exemplo: genéricos ("Teste A", "Tigre", "Coruja"). Nunca nomes de pessoas reais do grupo.
- Next 16: leia `node_modules/next/dist/docs/` antes de usar API que você não tem certeza. Página de erro recebe `retry`, não `reset`. `react-hooks/set-state-in-effect` e `react-hooks/refs` são erro de lint: nada de `setState` síncrono no corpo de efeito e nada de ler/escrever `ref.current` durante o render. Timers de animação usam `useEffectEvent` para o callback (o polling re-renderiza a cada 1,5 s e reiniciaria o timer).

## 2. Stack

Next 16.3.3, React 19, TypeScript strict, Tailwind 4 (`@theme`/`@utility` em `src/app/globals.css`), Vitest, pnpm. Supabase compartilhado dos jogos (projeto `yrllgqrmcqpdlsxwefgk`, prefixo de tabela **`lc_`**, bucket **`lc-avatars`**). Polling de estado a cada 1,5 s (`src/hooks/useRoom.ts`). Dev na porta 2002. Deploy na Vercel.

## 3. Regras do jogo que o app aplica

- 3 a 8 jogadores. Poupança inicial de cada um: 900€ (3), 1.000€ (4), 1.100€ (5), 1.200€ (6), 1.300€ (7), 1.400€ (8). Fixada no início da partida (`startingSavingsFor`).
- Cada rodada é um bar. Exatamente **uma conta por bar**. Quem pediu a conta (o pagador) lança no app.
- Conta (`src/lib/game/bill.ts`, `computeBill`):
  - Tapas: carne, peixe ou verdura, preço de 10 a 70 de 10 em 10. Repetidas contam de novo.
  - Premium: dobra a carta que entrou junto (tapa ou prato queimado).
  - Prato queimado: −10€ cada (com Premium, −20€).
  - Vinho: valor do conjunto de até 5 garrafas: 30, 60, 120, 180, 240. A sexta abre outro conjunto.
  - Bolo de aniversário: 40€.
  - Gorjeta: cada uma soma o preço impresso da tapa mais barata da mesa.
  - Total negativo vira zero.
- Divisão (`splitBill`), sempre em euros inteiros:
  - Sozinho: o pagador paga tudo.
  - Meio a meio: escolhe uma pessoa; ela paga a metade arredondada para baixo e o pagador o resto.
  - Cada um paga: divide entre todos menos quem estava no banheiro ou de aniversário; cada um paga a parte arredondada para baixo e o pagador absorve o resto.
- Fim: na hora em que alguém fica com poupança ≤ 0. Vence quem tem mais poupança. Empate: todos os empatados aparecem como vencedores, com a piada ("desempata quem tiver mais dinheiro de verdade no bolso").
- Limites do baralho validados no servidor: 48 tapas, 10 vinhos, 8 queimados, 4 Premium, 1 bolo, 6 gorjetas.

## 4. Modelo de dados (Supabase, prefixo `lc_`)

Tipos TypeScript em `src/types/room.ts` (já escritos, são o contrato).

```
lc_rooms          id uuid pk, code text unique (2 dígitos), phase LOBBY|PLAYING|FINISHED,
                  round_number smallint (bar atual, começa em 1), starting_savings int null,
                  is_test bool, host_player_id uuid null, created_at, started_at, finished_at
lc_players        id, room_id → lc_rooms on delete cascade, name, avatar, emoji, seat, created_at
lc_player_secrets room_id, player_id → lc_players cascade, access_token unique; pk (room_id, player_id)
lc_bills          id, room_id → lc_rooms cascade, round_number, payer_id → lc_players set null,
                  created_by → lc_players set null, total int ≥ 0, split_mode SOLO|HALF|DUTCH,
                  detail jsonb (BillDetail), created_at, updated_at; unique (room_id, round_number)
lc_bill_shares    bill_id → lc_bills cascade, player_id → lc_players cascade, amount int ≥ 0;
                  pk (bill_id, player_id)
lc_matches        id, room_id uuid (sem FK, só referência), room_code, winner_names text[],
                  players jsonb [{name, savings}] do mais rico ao mais pobre, bars smallint,
                  starting_savings int, finished_at timestamptz default now()
```

- RLS ligada em todas, sem policies: só o servidor (chave secreta) acessa.
- `lc_generate_code()`: apaga `lc_rooms` com mais de 24 h e sorteia código de 2 dígitos (10 a 99) livre; erro claro se esgotar.
- Poupança nunca é guardada: é sempre `starting_savings − soma das partes do jogador` (`withSavings` em `src/lib/game/standings.ts`).
- Gravação de conta e desfazer são **atômicos**, em funções Postgres com `select ... for update` na sala:
  - `lc_record_bill(room, round, payer, created_by, total, split_mode, detail, shares jsonb, replace_bill uuid null)`: valida fase e rodada (ou, se `replace_bill`, que ela é a última conta da sala), insere conta e partes, avança `round_number`, e se alguém ficou ≤ 0 fecha a partida (FINISHED, `finished_at`) e grava `lc_matches` uma vez só (pula se `is_test`).
  - `lc_undo_bill(room, bill)`: só a última conta; apaga, volta `round_number` para o bar dela e, se a partida tinha acabado, reabre (PLAYING, `finished_at` nulo) e apaga a linha de `lc_matches` da sala.
- Migração em `supabase/migrations/0001_init.sql`, aplicada pela Management API do Supabase com `curl` (o `urllib` do Python leva 403 do Cloudflare).

## 5. API (contrato do cliente em `src/lib/api.ts`)

Header `x-player-token` identifica o jogador. Toda rota usa `handle()` de `src/app/api/_shared.ts`.

| Método | Rota | Quem | Faz |
|---|---|---|---|
| POST | `/api/rooms` | qualquer um | cria sala (`hostName`, `emoji`), devolve `JoinResponse`; `is_test` via `looksLikeRobot` |
| GET | `/api/rooms/[code]` | qualquer um | `RoomState` (sala, jogadores com poupança, contas com partes em ordem de bar, `meId`) |
| POST | `/api/rooms/[code]/join` | qualquer um | entra no lobby; nome único sem diferenciar maiúscula; máximo 8; `seat` = maior + 1 |
| POST | `/api/rooms/[code]/start` | dono | 3 a 8 jogadores; fixa `starting_savings`; bar 1 |
| POST | `/api/rooms/[code]/bills` | jogador sentado | lança a conta do bar atual (`BillDraft`); servidor revalida com `checkBillDraft`, recalcula `computeBill` e `splitBill`, grava via `lc_record_bill` |
| PUT | `/api/rooms/[code]/bills/[billId]` | quem lançou, quem pagou ou o dono | corrige a **última** conta (mesmo bar), via `lc_record_bill` com `replace_bill` |
| DELETE | `/api/rooms/[code]/bills/[billId]` | quem lançou, quem pagou ou o dono | desfaz a **última** conta via `lc_undo_bill` |
| POST | `/api/rooms/[code]/remove` | dono | tira alguém (não a si mesmo; não em FINISHED). Partes da pessoa somem por cascata |
| POST | `/api/rooms/[code]/leave` | jogador | sai; último a sair apaga a sala; dono que sai passa o posto |
| POST | `/api/rooms/[code]/profile` | jogador | troca emoji |
| POST | `/api/rooms/[code]/avatar` | jogador | foto (jpeg/png/webp, até 512 KB) no bucket `lc-avatars` |
| GET | `/api/history` | qualquer um | `lc_matches` mais recentes |

Erros de negócio em PT-BR com status certo: conta já lançada para o bar (409), bar já mudou (409), conta que não é a última (409), sem permissão (403), sala sumida (404), banco fora (503).

## 6. Comportamento do cliente (resumo; detalhes no Design)

- Mesmo fluxo do Flip Score: abertura, home com última sala, criar/entrar com nome e emoji, lobby com código, foto/emoji, dono começa e pode tirar gente, mesa, fim, histórico com ranking do mês, regras em carrossel, som liga/desliga, erros em português, aviso quando o placar para de atualizar, tela de "você não está mais nesta mesa" e de "essa sala acabou".
- Quem pediu a conta toca nas cartas que ficaram na mesa (imagens de carta desenhadas pelo app, como no Flip Score), vê o total ao vivo, escolhe como dividir e confirma.
- A conta nova aparece em todos os celulares com a animação de zoeira do pagador, uma vez só por aparelho.
- Quando alguém zera: animação de falência para quem quebrou e depois a do vencedor.
- Arte própria (SVG/CSS/emoji). Nada de imagem de terceiros no app.

## 7. Verificação

- `pnpm exec next typegen` antes do primeiro `tsc` num checkout novo.
- `pnpm exec tsc --noEmit -p .`, `pnpm lint`, `pnpm test`, `pnpm build` sem erro.
- Tela: rodar `pnpm exec next dev -p <porta>` e tirar screenshot em 390×844 com `playwright-core` usando o Chrome instalado (`executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`). Olhar as imagens com a ferramenta Read.
- Teste em banco real: só salas de teste (user-agent sem navegador vira `is_test`), nomes "Teste A/B/C/D", e apagar as salas no fim.

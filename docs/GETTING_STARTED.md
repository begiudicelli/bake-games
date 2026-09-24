# 📖 Getting Started

Guia completo para configurar o Bake Games em sua máquina e começar a desenvolver.

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Instalação](#instalação)
3. [Estrutura do Workspace](#estrutura-do-workspace)
4. [Rodando em Desenvolvimento](#rodando-em-desenvolvimento)
5. [Comandos Disponíveis](#comandos-disponíveis)
6. [Verificação Inicial](#verificação-inicial)
7. [Próximos Passos](#próximos-passos)

---

## Pré-requisitos

### Sistema
- **Node.js** 18.0 ou superior ([download](https://nodejs.org/))
- **npm** 9+ (vem com Node.js) ou **pnpm** 8+
- **Git**

### Verificar Instalação

```bash
node --version    # v18.0.0 ou superior
npm --version     # 9.0.0 ou superior
git --version     # git version 2.x.x
```

---

## Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/begiudicelli/bake-games.git
cd bake-games
```

### 2. Instale Dependências

O projeto usa **pnpm workspaces** para gerenciar múltiplos pacotes.

```bash
# Recomendado: usar pnpm (mais rápido)
pnpm install

# Ou usar npm
npm install
```

**O que é instalado:**
- `packages/shared/` - Tipos compartilhados
- `web/` - Aplicação Angular
- `server/` - Servidor PartyKit

---

## Estrutura do Workspace

```
bake-games/
├── packages/shared/          # Pacote compartilhado
│   └── src/
│       ├── common-types.ts   # Tipos base
│       ├── yahtzee/
│       ├── tic-tac-toe/
│       └── sudoku/
├── web/                      # Frontend Angular
│   ├── src/app/
│   ├── angular.json
│   └── package.json
├── server/                   # Backend PartyKit
│   ├── src/party/
│   ├── partykit.json
│   └── package.json
└── package.json             # Root (workspaces)
```

### Workspaces Explicado

O projeto usa **workspaces** para compartilhar código entre frontend e backend:

```
Frontend (web/)
    ↓ imports
@bake/shared
    ↑ imports
Backend (server/)
```

Quando você edita tipos em `packages/shared/`, ambos frontend e backend veem as mudanças imediatamente.

---

## Rodando em Desenvolvimento

### ⚠️ Importante: Ordem de Inicialização

PartyKit **deve estar rodando** antes do Angular frontend conectar.

### Terminal 1: Inicie o PartyKit Server

```bash
cd server
npm run dev
```

**Saída esperada:**
```
▲ [PartyKit] listening on http://127.0.0.1:1999
```

Deixe este terminal aberto. O servidor agora:
- Aceita conexões WebSocket em `ws://127.0.0.1:1999`
- Carrega room handlers para os 3 jogos
- Hot-reloads em mudanças de arquivo

### Terminal 2: Inicie o Angular Dev Server

```bash
cd web
npm start
```

**Saída esperada:**
```
✔ Compiled successfully.
ng serve --open
⠙ Building...

Application bundle generation complete.
Initial Chunk Files | Names | Size
main.js | main | 650.23 kB
```

Abra http://localhost:4200 no navegador. A aplicação agora:
- Hot-reloads em mudanças
- Conecta automaticamente ao PartyKit em `127.0.0.1:1999`
- Mostra 3 jogos disponíveis

---

## Comandos Disponíveis

### Root (pnpm workspaces)

```bash
pnpm install              # Instala todas as dependências
pnpm test                # Roda testes (root placeholder)
```

### Frontend (`cd web/`)

```bash
npm start                # Dev server em :4200
npm run build            # Build de produção → dist/
npm run lint             # ESLint
npm run format           # Prettier (formatar código)
npm test                 # Karma tests (watch mode)
```

### Backend (`cd server/`)

```bash
npm run dev              # Dev server em :1999 (hot-reload)
npm run build            # Build para production
npm run deploy           # Deploy to PartyKit (se configurado)
```

---

## Verificação Inicial

Após iniciar ambos os servidores, teste os 3 jogos:

### 1. Abra http://localhost:4200
Você deve ver a home com 3 opções de jogo.

### 2. Teste Yahtzee (1-8 players)
- Clique "Yahtzee"
- Digite um nome
- Digite nome da sala (ex: "minha-sala")
- Clique "Criar"
- Você entra na sala de espera
- Clique "Iniciar Jogo"
- Você pode jogar sozinho

### 3. Teste Multiplayer (Tic Tac Toe)
- Abra 2 abas do navegador (mesma máquina)
- Aba 1: Crie Tic Tac Toe com sala "test1"
- Aba 2: Crie Tic Tac Toe com sala "test1" (mesmo código)
- Ambos devem aparecer na mesma sala
- Quando tiver 2 players, jogo inicia automaticamente

### 4. Verifique DevTools
- F12 → Network → WS
- Você deve ver conexão com `127.0.0.1:1999`
- Cada ação deve enviar mensagens WebSocket

---

## Troubleshooting da Instalação

### "Module not found: @bake/shared"

**Solução:** Reinstale workspaces
```bash
rm -rf node_modules
pnpm install
```

### "Cannot connect to 127.0.0.1:1999"

**Solução:** Certifique-se que PartyKit está rodando
```bash
cd server
npm run dev
```

### "Port 4200 already in use"

**Solução:** Use outra porta
```bash
ng serve --port 4300
```

### "Cannot find module 'partykit/server'"

**Solução:** Instale dependências do server
```bash
cd server
npm install
```

---

## Próximos Passos

Agora que tudo está rodando:

1. **Entenda a arquitetura:**
   - Leia [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
   - Veja como frontend e backend se comunicam

2. **Explore o código:**
   - Frontend: `web/src/app/features/yahtzee/`
   - Backend: `server/src/party/yahtzee-.ts`
   - Tipos: `packages/shared/src/yahtzee/`

3. **Modifique algo:**
   - Altere um componente (ex: cor, texto)
   - Veja hot-reload em ação
   - Commit suas mudanças

4. **Crie um novo jogo (opcional):**
   - Leia [docs/GAME_DEVELOPMENT.md](./GAME_DEVELOPMENT.md)
   - Use script: `./scripts/new-game.sh --name "Meu Jogo" --slug meu-jogo`

---

## Dicas de Desenvolvimento

### Hot Reload
- Angular (web): Automático ao salvar arquivo
- PartyKit (server): Automático ao salvar `.ts`
- Tipos (shared): Recarregue browser manual se necessário

### Debug Frontend
```bash
# Chrome DevTools
F12 → Sources → Breakpoints → Step through code
```

### Debug Backend
```bash
# Adicione console.log em server/src/party/
console.log('Debug:', message);
# Veja output no terminal do PartyKit
```

### Formato de Código
```bash
cd web
npm run format  # Prettier automático
```

---

## Ambiente de Produção

Não é necessário para desenvolvimento, mas para referência:

```bash
# Build frontend
cd web
npm run build

# Build server
cd server
npm run build

# Deploy (se tiver PartyKit account)
cd server
npm run deploy
```

---

## Próximas Seções Recomendadas

- 🏗️ [Architecture](./ARCHITECTURE.md) - Entender design
- 🎲 [Game Development](./GAME_DEVELOPMENT.md) - Criar novo jogo
- 🤝 [Contributing](./CONTRIBUTING.md) - Boas práticas
- 📡 [API Reference](./API.md) - Tipos e contratos

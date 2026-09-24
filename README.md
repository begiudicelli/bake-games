# 🎮 Bake Games

Plataforma web para jogos multiplayer em tempo real. Construída com Angular 19 (frontend) e PartyKit (backend).

**Status:** 🚧 Em desenvolvimento | **Jogos:** Yahtzee, Tic Tac Toe, Sudoku (parcial)

---

## ⚡ Quick Start

### Pré-requisitos
- Node.js 18+
- npm ou pnpm

### Instalação

```bash
# Clone e entre no diretório
git clone https://github.com/begiudicelli/bake-games.git
cd bake-games

# Instale dependências (workspaces)
npm install
# ou
pnpm install
```

### Desenvolvimento

**Terminal 1: Backend (PartyKit)**
```bash
cd server
npm run dev
# Servidor em http://127.0.0.1:1999
```

**Terminal 2: Frontend (Angular)**
```bash
cd web
npm start
# App em http://localhost:4200
```

> ⚠️ PartyKit deve estar rodando antes de abrir o navegador

### Build & Deploy

```bash
cd web
npm run build
# Output: web/dist/bake-platform/
```

---

## 🛠️ Tech Stack

| Layer | Tecnologia | Versão |
|-------|-----------|--------|
| **Frontend** | Angular | 19.2.0 |
| **Backend** | PartyKit | 0.0.115 |
| **Linguagem** | TypeScript | 5.7.2 |
| **Styling** | Tailwind CSS | 3.4.19 |
| **Teste** | Karma + Jasmine | 6.4.0, 5.6.0 |

---

## 📚 Documentação

- **[📖 Getting Started](./docs/GETTING_STARTED.md)** - Setup detalhado e primeiros passos
- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** - Design e padrões da plataforma
- **[🎲 Game Development](./docs/GAME_DEVELOPMENT.md)** - Como criar novo jogo
- **[🤝 Contributing](./docs/CONTRIBUTING.md)** - Código, commits, workflow
- **[📡 API Reference](./docs/API.md)** - Tipos e contratos
- **[🆘 Troubleshooting](./docs/TROUBLESHOOTING.md)** - Erros e soluções

Para agentes IA/automação: ver [AGENTS.md](./AGENTS.md)

---

## 🎲 Jogos Disponíveis

### Yahtzee
- 1-8 jogadores
- Turn-based
- Scoring baseado em combinações

### Tic Tac Toe
- 2 jogadores
- Automatch quando 2 players conectam
- Win detection

### Sudoku
- 1-2 jogadores (competição)
- 3 níveis de dificuldade
- Validação de solução

---

## 🏗️ Estrutura do Projeto

```
bake-games/
├── packages/shared/          # Tipos compartilhados (@bake/shared)
├── web/                      # Frontend Angular
├── server/                   # Backend PartyKit
├── docs/                     # Documentação (veja links acima)
├── scripts/                  # Utilitários (new-game.sh)
└── README.md                 # Este arquivo
```

---

## 🤔 Objetivo

Criar uma plataforma modular e escalável para:
- Aprender arquitetura fullstack (frontend + backend real-time)
- Explorar padrões de multiplayer e sincronização de estado
- Servir como base para novos jogos

Ideal como projeto de aprendizado para **desenvolvedores intermediários**.

---

## 📝 Licença

Desenvolvido como projeto educacional. Veja [LICENSE](./LICENSE) se aplicável.

---

## 👥 Autor

**Bernardo Giudicelli**  
GitHub: [@begiudicelli](https://github.com/begiudicelli)

---

## 🚀 Próximos Passos

- 👉 [Começar com Quick Start acima](#-quick-start)
- 📖 [Ler Getting Started](./docs/GETTING_STARTED.md)
- 🎲 [Entender a arquitetura](./docs/ARCHITECTURE.md)
- 🎮 [Criar primeiro jogo](./docs/GAME_DEVELOPMENT.md)

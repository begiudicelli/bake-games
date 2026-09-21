# 🎮 Bake Games

Plataforma web para desenvolvimento e execução de jogos multiplayer diretamente no navegador.

O Bake Games é um projeto experimental focado na construção de uma plataforma de jogos web com comunicação em tempo real. A aplicação utiliza Angular no frontend e PartyKit/PartySocket para comunicação entre clientes e servidor.

O projeto também possui um pacote compartilhado (`@bake/shared`) para centralizar tipos e estruturas utilizadas pelas diferentes partes da aplicação.

> 🚧 **Status:** Em desenvolvimento
>
> 🎲 **Jogos disponíveis:** Yahtzee e Jogo da Velha (Tic Tac Toe)

---

## ✨ Objetivo

O objetivo do projeto é criar uma base para jogos multiplayer acessíveis diretamente pelo navegador, explorando conceitos como:

- aplicações multiplayer em tempo real;
- comunicação WebSocket;
- sincronização de estado entre jogadores;
- arquitetura frontend/backend;
- compartilhamento de tipos entre aplicações;
- desenvolvimento de jogos utilizando tecnologias web.

A infraestrutura foi pensada para servir como base para diferentes jogos, mantendo a comunicação e os componentes comuns centralizados.

---

## 🎲 Jogos disponíveis

Atualmente, a plataforma já conta com os seguintes jogos multiplayer implementados:

- **Yahtzee**
- **Jogo da Velha (Tic Tac Toe)**

Novos jogos serão adicionados conforme a evolução do projeto.

---

## 🏗️ Arquitetura

O projeto está organizado em três partes principais:

```text
bake-games/
├── packages/
│   └── shared/
│       └── src/
│
├── server/
│   └── ...
│
├── web/
│   └── ...
│
├── package.json
├── package-lock.json
└── pnpm-workspace.yaml
```

### Web
Aplicação frontend desenvolvida com Angular 19. É responsável pela interface da plataforma e pela comunicação com o servidor multiplayer.

Principais tecnologias:
- Angular 19
- TypeScript
- RxJS
- PartySocket
- Tailwind CSS
- ESLint
- Prettier

### Server
Camada responsável pela lógica executada no servidor e pela comunicação em tempo real, utilizando PartyKit.

Tecnologias principais:
- Node.js
- PartyKit
- PartySocket
- TypeScript
- WebSocket

### Shared
Pacote compartilhado entre frontend e servidor.

```text
packages/shared/
└── src/
```

O pacote é disponibilizado como `@bake/shared`. A ideia é centralizar tipos, interfaces e estruturas comuns, evitando duplicação entre as aplicações.

---

## 🛠️ Tecnologias

| Tecnologia | Utilização |
|---|---|
| Angular 19 | Frontend |
| TypeScript | Linguagem principal |
| Node.js | Runtime do servidor |
| PartyKit | Infraestrutura multiplayer |
| PartySocket | Comunicação em tempo real |
| RxJS | Programação reativa |
| Tailwind CSS | Estilização |
| ESLint | Análise de código |
| Prettier | Formatação |
| pnpm Workspaces | Organização dos pacotes |

---

## 📦 Pré-requisitos

Antes de executar o projeto, certifique-se de possuir:

- Node.js instalado;
- npm ou pnpm;
- Git.

Verifique as versões instaladas:

```bash
node --version
npm --version
pnpm --version
```

---

## 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/begiudicelli/bake-games.git
```

Entre no diretório:

```bash
cd bake-games
```

Instale as dependências:

```bash
npm install
```

Ou, caso esteja utilizando pnpm:

```bash
pnpm install
```

---

## 💻 Desenvolvimento

Para rodar o projeto completo em ambiente de desenvolvimento, é necessário subir **dois processos separados**: o servidor PartyKit e a aplicação Angular.

### 1. Servidor (PartyKit)

Entre no diretório do servidor:

```bash
cd server
```

Execute o PartyKit em modo de desenvolvimento:

```bash
npx partykit dev
```

Por padrão, o servidor ficará disponível em:

```text
http://127.0.0.1:1999
```

> Mantenha esse processo em execução — ele é responsável pela comunicação em tempo real entre os jogadores.

### 2. Frontend (Angular)

Em um novo terminal, entre no diretório da aplicação web:

```bash
cd web
```

Execute o servidor de desenvolvimento:

```bash
npm start
```

Ou:

```bash
ng serve
```

Depois, acesse:

```text
http://localhost:4200/
```

O Angular recarrega automaticamente a aplicação quando alterações são realizadas durante o desenvolvimento.

> ⚠️ Certifique-se de que o PartyKit (passo 1) esteja rodando antes de abrir a aplicação web, pois o frontend depende da conexão com o servidor para funcionar corretamente.

---

## 🧪 Testes

Para executar os testes unitários do frontend:

```bash
cd web
npm test
```

Ou diretamente pelo Angular CLI:

```bash
ng test
```

O projeto utiliza Karma como test runner para os testes unitários do Angular.

---

## 🔍 Lint

Para verificar problemas de qualidade e estilo no código:

```bash
cd web
npm run lint
```

---

## 🏭 Build

Para gerar uma versão de produção:

```bash
cd web
npm run build
```

Os arquivos compilados serão disponibilizados no diretório de build do Angular.

---

## 🔄 Comunicação em tempo real

Uma das principais características do projeto é a utilização de PartyKit e PartySocket para comunicação multiplayer.

De forma simplificada:

```text
┌──────────────┐
│    Jogador   │
│   Browser    │
└──────┬───────┘
       │
       │ WebSocket
       ▼
┌──────────────┐
│   PartyKit   │
│    Server    │
└──────┬───────┘
       │
       │ Estado / Eventos
       ▼
┌──────────────┐
│    Outros    │
│   Jogadores  │
└──────────────┘
```

A comunicação persistente permite que eventos de uma sessão multiplayer possam ser transmitidos entre os participantes.

---

## 📚 Shared Package

O pacote `@bake/shared` existe para evitar a duplicação de estruturas entre frontend e backend.

Exemplo conceitual:

```typescript
export interface Player {
  id: string;
  name: string;
}
```

O tipo pode então ser utilizado pelas diferentes aplicações:

```typescript
import type { Player } from '@bake/shared';
```

Essa abordagem mantém os contratos compartilhados centralizados.

---

## 📁 Organização do projeto

```text
bake-games/
│
├── packages/
│   └── shared/
│       └── src/
│           └── index.ts
│
├── server/
│   ├── package.json
│   └── ...
│
├── web/
│   ├── src/
│   ├── public/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── .editorconfig
├── .gitignore
├── .prettierignore
├── .prettierrc
├── package.json
├── package-lock.json
└── pnpm-workspace.yaml
```

---

## 🗺️ Roadmap

- [x] Estrutura base da plataforma
- [x] Sistema de salas multiplayer
- [x] Entrada e saída de jogadores
- [x] Sincronização de estado
- [x] Primeiro jogo multiplayer (Yahtzee)
- [x] Segundo jogo multiplayer (Jogo da Velha)
- [ ] Sistema de lobby
- [ ] Gerenciamento de sessões
- [ ] Interface da plataforma
- [ ] Testes automatizados
- [ ] Deploy da aplicação
- [ ] Monitoramento e observabilidade

---

## 🎯 Objetivos técnicos

O projeto também serve como ambiente de estudo e experimentação em:

- desenvolvimento web multiplayer;
- WebSockets;
- arquitetura distribuída;
- programação reativa;
- TypeScript;
- Angular;
- comunicação cliente-servidor;
- compartilhamento de contratos;
- desenvolvimento de jogos para navegador.

---

## 📌 Status do projeto

Bake Games está atualmente em desenvolvimento. A arquitetura inicial já possui frontend, servidor e pacote compartilhado, servindo como base para a implementação dos jogos e das funcionalidades multiplayer.

Atualmente, os jogos **Yahtzee** e **Jogo da Velha (Tic Tac Toe)** já estão disponíveis e funcionais na plataforma.

---

## 👨‍💻 Autor

**Bernardo Giudicelli**
- GitHub: [@begiudicelli](https://github.com/begiudicelli)
- Repositório: [bake-games](https://github.com/begiudicelli/bake-games)

---

## 📄 Licença

Este projeto está em desenvolvimento e a definição da licença ainda pode ser realizada conforme a evolução do projeto.

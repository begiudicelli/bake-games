# 🆘 Troubleshooting

Soluções para problemas comuns ao trabalhar com Bake Games.

## Installation & Setup

### "Module not found: @bake/shared"

**Causa:** Workspaces não instaladas corretamente

**Solução:**
```bash
rm -rf node_modules
pnpm install
# ou
npm install
```

### "Cannot find module 'partykit/server'"

**Causa:** Dependências do servidor não instaladas

**Solução:**
```bash
cd server
npm install
```

### "Port 4200 already in use"

**Causa:** Outra instância Angular rodando

**Solução:**
```bash
# Opção 1: Matar processo
lsof -i :4200
kill -9 <PID>

# Opção 2: Usar porta diferente
ng serve --port 4300
```

### "Port 1999 already in use"

**Causa:** PartyKit já está rodando

**Solução:**
```bash
# Encontrar e matar processo
ps aux | grep partykit
kill -9 <PID>

# Ou usar porta diferente
npm run dev -- --port 2000
```

---

## Development Server

### "PartyKit server not responding"

**Causa:** Servidor não inicializado

**Solução:**
```bash
# Terminal 1: Verificar se está rodando
cd server
npm run dev

# Esperado:
# ▲ [PartyKit] listening on http://127.0.0.1:1999
```

### "Cannot connect to 127.0.0.1:1999"

**Causa:** Frontend tentando conectar antes do backend

**Solução:**
1. Inicie PartyKit primeiro (Terminal 1)
2. Aguarde mensagem "listening on..."
3. Depois inicie Angular (Terminal 2)
4. Recarregue browser

### Hot reload não funciona

**Frontend (Angular):**
- Verificar se arquivo foi salvo
- Aguardar mensagem "Compiled successfully"
- F5 para forçar recarregar

**Backend (PartyKit):**
- Verificar sintaxe do arquivo `.ts`
- Pode precisar recarregar página e reconectar

### "Hot reload in progress, please wait..."

**Causa:** Processo de compilação em andamento

**Solução:** Aguarde a compilação terminar

---

## Game Issues

### Jogo não inicia quando clico "Iniciar"

**Verificar:**

1. **Você é o líder?** (deve ser o primeiro a entrar)
2. **Tem minPlayers?** (Yahtzee min=1, Tic Tac Toe min=2)
3. **Está em fase 'waiting'?** Veja F12 → Console

```typescript
// No console do browser
JSON.stringify(roomService.state(), null, 2)
```

**Solução:**
- Recarregue a página
- Tente novamente em outra sala
- Verifique console para erros

### "Sala cheia" - não consegue entrar

**Causa:** Room já tem max players

**Solução:**
- Use outro código de sala (digitar novo nome)
- Aguarde alguém sair

### Multiplayer não funciona (2 abas, mesmo código)

**Verificar:**

1. PartyKit está rodando? (`npm run dev`)
2. Ambas abas conectadas? (DevTools → Network → WS)
3. Mesma sala? (Verificar código)

**Debug:**
```typescript
// Console browser
roomService.connected()  // deve ser true
roomService.playersInfo()  // deve mostrar ambos jogadores
```

**Solução:**
- Feche ambas abas, reabra
- Inicie PartyKit, depois Angular
- Tente salas diferentes

### Estado não sincroniza entre clientes

**Verificar:**

1. WebSocket conectada? (F12 → Network → WS)
2. Mensagens sendo enviadas? (F12 → Network → WS → Frames)
3. `roomService._state.set()` sendo chamado?

**Debug:**
```typescript
// Console player 1
roomService.playersInfo()

// Console player 2 (mesma sala)
roomService.playersInfo()
// Devem ser iguais
```

**Solução:**
- Verificar backend (`console.log` em `onMessage`)
- Verificar broadcast está sendo chamado
- Recarregue ambos clientes

---

## TypeScript & Build

### "TS2339: Property 'X' does not exist"

**Causa:** Tipo incorreto ou faltante

**Solução:**
```typescript
// ❌ Evitar
const value = (playerData as any).score;

// ✅ Bom
import { PlayerState } from '@bake/shared';
const player: PlayerState = playerData;
const value = player.scores['ones'];
```

### "Cannot find module '@bake/shared'"

**Causa:** Path alias mal configurado

**Solução:**
```bash
# Verificar tsconfig.json
cat web/tsconfig.json | grep paths

# Esperado:
# "@bake/shared": ["../packages/shared/src/index.ts"]

# Se faltando, adicione em tsconfig.json
```

### Build falha com "NG0: Type 'X' is not assignable"

**Causa:** Tipo incompatível

**Solução:**
1. Leia a mensagem completa
2. Verifique tipo do component
3. Verifique tipo do input

```typescript
// ❌ Errado
<app-waiting-room [roomService]="myString" />

// ✅ Certo
<app-waiting-room [roomService]="roomService" />
```

---

## Network & WebSocket

### "WebSocket connection failed"

**Verificar:**

1. PartyKit está rodando?
2. Port 1999 está aberta?
3. Firewall permite conexão?

**Solution:**
```bash
# Verificar se PartyKit está rodando
curl http://127.0.0.1:1999

# Esperado: HTML ou erro, mas resposta rápida
```

### "Message sent but no response"

**Causa:** Servidor não processando mensagens

**Verificar:**

1. `onMessage` está sendo acionado?
2. Validação está falhando silenciosamente?

**Debug no server:**
```typescript
// server/src/party/yahtzee-.ts
onMessage(message: string, sender: Party.Connection): void {
  console.log('Received:', message);  // Adicione
  const parsed = JSON.parse(message);
  console.log('Parsed:', parsed.type);  // E aqui
  // ... resto do código
}
```

Verifique output no terminal do PartyKit.

### "Timeout - no response from server"

**Causa:** Servidor sobrecarregado ou travado

**Solução:**
1. Reinicie PartyKit: `npm run dev`
2. Verifique logs para erros
3. Reduza número de conexões simultâneas

---

## Performance

### App lento, interface travando

**Verificar:**

1. Change detection não está otimizado?
2. Computed rodando desnecessariamente?

**Debug:**
```typescript
// Chrome DevTools → Performance
// Registre a ação, veja o que está rodando

// Verificar se todos componentes usam OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // Deve estar aqui
})
```

**Solução:**
- Adicione OnPush a componentes
- Use `computed` ao invés de recalcular em template
- Reduzir número de signals

### Bundle muito grande

**Verificar:**
```bash
cd web
npm run build

# Veja tamanho em dist/bake-platform/
```

**Se > 1MB:**
```bash
# Analisar bundle
npm install -g webpack-bundle-analyzer
# ou em build config
```

**Solução:**
- Lazy load rotas (já está implementado)
- Remove imports desnecessários
- Otimize imagens

---

## Browser DevTools

### Como debugar melhor

**Console:**
```typescript
// Verifique estado
JSON.stringify(roomService.state(), null, 2)

// Verifique conexão
roomService.connected()

// Verifique jogadores
roomService.playersInfo()

// Force update
roomService.state().set(roomService.state())
```

**Network:**
1. F12 → Network
2. Filtro "WS"
3. Clique na conexão
4. Abra "Frames"
5. Veja mensagens enviadas/recebidas

**Performance:**
1. F12 → Performance
2. Clique "Record"
3. Realize ação (rolar dados, etc)
4. Stop
5. Analise flame chart

---

## Git & Commits

### "Git staging area is messed up"

**Solução:**
```bash
git status

# Se vê muitos files changed:
git reset HEAD .

# Depois stage apenas o que quer
git add arquivo1.ts
git add arquivo2.ts
```

### "Committed wrong file"

**Solução (se não fez push):**
```bash
# Desfazer último commit, manter mudanças
git reset --soft HEAD~1

# Agora remova arquivo do staging
git reset arquivo-errado.ts

# Recommit
git add arquivo-certo.ts
git commit -m "corrigido"
```

### "Want to undo push"

**Solução:**
```bash
# Se só você trabalha nele
git reset HEAD~1
git push --force

# ⚠️ Só se seguro!
```

---

## Testing

### Testes não rodam

**Solução:**
```bash
cd web
npm test

# Se falhar, limpe cache
rm -rf node_modules/.cache
npm test
```

### Teste passa localmente mas falha em CI

**Causa:** Diferença no ambiente

**Solução:**
- Rode em modo headless: `npm test -- --watch=false`
- Verifique timeouts (aumentar em karma.conf.js)
- Simule CI localmente

---

## Common Errors

### "Cannot read property 'X' of undefined"

**Causa:** Acessando propriedade de `null`/`undefined`

**Solução:**
```typescript
// ❌ Errado
const name = player.name;  // Pode ser undefined

// ✅ Certo
const name = player?.name ?? 'Unknown';

// Ou em template:
{{ player?.name }}
```

### "Maximum call stack exceeded"

**Causa:** Recursão infinita ou loop

**Solução:**
1. Procure por recursão sem base case
2. Procure por computed que depende de si mesmo
3. Procure por watchers infinitos

---

## Contacting Support

Se nada funcionar:

1. **Verifique GETTING_STARTED.md** - Setup correto?
2. **Cheque Architecture.md** - Entende o padrão?
3. **Abra uma issue** no GitHub com:
   - Descrição do erro
   - Steps to reproduce
   - `git log -1` (último commit)
   - `node --version` e `npm --version`
   - Output do console/erro

---

## Próximas Seções

- 📖 [Getting Started](./GETTING_STARTED.md)
- 🏗️ [Architecture](./ARCHITECTURE.md)
- 📡 [API Reference](./API.md)

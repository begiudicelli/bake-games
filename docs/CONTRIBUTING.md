# 🤝 Contributing

Guia para contribuir ao Bake Games. Seguir esses padrões garante qualidade e coesão.

## Código & Style

### TypeScript

- Use tipos explícitos (sem `any`)
- Prefira `type` para unions, `interface` para contracts
- Use `const` por padrão, `let` raramente
- Nomes descritivos (ex: `playerName` não `pn`)

```typescript
// ✅ Bom
const calculateScore = (dice: number[]): number => {
  return dice.reduce((sum, val) => sum + val, 0);
};

// ❌ Evitar
const calc = (d) => d.reduce((s, v) => s + v, 0);
```

### Frontend Components

```typescript
// ✅ Sempre
@Component({
  selector: 'app-component-name',
  standalone: true,              // Sempre
  imports: [CommonModule, ...],
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,  // Sempre
})

// ❌ Nunca
NgModules, lazy RxJS, any type
```

### Signals Pattern

```typescript
// ✅ Bom
private readonly _state = signal(initialState);
readonly state = this._state.asReadonly();

// ❌ Evitar
this.state = signal(initialState);  // Sem proteção
Subject/Observable chains
```

### Naming

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Variável | camelCase | `playerName` |
| Constante | UPPER_SNAKE_CASE | `MAX_PLAYERS` |
| Classe | PascalCase | `YahtzeePageComponent` |
| Arquivo | kebab-case | `yahtzee-page.component.ts` |
| Pasta | kebab-case | `tic-tac-toe/` |
| Signal privado | `_name` | `_playerName` |

## Git Workflow

### Branches

Prefira trabalhar em branches descritivas:

```bash
git checkout -b feature/add-game-validation
git checkout -b fix/connection-timeout
git checkout -b docs/update-architecture
```

**Não** faça push direto em `master`.

### Commits

Use mensagens semânticas:

```
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Documentação
style:    Formatação, sem lógica
refactor: Refatoração sem mudança de comportamento
test:     Testes
chore:    Dependências, build, config
```

**Exemplos:**

```bash
git commit -m "feat: add roll validation in yahtzee"
git commit -m "fix: handle reconnection on socket close"
git commit -m "docs: clarify architecture diagram"
git commit -m "refactor: extract calculateScore to utils"
```

**Regra:** 1 commit = 1 mudança lógica (atomic)

```bash
# ✅ Bom
git commit -m "feat: add dice rolling"
git commit -m "feat: add dice keeping UI"

# ❌ Evitar
git commit -m "feat: add dice and scoring and validation"
```

### Pull Requests

Abra um PR quando:
- Funcionalidade completa e testada
- Pronto para revisão

**Template:**

```
## Description
O que foi feito e por quê?

## Changes
- Item 1
- Item 2

## Testing
Como testar?

## Checklist
- [ ] TypeScript sem erros
- [ ] Testes passam
- [ ] Linter passa
- [ ] Documentação atualizada (se necessário)
```

## Testing

### Unit Tests

Estrutura recomendada:

```typescript
describe('YahtzeeRoomService', () => {
  let service: YahtzeeRoomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [YahtzeeRoomService],
    });
    service = TestBed.inject(YahtzeeRoomService);
  });

  it('should calculate upper section total', () => {
    const player = createMockPlayer();
    player.scores = { ones: 5, twos: 10 };
    expect(calculateUpperTotal(player)).toBe(15);
  });
});
```

Executar:

```bash
cd web
npm test
```

### Manual Testing

Antes de submeter PR, teste:

1. **Single player**: Yahtzee com 1 player
2. **Multiplayer**: Tic Tac Toe com 2 players (2 abas)
3. **Reconnection**: Close browser, reopen, check state
4. **Error handling**: Disconnect server, veja resposta
5. **Mobile**: Redimensione para mobile view

## Code Review

Ao revisar, verifique:

- [ ] Código segue conventions
- [ ] Sem `any` type
- [ ] Sem console.log (remover antes de commitar)
- [ ] Mensagens de erro são claras
- [ ] TypeScript compila sem warnings
- [ ] Testes adicionados (se funcionalidade)
- [ ] Documentação atualizada

## Documentation

Quando documentar:

- **Novo componente/service**: JSDoc comments
- **Novo padrão**: Adicionar exemplo a `docs/`
- **Mudança de arquivo**: Update `docs/ARCHITECTURE.md`

**Exemplo de JSDoc:**

```typescript
/**
 * Calcula o score final de um jogador no Yahtzee
 * @param player - Estado do jogador
 * @returns Score total incluindo bonus
 */
export function calculateTotalScore(player: PlayerState): number {
  // ...
}
```

## Performance Checklist

- [ ] Components usam OnPush detection
- [ ] Signals não são computados desnecessariamente
- [ ] Web bundle < 1MB
- [ ] Nenhum memory leak (verificar DevTools)

## Security

- [ ] Não commit secrets (.env files)
- [ ] Validar input no servidor
- [ ] Não confiar em dados do client
- [ ] Use `type` não `any` para type safety

## Checklist antes de Submeter

```bash
# 1. Código limpo
npm run lint        # ESLint
npm run format      # Prettier

# 2. Testes
npm test            # Karma tests

# 3. Build
npm run build       # Angular build sem erros

# 4. Commit
git status
git diff --staged
git commit -m "feat: descrição"

# 5. Push
git push origin seu-branch
```

## Dúvidas?

- Leia [Architecture](./ARCHITECTURE.md)
- Estude os 3 jogos existentes (Yahtzee, Tic Tac Toe, Sudoku)
- Abra uma issue para discussão

---

Obrigado por contribuir! 🙏

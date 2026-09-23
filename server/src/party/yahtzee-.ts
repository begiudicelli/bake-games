import { Yahtzee } from '@bake/shared';
import type * as Party from 'partykit/server';

function createInitialState(): Yahtzee.RoomState {
  return {
    players: {},
    phase: 'waiting',
    currentTurnId: null,
    winnerId: null,
    leaderId: null,
  };
}

function createInitialPlayerState(name: string): Yahtzee.PlayerState {
  return {
    name,
    dice: Array.from({ length: 5 }, () => ({ value: 1, kept: false })),
    rollsLeft: 3,
    scores: {},
    upperSectionTotal: 0,
    bonus: 0,
    totalScore: 0,
    finished: false,
  };
}

function rollDice(player: Yahtzee.PlayerState): void {
  for (let i = 0; i < player.dice.length; i++) {
    if (!player.dice[i].kept) {
      player.dice[i].value = Math.floor(Math.random() * 6) + 1;
    }
  }
  player.rollsLeft--;
}

function calculateScore(player: Yahtzee.PlayerState, category: Yahtzee.ScoreCategory): number {
  const diceValues = player.dice.map((d) => d.value);
  const counts = [0, 0, 0, 0, 0, 0];
  for (const value of diceValues) {
    counts[value - 1]++;
  }

  switch (category) {
    case 'ones':
      return counts[0] * 1;
    case 'twos':
      return counts[1] * 2;
    case 'threes':
      return counts[2] * 3;
    case 'fours':
      return counts[3] * 4;
    case 'fives':
      return counts[4] * 5;
    case 'sixes':
      return counts[5] * 6;
    case 'threeOfAKind':
      return counts.some((c) => c >= 3) ? diceValues.reduce((a, b) => a + b, 0) : 0;
    case 'fourOfAKind':
      return counts.some((c) => c >= 4) ? diceValues.reduce((a, b) => a + b, 0) : 0;
    case 'fullHouse':
      return counts.includes(3) && counts.includes(2) ? 25 : 0;
    case 'smallStraight':
      return (counts[0] && counts[1] && counts[2] && counts[3]) ||
        (counts[1] && counts[2] && counts[3] && counts[4]) ||
        (counts[2] && counts[3] && counts[4] && counts[5])
        ? 30
        : 0;
    case 'largeStraight':
      return (counts[0] && counts[1] && counts[2] && counts[3] && counts[4]) ||
        (counts[1] && counts[2] && counts[3] && counts[4] && counts[5])
        ? 40
        : 0;
    case 'yahtzee':
      return counts.some((c) => c === 5) ? 50 : 0;
    case 'chance':
      return diceValues.reduce((a, b) => a + b, 0);
  }
}

function calculateUpperSectionTotal(player: Yahtzee.PlayerState): number {
  return (
    (player.scores.ones ?? 0) +
    (player.scores.twos ?? 0) +
    (player.scores.threes ?? 0) +
    (player.scores.fours ?? 0) +
    (player.scores.fives ?? 0) +
    (player.scores.sixes ?? 0)
  );
}

function calculateTotalScore(player: Yahtzee.PlayerState): number {
  const upperTotal = calculateUpperSectionTotal(player);
  const bonus = upperTotal >= 63 ? 35 : 0;
  const lowerTotal =
    (player.scores.threeOfAKind ?? 0) +
    (player.scores.fourOfAKind ?? 0) +
    (player.scores.fullHouse ?? 0) +
    (player.scores.smallStraight ?? 0) +
    (player.scores.largeStraight ?? 0) +
    (player.scores.yahtzee ?? 0) +
    (player.scores.chance ?? 0);
  return upperTotal + bonus + lowerTotal;
}

function checkFinished(player: Yahtzee.PlayerState): boolean {
  const allCategories: Yahtzee.ScoreCategory[] = [
    'ones',
    'twos',
    'threes',
    'fours',
    'fives',
    'sixes',
    'threeOfAKind',
    'fourOfAKind',
    'fullHouse',
    'smallStraight',
    'largeStraight',
    'yahtzee',
    'chance',
  ];
  return allCategories.every((c) => c in player.scores);
}

function advanceTurn(state: Yahtzee.RoomState): void {
  const playerIds = Object.keys(state.players);
  if (playerIds.length === 0) {
    state.currentTurnId = null;
    return;
  }

  if (state.currentTurnId === null) {
    state.currentTurnId = playerIds[0];
    return;
  }

  const currentIndex = playerIds.indexOf(state.currentTurnId);

  for (let i = 1; i <= playerIds.length; i++) {
    const nextIndex = (currentIndex + i) % playerIds.length;
    const nextId = playerIds[nextIndex];
    if (!state.players[nextId].finished) {
      state.currentTurnId = nextId;
      return;
    }
  }

  state.currentTurnId = null;
}

function checkGameOver(state: Yahtzee.RoomState): void {
  if (state.phase !== 'playing') return;
  const allFinished = Object.values(state.players).every((p) => p.finished);
  if (!allFinished) return;

  state.phase = 'finished';
  const sorted = Object.entries(state.players).sort((a, b) => b[1].totalScore - a[1].totalScore);
  state.winnerId = sorted[0][0];
}

export default class YahtzeeServer implements Party.Server {
  private state: Yahtzee.RoomState;
  private readonly maxPlayers = 8;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  private broadcast(message: Yahtzee.ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  private sendTo(conn: Party.Connection, message: Yahtzee.ServerMessage): void {
    conn.send(JSON.stringify(message));
  }

  onConnect(conn: Party.Connection): void {
    const playerCount = Object.keys(this.state.players).length;

    if (playerCount >= this.maxPlayers) {
      this.sendTo(conn, { type: 'ERROR', message: 'Sala cheia.' });
      conn.close();
      return;
    }

    this.state.players[conn.id] = createInitialPlayerState('Jogador');
    
    // Set as leader if this is the first player
    if (this.state.leaderId === null) {
      this.state.leaderId = conn.id;
    }
    
    this.sendTo(conn, { type: 'STATE_UPDATE', state: this.state });
    console.log(`[yahtzee] jogador conectado (sala: ${this.room.id})`);
  }

  onClose(conn: Party.Connection): void {
    delete this.state.players[conn.id];

    if (Object.keys(this.state.players).length === 0) {
      this.state = createInitialState();
    } else if (this.state.currentTurnId === conn.id) {
      advanceTurn(this.state);
      checkGameOver(this.state);
    }

    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
    console.log(`[yahtzee] jogador desconectado (sala: ${this.room.id})`);
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as Yahtzee.ClientMessage;
    const player = this.state.players[sender.id];

    if (!player) return;

    if (parsed.type === 'JOIN') {
      player.name = parsed.playerName;

      const allNamed = Object.values(this.state.players).every((p) => p.name !== 'Jogador');
      const hasPlayers = Object.keys(this.state.players).length >= 2;

      // Auto-start only if 2 players and all named (backward compatibility)
      // But don't start - wait for explicit START message
      
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'START') {
      // Only leader can start the game
      if (sender.id !== this.state.leaderId) {
        this.sendTo(sender, { type: 'ERROR', message: 'Apenas o líder pode iniciar o jogo.' });
        return;
      }

      // Need at least 2 players
      if (Object.keys(this.state.players).length < 2) {
        this.sendTo(sender, { type: 'ERROR', message: 'Mínimo 2 jogadores necessários.' });
        return;
      }

      // Can only start from waiting phase
      if (this.state.phase !== 'waiting') {
        this.sendTo(sender, { type: 'ERROR', message: 'Jogo já foi iniciado.' });
        return;
      }

      this.state.phase = 'playing';
      advanceTurn(this.state);
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'ROLL_DICE') {
      if (this.state.phase !== 'playing') return;
      if (this.state.currentTurnId !== sender.id) {
        this.sendTo(sender, { type: 'ERROR', message: 'Não é sua vez.' });
        return;
      }
      if (player.rollsLeft <= 0) {
        this.sendTo(sender, { type: 'ERROR', message: 'Sem rolagens restantes.' });
        return;
      }

      rollDice(player);
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'TOGGLE_KEEP') {
      if (this.state.phase !== 'playing') return;
      if (this.state.currentTurnId !== sender.id) return;
      if (player.rollsLeft === 3) {
        this.sendTo(sender, { type: 'ERROR', message: 'Role os dados primeiro.' });
        return;
      }
      if (parsed.index < 0 || parsed.index > 4) return;

      player.dice[parsed.index].kept = !player.dice[parsed.index].kept;
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'SELECT_CATEGORY') {
      if (this.state.phase !== 'playing') return;
      if (this.state.currentTurnId !== sender.id) {
        this.sendTo(sender, { type: 'ERROR', message: 'Não é sua vez.' });
        return;
      }
      if (player.rollsLeft === 3) {
        this.sendTo(sender, { type: 'ERROR', message: 'Role os dados primeiro.' });
        return;
      }
      if (parsed.category in player.scores) {
        this.sendTo(sender, { type: 'ERROR', message: 'Categoria já preenchida.' });
        return;
      }

      player.scores[parsed.category] = calculateScore(player, parsed.category);
      player.upperSectionTotal = calculateUpperSectionTotal(player);
      player.bonus = player.upperSectionTotal >= 63 ? 35 : 0;
      player.totalScore = calculateTotalScore(player);
      player.finished = checkFinished(player);

      player.dice = Array.from({ length: 5 }, () => ({ value: 1, kept: false }));
      player.rollsLeft = 3;

      advanceTurn(this.state);
      checkGameOver(this.state);

      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'RESTART') {
      if (this.state.phase !== 'finished') return;

      const playerIds = Object.keys(this.state.players);
      this.state = createInitialState();

      for (const id of playerIds) {
        this.state.players[id] = createInitialPlayerState(
          this.state.players[id]?.name ?? 'Jogador',
        );
      }

      this.state.phase = 'playing';
      advanceTurn(this.state);
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }
  }
}

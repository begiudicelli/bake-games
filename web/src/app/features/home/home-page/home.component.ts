import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameCard } from '../../../core/models/game-card';
import { GameEntryComponent } from '../game-entry/game-entry.component';

@Component({
  selector: 'app-home',
  imports: [GameEntryComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly selectedGame = signal<GameCard | null>(null);

  readonly games: GameCard[] = [
    {
      id: 'tic-tac-toe',
      title: 'Tic Tac Toe',
      description: 'O clássico jogo da velha. Faça três em linha para vencer.',
      players: '2 jogadores',
      route: '/tic-tac-toe',
      hasDifficulty: false,
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      description: 'Complete o tabuleiro antes do seu adversário.',
      players: '2 jogadores',
      route: '/sudoku',
      hasDifficulty: true,
    },
    {
      id: 'yahtzee',
      title: 'Yahtzee',
      description: 'Role os dados e tente fazer as melhores combinações.',
      players: 'Até 8 jogadores',
      route: '/yahtzee',
      hasDifficulty: false,
    },
  ];

  onSelectGame(game: GameCard): void {
    this.selectedGame.set(game);
  }

  onCloseEntry(): void {
    this.selectedGame.set(null);
  }
}

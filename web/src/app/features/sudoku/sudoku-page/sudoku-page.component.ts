import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import type { Sudoku } from '@bake/shared';
import { SudokuRoomService } from '../../../core/services/sudoku-room.service';
import { GameWaitingRoomComponent } from '../../../shared/components/game-waiting-room/game-waiting-room.component';
import { RoomInfoComponent } from '../../../shared/components/room-info/room-info.component';
import { SudokuGameStatusComponent } from '../game-status/game-status.component';
import { SudokuBoardComponent } from '../sudoku-board/sudoku-board.component';

@Component({
  selector: 'app-sudoku-page',
  standalone: true,
  imports: [
    CommonModule,
    GameWaitingRoomComponent,
    SudokuBoardComponent,
    SudokuGameStatusComponent,
    RoomInfoComponent,
  ],
  templateUrl: './sudoku-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SudokuPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly gameService = inject(SudokuRoomService);

  readonly emptyGrid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0) as number[]);

  roomId = '';
  private readonly _playerName = signal('');
  private readonly _difficulty = signal<Sudoku.Difficulty>('medium');
  
  readonly playerName = this._playerName.asReadonly();
  readonly difficulty = this._difficulty.asReadonly();

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const playerName = history.state?.playerName;
    const difficulty: Sudoku.Difficulty = history.state?.difficulty ?? 'medium';

    if (playerName) {
      this._playerName.set(playerName);
      this._difficulty.set(difficulty);
      sessionStorage.setItem('playerName', playerName);
      sessionStorage.setItem('sudokuDifficulty', difficulty);
    }
  }

  totalEmpty(): number {
    return this.gameService
      .state()
      .puzzle.flat()
      .filter((v) => v === 0).length;
  }

  ngOnDestroy(): void {
    this.gameService.leaveRoom();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}

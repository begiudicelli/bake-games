import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home-page/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'join/:game/:roomId',
    loadComponent: () =>
      import('./shared/components/join-room-page/join-room-page.component').then(
        (m) => m.JoinRoomPageComponent,
      ),
  },
  {
    path: 'tic-tac-toe/:roomId',
    loadComponent: () =>
      import('./features/tic-tac-toe/tic-tac-toe-page/tic-tac-toe-page.component').then(
        (m) => m.TicTacToePageComponent,
      ),
  },
  {
    path: 'sudoku/:roomId',
    loadComponent: () =>
      import('./features/sudoku/sudoku-page/sudoku-page.component').then(
        (m) => m.SudokuPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

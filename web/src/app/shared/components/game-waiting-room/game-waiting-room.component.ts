import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

/**
 * Reusable waiting room component for all games
 * Accepts any service with: joinRoom, leaveRoom, connected, myId, playersInfo, startGame, state
 */
@Component({
  selector: 'app-game-waiting-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './game-waiting-room.component.html',
  styleUrl: './game-waiting-room.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameWaitingRoomComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Inputs - configured by parent
  readonly roomService = input.required<any>();
  readonly roomId = input.required<string>();
  readonly gameName = input.required<string>();
  readonly minPlayers = input<number>(1);
  readonly maxPlayers = input<number>(8);
  readonly initialPlayerName = input<string>('');  // Pre-filled name from parent

  // Internal state
  private readonly _isJoined = signal(false);
  private readonly _copied = signal(false);

  readonly isJoined = this._isJoined.asReadonly();
  readonly copied = this._copied.asReadonly();

  readonly form = this.fb.nonNullable.group({
    playerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
  });

  // Computed values
  readonly playersInfo = computed(() => this.roomService().playersInfo?.() ?? []);
  readonly connected = computed(() => this.roomService().connected?.() ?? false);

  readonly isRoomLeader = computed(() => {
    const myId = this.roomService().myId?.();
    const players = this.playersInfo();
    return players.length > 0 && players[0].id === myId;
  });

  readonly canStartGame = computed(() => {
    const players = this.playersInfo().length;
    return this.isRoomLeader() && players >= this.minPlayers();
  });

  readonly shouldShowStartMessage = computed(() => {
    const players = this.playersInfo().length;
    return !this.isRoomLeader() || players < this.minPlayers();
  });

  ngOnInit(): void {
    // Check if player name was provided (from game entry)
    const initialName = this.initialPlayerName();
    if (initialName) {
      // Skip to waiting room directly
      this.form.patchValue({ playerName: initialName });
      this.join();
      return;
    }

    // Otherwise, restore saved player name or show input
    const savedPlayerName = sessionStorage.getItem('playerName');
    if (savedPlayerName) {
      this.form.patchValue({ playerName: savedPlayerName });
    }
  }

  join(): void {
    if (this.form.invalid) return;

    const playerName = this.form.getRawValue().playerName.trim();
    sessionStorage.setItem('playerName', playerName);

    // Join the room
    this.roomService().joinRoom(this.roomId(), playerName);
    this._isJoined.set(true);
  }

  async copyToClipboard(): Promise<void> {
    await navigator.clipboard.writeText(this.roomId());
    this._copied.set(true);
    setTimeout(() => this._copied.set(false), 2000);
  }

  async copyInviteLink(): Promise<void> {
    const fullUrl = `${window.location.origin}/join/${this.gameName().toLowerCase()}/${this.roomId()}`;
    await navigator.clipboard.writeText(fullUrl);
    this._copied.set(true);
    setTimeout(() => this._copied.set(false), 2000);
  }

  onStartGame(): void {
    if (this.canStartGame()) {
      this.roomService().startGame?.();
    }
  }

  goHome(): void {
    this.roomService().leaveRoom();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    // Don't cleanup here - parent component handles it
  }
}

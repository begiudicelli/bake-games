import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-room-info',
  templateUrl: './room-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomInfoComponent {
  readonly roomId = input.required<string>();
  readonly copied = signal(false);
  readonly gameRoute = input.required<string>();

  async copyLink(): Promise<void> {
    const url = `${window.location.origin}/join/${this.gameRoute()}/${this.roomId()}`;
    await navigator.clipboard.writeText(url);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}

import type * as Party from 'partykit/server';

export default class MainServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    console.log(`Connected: ${conn.id}`);
  }
}

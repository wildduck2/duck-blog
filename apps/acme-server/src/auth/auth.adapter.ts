import { IoAdapter } from '@nestjs/platform-socket.io'
import sharedsession from 'express-socket.io-session'
import type { Server } from 'socket.io'

/**
 * Enable session tokens for web sockets by using express-socket.io-session
 */
export class EventsAdapter extends IoAdapter {
  constructor(private readonly session: any) {
    super()
  }

  createIOServer(port: number, options?: any): any {
    const server: Server = super.createIOServer(port, options)

    server.use(
      //@ts-expect-error
      sharedsession(this.session, {}),
    )
    return server
  }
}

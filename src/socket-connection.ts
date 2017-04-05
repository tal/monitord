import * as IO from 'socket.io-client'

let socket: Socket | null = null

class Socket {
  private socket: SocketIOClient.Socket | null

  constructor(server: string) {
    const socket = IO(server)


  }

  private setSocket(socket: SocketIOClient.Socket) {
    this.socket = socket
  }
}

let promises: {[key: string]: Promise<Socket> | null} = {}

export default function(server: string): Promise<Socket> {
  if (!promises[server]) {
    promises[server] = new Promise((resolve, reject) => {
      const socket = IO(server)

      socket.on('connect', () => resolve(socket))

      socket.on('connect_error', (err: any) => {
        socket.disconnect()

        reject(err)
      })

      socket.on('disconnect', () => {
        promises[server] = null
      })
    })
  }

  return <Promise<Socket>> promises[server]
}

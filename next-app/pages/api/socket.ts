import { Server } from "socket.io";
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface ResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

let io: Server;

export default function handler(req: NextApiRequest, res: ResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('removed-from-bag', (msg: number) => {
        socket.broadcast.emit('remove-from-bag', msg);
      });
    });
  }
  res.end();
}

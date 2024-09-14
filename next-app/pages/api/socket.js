import { Server } from "socket.io";

let io;

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('removed-from-bag', (msg) => {
        socket.broadcast.emit('remove-from-bag', msg);
      });
    });
  }
  res.end();
}

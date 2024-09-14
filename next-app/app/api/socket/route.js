import { Server } from "socket.io";

let io;

export async function GET(req, res) {
  if (!res.socket) {
    res.status(500).json({ error: "Socket is not available" });
    return;
  }

  if (!res.socket.server.io) {
    console.log('Socket is initializing');
    io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('removed-from-bag', (msg) => {
        socket.broadcast.emit('remove-from-bag', msg);
      });
    });
  } else {
    console.log('Socket is already running');
  }
  res.end();
}

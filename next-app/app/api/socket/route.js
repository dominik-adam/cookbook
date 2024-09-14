import { Server } from "socket.io";
import { NextResponse } from "next/server";

let io;

export async function GET(req) {
  const res = NextResponse.next();

  if (!res.socket) {
    return NextResponse.json({ error: "Socket is not available" }, { status: 500 });
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

  return res;
}


import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const timers = {}; 

const startTimer = (roomId) => {
  if (timers[roomId]?.isRunning) return;

  timers[roomId].isRunning = true;

  timers[roomId].interval = setInterval(() => {
    if (timers[roomId].time > 0) {
      timers[roomId].time--;
    } else {
      timers[roomId].time = 0;
      timers[roomId].isRunning = false;
      clearInterval(timers[roomId].interval);
    }
    io.to(roomId).emit('timerUpdate', timers[roomId].time); 
  }, 1000);
};

const resetTimer = (roomId) => {
  clearInterval(timers[roomId].interval);
  timers[roomId].time = 15;
  timers[roomId].isRunning = false;
  io.to(roomId).emit('timerUpdate', timers[roomId].time); 
};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);

    if (!timers[roomId]) {
      timers[roomId] = { time: 15, isRunning: false };
    }

    socket.emit('timerUpdate', timers[roomId].time);
  });

  socket.on('startTimer', (roomId) => {
    startTimer(roomId);
  });

  socket.on('resetTimer', (roomId) => {
    resetTimer(roomId);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});


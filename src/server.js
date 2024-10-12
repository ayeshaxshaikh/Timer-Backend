
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

// Store timer states in memory
const timers = {}; 

// Timer functions
const startTimer = (roomId) => {
  if (!timers[roomId]) {
    timers[roomId] = { time: 15, isRunning: false };
  }

  if (timers[roomId].isRunning) return;

  timers[roomId].isRunning = true;

  timers[roomId].interval = setInterval(() => {
    if (timers[roomId].time > 0) {
      timers[roomId].time--;
      io.to(roomId).emit('timerUpdate', timers[roomId].time);
    } else {
      timers[roomId].time = 0;
      timers[roomId].isRunning = false;
      clearInterval(timers[roomId].interval);
      io.to(roomId).emit('timerUpdate', timers[roomId].time);
    }
  }, 1000);
};

const resetTimer = (roomId) => {
  if (!timers[roomId]) {
    timers[roomId] = { time: 15, isRunning: false };
  }

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
    socket.emit('timerStateUpdate', timers[roomId]);
  });

  socket.on('startTimer', (roomId) => {
    startTimer(roomId);
  });

  socket.on('resetTimer', (roomId) => {
    resetTimer(roomId);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    for (const roomId in timers) {
      if (timers[roomId].interval) {
        clearInterval(timers[roomId].interval);
        delete timers[roomId]; 
      }
    }
  });
});

process.on('uncaughtException', (error) => {
  console.error('Unexpected error:', error);
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

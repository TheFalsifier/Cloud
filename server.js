const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// In-memory store
const rooms = {
  general: { name: 'General', messages: [], users: {} },
  tech:    { name: 'Tech Talk', messages: [], users: {} },
  random:  { name: 'Random', messages: [], users: {} }
};

// Keep last 50 messages per room
function addMessage(roomId, msg) {
  rooms[roomId].messages.push(msg);
  if (rooms[roomId].messages.length > 50)
    rooms[roomId].messages.shift();
}

function getRoomList() {
  return Object.entries(rooms).map(([id, r]) => ({
    id,
    name: r.name,
    userCount: Object.keys(r.users).length
  }));
}

io.on('connection', (socket) => {
  let currentUser = null;
  let currentRoom = null;

  // Join with username
  socket.on('set_username', (username, cb) => {
    if (!username || username.trim().length < 2) {
      return cb({ error: 'Username must be at least 2 characters' });
    }
    currentUser = { id: socket.id, username: username.trim() };
    cb({ success: true, rooms: getRoomList() });
  });

  // Join a room
  socket.on('join_room', (roomId, cb) => {
    if (!currentUser) return cb({ error: 'Set username first' });
    if (!rooms[roomId]) return cb({ error: 'Room not found' });

    // Leave previous room
    if (currentRoom) {
      socket.leave(currentRoom);
      delete rooms[currentRoom].users[socket.id];
      io.to(currentRoom).emit('user_left', {
        username: currentUser.username,
        users: Object.values(rooms[currentRoom].users)
      });
    }

    currentRoom = roomId;
    socket.join(roomId);
    rooms[roomId].users[socket.id] = currentUser.username;

    // Send room history + current users
    cb({
      success: true,
      messages: rooms[roomId].messages,
      users: Object.values(rooms[roomId].users),
      roomName: rooms[roomId].name
    });

    // Notify others
    socket.to(roomId).emit('user_joined', {
      username: currentUser.username,
      users: Object.values(rooms[roomId].users)
    });

    // Broadcast updated room list
    io.emit('rooms_updated', getRoomList());
  });

  // Send message
  socket.on('send_message', (text) => {
    if (!currentUser || !currentRoom || !text.trim()) return;

    const msg = {
      id: uuidv4(),
      username: currentUser.username,
      text: text.trim(),
      time: new Date().toISOString(),
      socketId: socket.id
    };

    addMessage(currentRoom, msg);
    io.to(currentRoom).emit('new_message', msg);
  });

  // Typing indicator
  socket.on('typing', (isTyping) => {
    if (!currentUser || !currentRoom) return;
    socket.to(currentRoom).emit('user_typing', {
      username: currentUser.username,
      isTyping
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (currentRoom && currentUser) {
      delete rooms[currentRoom].users[socket.id];
      io.to(currentRoom).emit('user_left', {
        username: currentUser.username,
        users: Object.values(rooms[currentRoom].users)
      });
      io.emit('rooms_updated', getRoomList());
    }
  });
});

// Health check endpoint for Jenkins
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/rooms', (req, res) => {
  res.json(getRoomList());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});

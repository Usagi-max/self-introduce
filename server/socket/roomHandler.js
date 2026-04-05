const { generateMockResponse } = require('../utils/aiMock');

// In-memory store for rooms
// Structure: 
// { 
//   [roomId]: { 
//     hostId: sessionId, 
//     players: [{ id: socketId, sessionId: string, name: string, isHost: boolean, connected: boolean, metadata: {} }], 
//     state: { status: 'lobby' | 'playing', game: string },
//     emptyTimeout: null
//   } 
// }
const rooms = {};
const hostReassignTimeouts = {};

module.exports = {
  rooms,
  initSocket: (io, socket) => {

  const checkEmptyRoom = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const activePlayers = room.players.filter(p => p.connected);
    if (activePlayers.length === 0) {
      if (!room.emptyTimeout) {
        room.emptyTimeout = setTimeout(() => {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted due to inactivity`);
        }, 30 * 60 * 1000); // 30 minutes
      }
    } else {
      if (room.emptyTimeout) {
        clearTimeout(room.emptyTimeout);
        room.emptyTimeout = null;
      }
    }
  };

  const reassignHostIfNeeded = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const hostPlayer = room.players.find(p => p.isHost);
    // If there is no host, or the host is disconnected, find the next connected player
    if (!hostPlayer || !hostPlayer.connected) {
      const nextConnected = room.players.find(p => p.connected);
      if (nextConnected) {
        if (hostPlayer) hostPlayer.isHost = false;
        nextConnected.isHost = true;
        room.hostId = nextConnected.sessionId;
        io.to(roomId).emit('room_updated', room);
      }
    }
  };

  const handleDisconnect = () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const player = room.players.find(p => p.id === socket.id);
      
      if (player) {
        player.connected = false;
        io.to(roomId).emit('room_updated', room);
        
        if (player.isHost) {
          hostReassignTimeouts[roomId] = setTimeout(() => {
            reassignHostIfNeeded(roomId);
          }, 10000); // 10 seconds grace period before reassignment
        }
        
        checkEmptyRoom(roomId);
      }
    }
  };

  socket.on('create_room', ({ playerName, sessionId }, callback) => {
    if (!sessionId) return callback({ success: false, message: 'Missing session ID' });
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    rooms[roomId] = {
      hostId: sessionId,
      players: [{ 
        id: socket.id, 
        sessionId,
        name: playerName, 
        isHost: true,
        connected: true,
        metadata: {
          points: 0,
          characterStrategyLevel: null
        }
      }],
      state: { 
        status: 'lobby', 
        game: null, 
        rouletteTopics: ['出身地', '血液型', '好きな食べ物', 'マイブーム', '趣味', '休日の過ごし方'],
        penaltyTopics: ['恥ずかしい失敗談を告白する', 'AIに本音で相談する', 'AIに自分好みの異性のタイプを聞く', '全力で変顔を10秒キープ'] 
      },
      emptyTimeout: null
    };

    socket.join(roomId);
    callback({ success: true, roomId, room: rooms[roomId] });
  });

  socket.on('join_room', ({ roomId, playerName, sessionId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, message: 'Room not found' });
    if (!sessionId) return callback({ success: false, message: 'Missing session ID' });

    const existing = room.players.find(p => p.sessionId === sessionId);
    if (existing) {
        existing.id = socket.id;
        existing.name = playerName;
        existing.connected = true;
    } else {
        room.players.push({ 
          id: socket.id, 
          sessionId,
          name: playerName, 
          isHost: false,
          connected: true,
          metadata: { points: 0, characterStrategyLevel: null } 
        });
    }

    socket.join(roomId);
    checkEmptyRoom(roomId);
    io.to(roomId).emit('room_updated', room);
    callback({ success: true, room });
  });

  socket.on('rejoin_room', ({ roomId, sessionId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, message: 'Room has expired' });
    
    const player = room.players.find(p => p.sessionId === sessionId);
    // If player session is not found, maybe they were kicked or it's an old session for another room
    if (!player) return callback({ success: false, message: 'Player session not found in room' });

    player.id = socket.id;
    player.connected = true;
    socket.join(roomId);
    
    if (player.isHost && hostReassignTimeouts[roomId]) {
      clearTimeout(hostReassignTimeouts[roomId]);
      delete hostReassignTimeouts[roomId];
    }
    
    checkEmptyRoom(roomId);
    io.to(roomId).emit('room_updated', room);
    callback({ success: true, room });
  });

  // Host manual actions
  socket.on('transfer_host', ({ roomId, targetSessionId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const currentHost = room.players.find(p => p.id === socket.id && p.isHost);
    const targetPlayer = room.players.find(p => p.sessionId === targetSessionId);
    
    if (currentHost && targetPlayer) {
      currentHost.isHost = false;
      targetPlayer.isHost = true;
      room.hostId = targetPlayer.sessionId;
      io.to(roomId).emit('room_updated', room);
    }
  });

  socket.on('kick_player', ({ roomId, targetSessionId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const currentHost = room.players.find(p => p.id === socket.id && p.isHost);
    if (currentHost) {
      const targetIndex = room.players.findIndex(p => p.sessionId === targetSessionId);
      if (targetIndex !== -1) {
        const targetPlayer = room.players[targetIndex];
        
        io.to(targetPlayer.id).emit('kicked_from_room');
        
        // Force leaves the room in socket.io so they no longer receive broadcasts
        const targetSocket = io.sockets.sockets.get(targetPlayer.id);
        if (targetSocket) targetSocket.leave(roomId);
        
        room.players.splice(targetIndex, 1);
        io.to(roomId).emit('room_updated', room);
      }
    }
  });

  socket.on('leave_room', ({ roomId }) => {
    const room = rooms[roomId];
    if (room) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        socket.leave(roomId);
        if (player.isHost) {
           reassignHostIfNeeded(roomId);
        }
        io.to(roomId).emit('room_updated', room);
        checkEmptyRoom(roomId);
      }
    }
  });

  socket.on('start_game', ({ roomId, gameName }) => {
    const room = rooms[roomId];
    if (room && room.hostId === room.players.find(p => p.id === socket.id)?.sessionId) {
      room.state = { ...room.state, status: 'playing', game: gameName, gameData: null };
      io.to(roomId).emit('game_started', { game: gameName, state: room.state });
      io.to(roomId).emit('room_updated', room); // Always keep full state synced
    }
  });

  socket.on('update_game_state', ({ roomId, payload }) => {
    const room = rooms[roomId];
    if (room) {
      room.state = { ...room.state, ...payload };
      io.to(roomId).emit('game_state_updated', room.state);
    }
  });

  socket.on('update_player_metadata', ({ roomId, playerId, payload }) => {
    const room = rooms[roomId];
    if (room) {
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.metadata = { ...player.metadata, ...payload };
        io.to(roomId).emit('room_updated', room);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleDisconnect();
  });
  }
};

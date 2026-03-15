const { generateMockResponse } = require('../utils/aiMock');

// In-memory store for rooms
// Structure: 
// { 
//   [roomId]: { 
//     host: socketId, 
//     players: [{ id: socketId, name: string, isHost: boolean }], 
//     state: { status: 'lobby' | 'playing', game: string } 
//   } 
// }
const rooms = {};

module.exports = (io, socket) => {

  const leaveRoom = () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        socket.leave(roomId);
        
        // If room is empty, delete it
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else if (socket.id === room.host) {
          // Reassign host if host leaves
          room.host = room.players[0].id;
          room.players[0].isHost = true;
          io.to(roomId).emit('room_updated', room);
        } else {
          io.to(roomId).emit('room_updated', room);
        }
      }
    }
  };

  socket.on('create_room', ({ playerName }, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    rooms[roomId] = {
      host: socket.id,
      players: [{ 
        id: socket.id, 
        name: playerName, 
        isHost: true,
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
      }
    };

    socket.join(roomId);
    callback({ success: true, roomId, room: rooms[roomId] });
  });

  socket.on('join_room', ({ roomId, playerName }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }

    // Include placeholder 'characterStrategy' layout extending to Future Scope
    room.players.push({ 
      id: socket.id, 
      name: playerName, 
      isHost: false,
      metadata: {
        points: 0,
        characterStrategyLevel: null,
      } 
    });
    socket.join(roomId);
    
    io.to(roomId).emit('room_updated', room);
    callback({ success: true, room });
  });

  socket.on('start_game', ({ roomId, gameName }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      room.state = { ...room.state, status: 'playing', game: gameName, gameData: null };
      io.to(roomId).emit('game_started', { game: gameName, state: room.state });
      io.to(roomId).emit('room_updated', room); // Always keep full state synced just in case
    }
  });

  // Example generic state update
  socket.on('update_game_state', ({ roomId, payload }) => {
    const room = rooms[roomId];
    if (room) {
      room.state = { ...room.state, ...payload };
      io.to(roomId).emit('game_state_updated', room.state);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    leaveRoom();
  });
};

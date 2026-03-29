require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { rooms, initSocket } = require('./socket/roomHandler');

const { generateMockResponse } = require('./utils/aiMock');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // allow larger payload for base64 images

app.post('/api/ai/submit_compatibility_profile', (req, res) => {
  const { roomId, socketId, profile } = req.body;
  if (!rooms[roomId]) return res.status(404).json({error: 'Room not found'});
  
  let gameData = rooms[roomId].state.gameData;
  if (!gameData.results) gameData.results = {};
  
  gameData.results[socketId] = profile;
  
  // Transition safely on server-side
  if (Object.keys(gameData.results).length === rooms[roomId].players.length) {
    gameData.phase = 'pair_selection';
  }
  
  io.to(roomId).emit('room_updated', rooms[roomId]);
  res.json({ success: true });
});

app.post('/api/ai/compatibility', async (req, res) => {
  const { profiles } = req.body;
  const promptText = JSON.stringify(profiles, null, 2);
  const aiResponse = await generateMockResponse(promptText, 'compatibility');
  res.json(aiResponse);
});

app.post('/api/ai/compatibility_pair', async (req, res) => {
  const { profiles } = req.body;
  const promptText = JSON.stringify(profiles, null, 2);
  const aiResponse = await generateMockResponse(promptText, 'compatibility_pair');
  res.json(aiResponse);
});

app.post('/api/ai/compatibility_additional', async (req, res) => {
  const { roomId, prompt } = req.body;
  if (!rooms[roomId]) return res.status(404).json({error: 'Room not found'});
  
  const results = rooms[roomId].state.gameData.results;
  const profilesArray = Object.values(results);
  const promptText = JSON.stringify({ context: profilesArray, userPrompt: prompt }, null, 2);
  
  const aiResponse = await generateMockResponse(promptText, 'compatibility_additional');
  const messageText = aiResponse.content[0].text;
  
  if (rooms[roomId]) {
    rooms[roomId].state.gameData.additionalDiagnosis = { prompt, result: messageText };
    io.to(roomId).emit('room_updated', rooms[roomId]);
  }
  res.json({ success: true });
});

app.post('/api/ai/submit_face', async (req, res) => {
  const { roomId, socketId, playerName, imageData, promptId } = req.body;
  
  // 1. Queue it in room state
  if (!rooms[roomId]) return res.status(404).json({ error: 'Room not found' });
  const gameData = rooms[roomId].state.gameData;
  if (!Array.isArray(gameData.results)) gameData.results = [];
  
  let existingIndex = gameData.results.findIndex(r => r.id === socketId);
  if (existingIndex === -1) {
    gameData.results.push({ id: socketId, name: playerName, status: 'diagnosing', imageData, diagnosis: '', comment: '' });
  } else {
    gameData.results[existingIndex] = { ...gameData.results[existingIndex], status: 'diagnosing', imageData };
  }
  io.to(roomId).emit('room_updated', rooms[roomId]);

  try {
    // 2. Await Gemini specifically mapping imageData
    const aiResponse = await generateMockResponse(promptId, 'face_analysis', imageData);
    
    // 3. Mark Done
    if (rooms[roomId]) {
      existingIndex = rooms[roomId].state.gameData.results.findIndex(r => r.id === socketId);
      if (existingIndex !== -1) {
        let parsed = { diagnosis: '？な顔', comment: '解析エラーが発生しました。' };
        try { parsed = JSON.parse(aiResponse.content[0].text); } catch(e) { parsed.comment = aiResponse.content[0].text || "エラー" }
        
        rooms[roomId].state.gameData.results[existingIndex].status = 'done';
        rooms[roomId].state.gameData.results[existingIndex].diagnosis = parsed.diagnosis;
        rooms[roomId].state.gameData.results[existingIndex].comment = parsed.comment;
        
        // Transition to reveal if everyone is done
        const allDone = rooms[roomId].players.length > 0 && rooms[roomId].players.every(p => {
           const r = rooms[roomId].state.gameData.results.find(x => x.id === p.id);
           return r && r.status === 'done';
        });
        
        if (allDone) {
          rooms[roomId].state.gameData.phase = 'reveal';
        }
        io.to(roomId).emit('room_updated', rooms[roomId]);
      }
    }
  } catch (error) {
    console.error(error);
  }
  
  res.json({ success: true });
});

app.post('/api/ai/face_additional', async (req, res) => {
  const { roomId, prompt } = req.body;
  if (!rooms[roomId]) return res.status(404).json({error: 'Room not found'});
  
  const results = rooms[roomId].state.gameData.results;
  const contextData = results.map(r => ({ name: r.name, diagnosis: r.diagnosis, comment: r.comment }));
  const promptText = JSON.stringify({ context: contextData, userPrompt: prompt });
  
  const aiResponse = await generateMockResponse(promptText, 'face_additional');
  const messageText = aiResponse.content[0].text;
  
  if (rooms[roomId]) {
    rooms[roomId].state.gameData.additionalDiagnosis = { prompt, result: messageText };
    io.to(roomId).emit('room_updated', rooms[roomId]);
  }
  res.json({ success: true });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  initSocket(io, socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

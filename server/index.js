require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { rooms, initSocket } = require('./socket/roomHandler');

const { generateMockResponse } = require('./utils/aiMock');
const dbHelper = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // allow larger payload for base64 images

function cleanJsonString(str) {
  try {
    let s = str.replace(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/ig, '$1').trim();
    // Gemini sometimes hallucinates and concatenates json blocks like {...}{...}
    const match = s.match(/^(\s*\{[\s\S]*?\})\s*\{/);
    if (match) return match[1];
    return s;
  } catch (e) {
    return str;
  }
}

app.post('/api/ai/submit_compatibility_profile', (req, res) => {
  const { roomId, socketId, profile } = req.body;
  if (!rooms[roomId]) return res.status(404).json({error: 'Room not found'});
  
  let gameData = rooms[roomId].state.gameData;
  if (!gameData.results) gameData.results = {};
  
  gameData.results[socketId] = profile;
  
  // Transition safely on server-side
  const activeCount = rooms[roomId].players.filter(p => p.connected).length;
  if (Object.keys(gameData.results).length >= activeCount) {
    gameData.phase = 'pair_selection';
  }
  
  io.to(roomId).emit('room_updated', rooms[roomId]);
  res.json({ success: true });
});

app.post('/api/ai/compatibility', async (req, res) => {
  const { profiles, persona } = req.body;
  const promptText = JSON.stringify(profiles, null, 2);
  const aiResponse = await generateMockResponse(promptText, 'compatibility', null, persona);
  
  if (aiResponse.content && aiResponse.content[0]) {
    aiResponse.content[0].text = cleanJsonString(aiResponse.content[0].text);
  }
  
  res.json(aiResponse);
});

app.post('/api/ai/compatibility_pair', async (req, res) => {
  const { profiles, persona, relationship } = req.body;
  const promptText = JSON.stringify({ profiles, relationship }, null, 2);
  const aiResponse = await generateMockResponse(promptText, 'compatibility_pair', null, persona);

  if (aiResponse.content && aiResponse.content[0]) {
    aiResponse.content[0].text = cleanJsonString(aiResponse.content[0].text);
  }

  res.json(aiResponse);
});

app.post('/api/ai/compatibility_additional', async (req, res) => {
  const { roomId, prompt, persona } = req.body;
  if (!rooms[roomId]) return res.status(404).json({error: 'Room not found'});
  
  const results = rooms[roomId].state.gameData.results;
  const profilesArray = Object.values(results);
  const promptText = JSON.stringify({ context: profilesArray, userPrompt: prompt }, null, 2);
  
  const aiResponse = await generateMockResponse(promptText, 'compatibility_additional', null, persona);
  const messageText = aiResponse.content[0].text;
  
  if (rooms[roomId]) {
    rooms[roomId].state.gameData.additionalDiagnosis = { prompt, result: messageText };
    io.to(roomId).emit('room_updated', rooms[roomId]);
  }
  res.json({ success: true });
});

app.post('/api/ai/submit_face', async (req, res) => {
  const { roomId, socketId, playerName, imageData, promptId, persona, adShown } = req.body;
  
  if (adShown) dbHelper.trackEvent('ad_started', { type: 'video_ad', game: 'face_analysis' });
  dbHelper.trackEvent('ai_started', { game: 'face_analysis' });
  
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
    // APIリクエストの同時集中を避けるため、0〜2000msのランダムな遅延を入れる
    const delayMs = Math.floor(Math.random() * 2000);
    await new Promise(res => setTimeout(res, delayMs));

    // 2. Await Gemini specifically mapping imageData
    const aiResponse = await generateMockResponse(promptId, 'face_analysis', imageData, persona);
    
    // 3. Mark Done
    if (rooms[roomId] && rooms[roomId].state.gameData && rooms[roomId].state.gameData.results) {
      existingIndex = rooms[roomId].state.gameData.results.findIndex(r => r.name === playerName);
      if (existingIndex !== -1) {
        let parsed = { diagnosis: '？な顔', professional_comment: '解析エラーが発生しました。', roast_comment: '', is_war_criminal: false };
        try { 
          const cleanText = cleanJsonString(aiResponse.content[0].text);
          parsed = JSON.parse(cleanText); 
        } catch(e) { 
          parsed.professional_comment = aiResponse.content[0].text || "エラー" 
        }
        
        rooms[roomId].state.gameData.results[existingIndex].status = 'done';
        rooms[roomId].state.gameData.results[existingIndex].diagnosis = parsed.diagnosis || "？な顔";
        rooms[roomId].state.gameData.results[existingIndex].professional_comment = parsed.professional_comment || "";
        rooms[roomId].state.gameData.results[existingIndex].roast_comment = parsed.roast_comment || "";
        rooms[roomId].state.gameData.results[existingIndex].is_war_criminal = parsed.is_war_criminal || false;
        rooms[roomId].state.gameData.results[existingIndex].comment = parsed.professional_comment; // Fallback compat

        if (parsed.is_war_criminal) {
          const p = rooms[roomId].players.find(x => x.name === playerName);
          if (p) {
            if (!p.metadata.penaltiesByGame) p.metadata.penaltiesByGame = { unanimous: 0, face_analysis: 0 };
            p.metadata.penaltiesByGame.face_analysis = (p.metadata.penaltiesByGame.face_analysis || 0) + 1;
          }
        }
        
        // Transition to reveal if everyone is done
        const activeConnected = rooms[roomId].players.filter(p => p.connected);
        const allDone = activeConnected.length > 0 && activeConnected.every(p => {
           // Lookup by name instead of volatile socket array id
           const r = rooms[roomId].state.gameData.results.find(x => x.name === p.name);
           return r && r.status === 'done';
        });
        
        if (allDone) {
          rooms[roomId].state.gameData.phase = 'reveal';
        }
        io.to(roomId).emit('room_updated', rooms[roomId]);
        dbHelper.trackEvent('ai_completed', { game: 'face_analysis', status: 'success' });
      }
    }
  } catch (error) {
    console.error(error);
    dbHelper.trackEvent('ai_completed', { game: 'face_analysis', status: 'error' });
  }
  
  res.json({ success: true });
});

app.post('/api/ai/submit_physiognomy_intro', async (req, res) => {
  const { roomId, socketId, playerName, imageData, persona, adShown } = req.body;
  
  if (adShown) dbHelper.trackEvent('ad_started', { type: 'video_ad', game: 'physiognomy_intro' });
  dbHelper.trackEvent('ai_started', { game: 'physiognomy_intro' });
  
  if (!rooms[roomId]) return res.status(404).json({ error: 'Room not found' });
  const gameData = rooms[roomId].state.gameData;
  if (!Array.isArray(gameData.results)) gameData.results = [];
  
  let existingIndex = gameData.results.findIndex(r => r.id === socketId);
  if (existingIndex === -1) {
    gameData.results.push({ id: socketId, name: playerName, status: 'diagnosing', imageData, diagnosis: '', professional_comment: '' });
  } else {
    gameData.results[existingIndex] = { ...gameData.results[existingIndex], status: 'diagnosing', imageData };
  }
  io.to(roomId).emit('room_updated', rooms[roomId]);

  try {
    const delayMs = Math.floor(Math.random() * 2000);
    await new Promise(r => setTimeout(r, delayMs));

    const aiResponse = await generateMockResponse(null, 'physiognomy_intro', imageData, persona);
    
    if (rooms[roomId] && rooms[roomId].state.gameData && rooms[roomId].state.gameData.results) {
      existingIndex = rooms[roomId].state.gameData.results.findIndex(r => r.name === playerName);
      if (existingIndex !== -1) {
        let parsed = { diagnosis: '？な人', professional_comment: '解析エラーが発生しました。' };
        try { 
          const cleanText = cleanJsonString(aiResponse.content[0].text);
          parsed = JSON.parse(cleanText); 
        } catch(e) { 
          parsed.professional_comment = aiResponse.content[0].text || "エラー" 
        }
        
        rooms[roomId].state.gameData.results[existingIndex].status = 'done';
        rooms[roomId].state.gameData.results[existingIndex].diagnosis = parsed.diagnosis || "？な人";
        rooms[roomId].state.gameData.results[existingIndex].professional_comment = parsed.professional_comment || "";
        
        const activeConnected = rooms[roomId].players.filter(p => p.connected);
        const allDone = activeConnected.length > 0 && activeConnected.every(p => {
           const r = rooms[roomId].state.gameData.results.find(x => x.name === p.name);
           return r && r.status === 'done';
        });
        
        if (allDone) {
          rooms[roomId].state.gameData.phase = 'reveal';
        }
        io.to(roomId).emit('room_updated', rooms[roomId]);
        dbHelper.trackEvent('ai_completed', { game: 'physiognomy_intro', status: 'success' });
      }
    }
  } catch (error) {
    console.error(error);
    dbHelper.trackEvent('ai_completed', { game: 'physiognomy_intro', status: 'error' });
  }
  
  res.json({ success: true });
});


app.post('/api/ai/face_additional', async (req, res) => {
  const { roomId, prompt, persona } = req.body;
  if (!rooms[roomId]) return res.status(404).json({error: 'Room not found'});
  
  const results = rooms[roomId].state.gameData.results;
  const contextData = results.map(r => ({ name: r.name, diagnosis: r.diagnosis, comment: r.comment }));
  const promptText = JSON.stringify({ context: contextData, userPrompt: prompt });
  
  const aiResponse = await generateMockResponse(promptText, 'face_additional', null, persona);
  const messageText = aiResponse.content[0].text;
  
  if (rooms[roomId]) {
    rooms[roomId].state.gameData.additionalDiagnosis = { prompt, result: messageText };
    io.to(roomId).emit('room_updated', rooms[roomId]);
  }
  res.json({ success: true });
});

// Auth and DB endpoints
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const user = await dbHelper.register(email, password, name);
    res.json({ success: true, user });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await dbHelper.login(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/me/profile', async (req, res) => {
  const { userId, profileData } = req.body;
  try {
    await dbHelper.updateProfile(userId, profileData);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me/contacts', async (req, res) => {
  const { userId } = req.query;
  try {
    const contacts = await dbHelper.getContacts(userId);
    res.json({ success: true, contacts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/me/save_contacts', async (req, res) => {
  const { userId, contacts } = req.body; // contacts is array of { name, profile_data }
  if (!userId || !contacts || !Array.isArray(contacts)) return res.json({ success: true });
  
  try {
    for (const c of contacts) {
      if (c.name) {
        await dbHelper.addContact(userId, c.name, c.profile_data || {});
      }
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const roomHandler = require('./socket/roomHandler');

const { generateMockResponse } = require('./utils/aiMock');

const app = express();
app.use(cors());
app.use(express.json()); // add json body parser

app.post('/api/ai/guess_age', async (req, res) => {
  const { episode } = req.body;
  const aiResponse = await generateMockResponse(episode, 'age_guess');
  res.json(aiResponse);
});

app.post('/api/ai/face_analysis', async (req, res) => {
  const { promptId } = req.body;
  const aiResponse = await generateMockResponse(promptId, 'face_analysis');
  res.json(aiResponse);
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
  roomHandler(io, socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

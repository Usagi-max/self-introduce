import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

import Home from './components/Home'
import Room from './components/Room'
import AdBanner from './components/Ads/AdBanner'

// Use environment variable for backend URL in production, fallback to localhost for development
const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('room_updated', (updatedRoom) => {
      console.log('Room updated:', updatedRoom);
      setRoom(updatedRoom);
      const me = updatedRoom.players.find(p => p.id === newSocket.id);
      if (me) {
        setIsHost(me.isHost);
      }
    });

    newSocket.on('game_started', ({ game, state }) => {
      setRoom(prev => prev ? { ...prev, state } : prev);
    });

    newSocket.on('game_state_updated', (state) => {
      setRoom(prev => prev ? { ...prev, state } : prev);
    });

    return () => newSocket.close();
  }, []);

  const handleCreateRoom = (name) => {
    setIsLoading(true);
    setPlayerName(name);
    socket.emit('create_room', { playerName: name }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setRoom(response.room);
        setIsHost(true);
        navigate(`/room/${response.roomId}`, { state: { isNew: true } });
      } else {
        alert('Failed to create room');
      }
    });
  };

  const handleJoinRoom = (roomId, name) => {
    setIsLoading(true);
    setPlayerName(name);
    socket.emit('join_room', { roomId, playerName: name }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setRoom(response.room);
        setIsHost(false);
        navigate(`/room/${roomId}`);
      } else {
        alert(response.message || 'Failed to join room');
      }
    });
  };

  return (
    <>
      <header className="app-header">
        <div className="app-logo">自己紹介ゲーム</div>
      </header>
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              onCreate={handleCreateRoom} 
              onJoin={handleJoinRoom}
              isLoading={isLoading}
            />
          } 
        />
        <Route 
          path="/room/:roomId" 
          element={
            <Room 
              socket={socket} 
              room={room} 
              isHost={isHost}
              playerName={playerName}
            />
          } 
        />
      </Routes>
      <AdBanner />
    </>
  )
}

export default App

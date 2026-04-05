import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

import Home from './components/Home'
import Room from './components/Room'
import AdBanner from './components/Ads/AdBanner'

// Use environment variable for backend URL in production, fallback to localhost for development
const SOCKET_SERVER_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, "");

function Register() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#f5f7fa' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>無料会員登録（デモ画面）</h1>
      <p style={{ color: 'var(--gray-dark)', fontSize: '1.1rem', marginBottom: '2rem' }}>
        ここで会員登録とプロフィール保存を行うと、次回のAI相性診断から面倒な入力をすべてスキップできます！
      </p>
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left', backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <input className="input-field" placeholder="メールアドレス" />
        <input className="input-field" placeholder="パスワード" type="password" />
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>登録する（モック）</button>
      </div>
    </div>
  );
}

function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let currentSessionId = sessionStorage.getItem('sessionId');
    if (!currentSessionId) {
      currentSessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('sessionId', currentSessionId);
    }
    setSessionId(currentSessionId);

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    // Attempt to rejoin if we have a saved room
    const savedRoomId = sessionStorage.getItem('savedRoomId');
    if (savedRoomId && currentSessionId) {
      newSocket.emit('rejoin_room', { roomId: savedRoomId, sessionId: currentSessionId }, (response) => {
        if (response.success) {
          setRoom(response.room);
          const me = response.room.players.find(p => p.sessionId === currentSessionId);
          if (me) {
            setIsHost(me.isHost);
            setPlayerName(me.name);
          }
        } else {
          sessionStorage.removeItem('savedRoomId');
        }
      });
    }

    newSocket.on('kicked_from_room', () => {
      alert('ホストからルームを退出させられました。');
      sessionStorage.removeItem('savedRoomId');
      setRoom(null);
      setIsHost(false);
      navigate('/');
    });

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
    socket.emit('create_room', { playerName: name, sessionId }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setRoom(response.room);
        setIsHost(true);
        sessionStorage.setItem('savedRoomId', response.roomId);
        navigate(`/room/${response.roomId}`, { state: { isNew: true } });
      } else {
        alert('Failed to create room');
      }
    });
  };

  const handleJoinRoom = (roomId, name) => {
    setIsLoading(true);
    setPlayerName(name);
    socket.emit('join_room', { roomId, playerName: name, sessionId }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setRoom(response.room);
        setIsHost(false);
        sessionStorage.setItem('savedRoomId', roomId);
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
        <Route path="/register" element={<Register />} />
      </Routes>
      <AdBanner />
    </>
  )
}

export default App

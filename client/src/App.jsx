import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'

import Home from './components/Home'
import Room from './components/Room'
import BannerAd from './components/BannerAd'
import PrivacyPolicy from './components/PrivacyPolicy'
import HowToPlay from './components/HowToPlay'
import Scenes from './components/Scenes'
import MachiconLanding from './components/MachiconLanding'

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

  const handleJoinRoom = (roomId, name, forceOverride = false) => {
    setIsLoading(true);
    setPlayerName(name);
    socket.emit('join_room', { roomId, playerName: name, sessionId, forceOverride }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setRoom(response.room);
        setIsHost(false);
        sessionStorage.setItem('savedRoomId', roomId);
        navigate(`/room/${roomId}`);
      } else if (response.error === 'name_conflict') {
        if (window.confirm(`同名ユーザー「${name}」が既にルームにいます。このユーザーデータを上書きして復活（ログイン）しますか？`)) {
          handleJoinRoom(roomId, name, true);
        }
      } else {
        alert(response.message || 'Failed to join room');
      }
    });
  };

  return (
    <>
      <header className="app-header">
        <div 
          className="app-logo" 
          onClick={() => {
            if (window.location.pathname === '/') return;
            if (window.confirm('ホームに戻りますか？（現在のルームからは退出します）')) {
              if (socket && room) {
                // We do not have explicit leave_room emit yet, so just clear local state
              }
              sessionStorage.removeItem('savedRoomId');
              window.location.href = '/';
            }
          }}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <img src="/AiBアイコン.png" alt="AiB Icon" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontWeight: 900, fontSize: '1.7rem', letterSpacing: '-0.02em', color: 'var(--primary)' }}>アイブレ</span>
            <span style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontSize: '0.8rem', color: 'var(--gray-medium)', fontWeight: 800, letterSpacing: '0.02em' }}>-AI ice Break-</span>
          </div>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/scenes" element={<Scenes />} />
          <Route path="/machicon" element={<MachiconLanding />} />
        </Routes>
      </main>
      <footer style={{ textAlign: 'center', padding: '1.5rem 1rem', fontSize: '0.8rem', color: 'var(--gray-medium)', borderTop: '1px solid var(--gray-light)', backgroundColor: 'var(--light)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Link to="/how-to-play" style={{ color: 'var(--gray-dark)', textDecoration: 'none' }}>遊び方・使い方</Link>
          <Link to="/scenes" style={{ color: 'var(--gray-dark)', textDecoration: 'none' }}>シーン別おすすめ</Link>
          <Link to="/privacy" style={{ color: 'var(--gray-dark)', textDecoration: 'none' }}>プライバシーポリシー</Link>
        </div>
        &copy; {new Date().getFullYear()} アイブレ -AI ice Break- All rights reserved.
      </footer>
    </>
  )
}

export default App

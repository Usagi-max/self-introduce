import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import Roulette from './Games/Roulette';
import Unanimous from './Games/Unanimous';
import AIGuessAge from './Games/AIGuessAge';
import AIFaceAnalysis from './Games/AIFaceAnalysis';
import Penalty from './Penalty/Penalty';
import RouletteSetup from './Games/RouletteSetup';

function Room({ socket, room, isHost, playerName }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [mustSetup, setMustSetup] = useState(location.state?.isNew || false);

  // If page refershed and context lost, return home
  useEffect(() => {
    if (!socket || !room) {
      if (roomId) navigate(`/?join=${roomId}`);
      else navigate('/');
    }
  }, [socket, room, navigate, roomId]);

  if (!socket || !room) return null;

  const joinUrl = `${window.location.origin}/room/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartGame = (gameName) => {
    socket.emit('start_game', { roomId, gameName });
  };

  const handleReturnToLobby = () => {
    socket.emit('update_game_state', { roomId, payload: { status: 'lobby', game: null } });
  };

  // Lobby state
  if (room.state.status === 'lobby') {
    if (mustSetup && isHost) {
      return (
        <div className="container animate-slide-up">
          <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>🎉 ルーム作成成功！</h2>
            <p style={{ color: 'var(--dark)' }}>まずは、このルームで遊ぶ「お題」を決めましょう。</p>
          </div>
          <RouletteSetup socket={socket} room={room} roomId={roomId} forceOpen={true} onSaved={() => setMustSetup(false)} />
        </div>
      );
    }

    return (
      <div className="container animate-slide-up">
        
        {/* QR Code and Room Sharing Card */}
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--gray-medium)', marginBottom: '1rem' }}>ルームの共有</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'white', border: '1px solid var(--gray-light)', borderRadius: '8px' }}>
              <QRCodeCanvas value={joinUrl} size={150} level={"H"} />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>招待リンク</p>
            <div 
              style={{
                fontSize: '1rem', 
                fontWeight: 600, 
                color: 'var(--primary)',
                wordBreak: 'break-all',
                marginBottom: '1rem',
                cursor: 'pointer'
              }}
              onClick={handleCopyLink}
            >
              {joinUrl}
            </div>
            <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={handleCopyLink}>
              {copiedLink ? '✓ コピーしました' : 'リンクをコピーする'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginTop: '0.5rem' }}>
              直接ルームIDを入力: <span style={{fontWeight: 'bold', letterSpacing: '2px'}}>{roomId}</span>
            </p>
          </div>
        </div>

        <div className="card" style={{ flex: 1, marginBottom: '1.5rem' }}>
          <h3>参加者 ({room.players.length}人)</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
            {room.players.map(p => (
              <li 
                key={p.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--gray-light)',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: p.isHost ? 'var(--primary)' : 'var(--secondary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {p.name.charAt(0)}
                </div>
                {p.name} {p.isHost && <span style={{fontSize: '0.75rem', color:'var(--primary)', marginLeft: '0.5rem'}}>(ホスト)</span>}
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>ゲームを選ぶ</h3>
            
            <RouletteSetup socket={socket} room={room} roomId={roomId} />

            <button className="btn btn-primary" style={{ marginBottom: '0.75rem' }} onClick={() => handleStartGame('roulette')}>
              自己紹介ルーレット
            </button>
            <button className="btn btn-secondary" style={{ marginBottom: '0.75rem' }} onClick={() => handleStartGame('unanimous')}>
              全員一致ゲーム
            </button>
            <button className="btn btn-secondary" style={{ marginBottom: '0.75rem' }} onClick={() => handleStartGame('age_guess')}>
              AI年齢当てゲーム
            </button>
            <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => handleStartGame('face_analysis')}>
              AI人相誤診断ゲーム
            </button>
            <div style={{ borderTop: '1px solid var(--gray-light)', margin: '1rem 0', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ backgroundColor: '#FFebF0', color: 'var(--primary)' }} onClick={() => handleStartGame('penalty')}>
                💀 罰ゲームを設定する
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--gray-medium)', fontWeight: 600 }}>ホストがゲームを開始するのを待っています...</p>
          </div>
        )}
      </div>
    );
  }

  // Active game dispatch
  return (
    <div className="container" style={{ position: 'relative' }}>
      {room.state.game === 'roulette' && (
        <Roulette socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'unanimous' && (
        <Unanimous socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'age_guess' && (
        <AIGuessAge socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'face_analysis' && (
        <AIFaceAnalysis socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'penalty' && (
        <Penalty socket={socket} room={room} isHost={isHost} roomId={roomId} />
      )}
      
      {isHost && (
        <button 
          className="btn btn-secondary"
          style={{ position: 'absolute', top: '-60px', right: '0', width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          onClick={handleReturnToLobby}
        >
          やめる
        </button>
      )}
    </div>
  );
}

export default Room;

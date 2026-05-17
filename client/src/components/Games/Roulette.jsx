import React, { useState, useEffect } from 'react';
import RouletteSetup from './RouletteSetup';
import { Play } from 'lucide-react';

function Roulette({ socket, room, isHost, playerName, roomId }) {
  const topics = room.state.rouletteTopics || ['お題が見つかりません'];
  const gameData = room.state.gameData || { phase: 'setup', spinning: false, resultTopic: '', resultPlayer: null };

  const [spinText, setSpinText] = useState('???');
  const [targetIds, setTargetIds] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('ランダム');

  useEffect(() => {
    if (targetIds.length === 0 && room.players.length > 0) {
      setTargetIds(room.players.map(p => p.id));
    }
  }, [room.players]);

  const toggleTarget = (id) => {
    if (targetIds.includes(id)) {
      setTargetIds(targetIds.filter(t => t !== id));
    } else {
      setTargetIds([...targetIds, id]);
    }
  };

  // Visual spinning effect
  useEffect(() => {
    let interval;
    if (gameData.spinning && topics.length > 0) {
      interval = setInterval(() => {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        setSpinText(randomTopic);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameData.spinning, topics]);

  const spinRoulette = () => {
    const validPlayers = room.players.filter(p => targetIds.includes(p.id));
    if (validPlayers.length === 0) return alert('対象者を1人以上選んでください');

    const randomPlayer = validPlayers[Math.floor(Math.random() * validPlayers.length)];
    const chosenTopic = selectedTopic === 'ランダム' 
      ? topics[Math.floor(Math.random() * topics.length)]
      : selectedTopic;

    // Emit spinning state
    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { phase: 'spinning', spinning: true, resultTopic: '', resultPlayer: null }
      }
    });

    // Stop after 3 seconds
    setTimeout(() => {
      socket.emit('update_game_state', {
        roomId,
        payload: {
          gameData: { phase: 'result', spinning: false, resultTopic: chosenTopic, resultPlayer: randomPlayer }
        }
      });
    }, 3000);
  };

  if (gameData.phase === 'setup') {
    return (
      <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 900 }}>自己紹介ルーレット</h2>
        <div style={{ marginBottom: '2rem', width: '100%', maxWidth: '500px' }}>
          <RouletteSetup socket={socket} room={room} roomId={roomId} forceOpen={true} />
        </div>
        {isHost ? (
          <button
            className="btn btn-primary"
            onClick={() => socket.emit('update_game_state', { roomId, payload: { gameData: { ...gameData, phase: 'ready' } } })}
            style={{ width: '100%', maxWidth: '280px', borderRadius: '100px', fontWeight: 800, fontSize: '1.1rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Play size={20} /> このお題で始める
          </button>
        ) : (
          <p style={{ color: 'var(--gray-medium)', fontWeight: 600 }}>ホストがお題を設定しています...</p>
        )}
      </div>
    );
  }

  return (
    <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--primary)', fontWeight: 900, margin: 0 }}>自己紹介ルーレット</h2>
        {isHost && !gameData.spinning && gameData.phase !== 'result' && (
          <button
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => socket.emit('update_game_state', { roomId, payload: { gameData: { ...gameData, phase: 'setup' } } })}
          >
            お題を編集
          </button>
        )}
      </div>

      {/* お題選択プルダウン */}
      <div style={{ marginBottom: '2.5rem', width: '100%', maxWidth: '300px', margin: '0 auto 2.5rem auto' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-medium)', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>お題の選択</p>
        {isHost ? (
          <select 
            className="input-field" 
            value={selectedTopic} 
            onChange={e => setSelectedTopic(e.target.value)}
            disabled={gameData.spinning || gameData.phase === 'result'}
            style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <option value="ランダム">🎲 ランダムで決定</option>
            {topics.map((t, i) => (
              <option key={i} value={t}>{t}</option>
            ))}
          </select>
        ) : (
          <div style={{ backgroundColor: 'var(--light)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--dark)' }}>
            {selectedTopic === 'ランダム' ? '🎲 ランダムで決定' : selectedTopic}
          </div>
        )}
      </div>

      {/* ルーレット本体: Cute & Smooth Animation */}
      <div
        style={{
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          border: `6px solid ${gameData.phase === 'result' ? 'var(--secondary)' : 'var(--primary)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2.5rem',
          backgroundColor: 'var(--white)',
          boxShadow: gameData.spinning ? '0 0 0 10px rgba(255, 90, 95, 0.1), 0 10px 25px rgba(255, 90, 95, 0.2)' : 'var(--shadow-md)',
          position: 'relative',
          padding: '1rem',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: gameData.spinning ? 'scale(1.05)' : 'scale(1)',
        }}
        className={gameData.spinning ? 'animate-pulse-soft' : ''}
      >
        <style>{`
          @keyframes pulseSoft {
            0% { transform: scale(1.05); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1.05); }
          }
          .animate-pulse-soft {
            animation: pulseSoft 0.8s infinite ease-in-out;
          }
        `}</style>

        {gameData.phase === 'result' ? (
          <div className="animate-pop" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--gray-medium)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>お話するのは...</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
              {gameData.resultPlayer?.name} <span style={{ fontSize: '1rem' }}>さん</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)', lineHeight: '1.4' }}>
              「{gameData.resultTopic}」
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%' }}>
            {gameData.spinning ? (
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', display: 'block', padding: '0 1rem', lineHeight: '1.4', animation: 'popIn 0.1s infinite alternate' }}>
                {spinText}
              </span>
            ) : (
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-medium)', display: 'block', padding: '0 1rem' }}>
                準備完了
              </span>
            )}
          </div>
        )}
      </div>

      {isHost ? (
        <div style={{ width: '100%', maxWidth: '280px' }}>
          {!gameData.spinning && gameData.phase !== 'result' && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--light)', borderRadius: '8px', border: '1px solid var(--gray-light)' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--gray-dark)' }}>ルーレットの対象者を選択</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {room.players.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={targetIds.includes(p.id)}
                      onChange={() => toggleTarget(p.id)}
                      style={{ width: '1.2rem', height: '1.2rem' }}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={spinRoulette}
            disabled={gameData.spinning || targetIds.length === 0}
            style={{ width: '100%', borderRadius: '100px', fontWeight: 800, fontSize: '1.1rem', padding: '1rem' }}
          >
            {gameData.spinning ? 'ルーレット回転中...' : (gameData.phase === 'result' ? 'もう一度回す！' : 'ルーレットを回す！')}
          </button>
        </div>
      ) : (
        <p style={{ color: 'var(--gray-medium)', fontWeight: 600 }}>
          {gameData.spinning ? 'ルーレット回転中...' : 'ホストがルーレットを回すのを待っています...'}
        </p>
      )}
    </div>
  );
}

export default Roulette;

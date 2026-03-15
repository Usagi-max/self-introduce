import React, { useState, useEffect } from 'react';

function Roulette({ socket, room, isHost, playerName, roomId }) {
  const topics = room.state.rouletteTopics || ['お題が見つかりません'];
  const gameData = room.state.gameData || { phase: 'ready', spinning: false, resultTopic: '', resultPlayer: null };
  
  const [spinText, setSpinText] = useState('???');

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
    const randomPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
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
          gameData: { phase: 'result', spinning: false, resultTopic: randomTopic, resultPlayer: randomPlayer }
        }
      });
    }, 3000);
  };

  return (
    <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 900 }}>自己紹介ルーレット</h2>
      
      {/* お題リスト公開エリア */}
      <div style={{ marginBottom: '2.5rem', maxWidth: '100%', overflow: 'hidden' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-medium)', marginBottom: '0.75rem', textAlign: 'center' }}>ルーレット 후보 ({topics.length}件)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
          {topics.map((t, i) => (
            <span key={i} style={{ 
              backgroundColor: (gameData.phase === 'result' && gameData.resultTopic === t) ? 'var(--primary)' : 'var(--light)', 
              color: (gameData.phase === 'result' && gameData.resultTopic === t) ? 'var(--white)' : 'var(--dark)',
              padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: (gameData.phase === 'result' && gameData.resultTopic === t) ? 'scale(1.1)' : 'scale(1)',
              boxShadow: (gameData.phase === 'result' && gameData.resultTopic === t) ? '0 4px 12px rgba(255, 90, 95, 0.4)' : 'none'
            }}>
              {t}
            </span>
          ))}
        </div>
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
              {gameData.resultPlayer?.name} <span style={{fontSize: '1rem'}}>さん</span>
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
        <button 
          className="btn btn-primary"
          onClick={spinRoulette}
          disabled={gameData.spinning}
          style={{ width: '100%', maxWidth: '280px', borderRadius: '100px', fontWeight: 800, fontSize: '1.1rem', padding: '1rem' }}
        >
          {gameData.spinning ? 'ルーレット回転中...' : (gameData.phase === 'result' ? 'もう一度回す！' : 'ルーレットを回す！')}
        </button>
      ) : (
        <p style={{ color: 'var(--gray-medium)', fontWeight: 600 }}>
          {gameData.spinning ? 'ルーレット回転中...' : 'ホストがルーレットを回すのを待っています...'}
        </p>
      )}
    </div>
  );
}

export default Roulette;

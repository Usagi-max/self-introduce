import React, { useState, useEffect } from 'react';

function Roulette({ socket, room, isHost, playerName, roomId }) {
  const topics = room.state.rouletteTopics || ['お題が見つかりません'];
  const gameData = room.state.gameData || { phase: 'ready', spinning: false, resultTopic: '', resultPlayer: null };
  
  const [spinText, setSpinText] = useState('???');
  const [targetIds, setTargetIds] = useState([]);

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
      socket.emit('update_player_metadata', {
        roomId,
        playerId: randomPlayer.id,
        payload: { penalties: (randomPlayer.metadata?.penalties || 0) + 1 }
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

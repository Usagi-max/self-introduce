import React, { useState, useEffect } from 'react';

const PENALTY_PRESETS = [
  { name: '😅 軽め', topics: ['最近あった恥ずかしいこと', '一番好きな人にモノマネをリクエスト', '全力でアイドルスマイル'] },
  { name: '🤖 AI相談', topics: ['AIに自分の恥ずかしい秘密を暴露される', 'AIに自分好みの異性のタイプを聞く', 'AIに最近悩んでいることを出力させる'] },
  { name: '💀 鬼畜', topics: ['スマホの検索履歴を一番上から3つ発表', 'カメラに向かって全力で愛の告白', '全員にジュースを奢る約束をする'] }
];

const COMMON_PENALTIES = [
  '全力で変顔を10秒キープ', '指定された人の良いところを3つ言う', '1分間赤ちゃん言葉で話す', '初恋の話をする', '最近泣いた話をする'
];

function Penalty({ socket, room, isHost, roomId }) {
  const [spinTarget, setSpinTarget] = useState('???');
  const [spinPenalty, setSpinPenalty] = useState('???');
  const [newTopicInput, setNewTopicInput] = useState('');

  const currentTopics = room.state.penaltyTopics || PENALTY_PRESETS[0].topics;
  const gameData = room.state.gameData || { phase: 'setup', type: null, target: null };

  // Chaotic text spinner effect
  useEffect(() => {
    let interval;
    if (gameData.phase === 'spinning' && currentTopics.length > 0) {
      interval = setInterval(() => {
        const randomPlayer = room.players[Math.floor(Math.random() * room.players.length)].name;
        const randomPenalty = currentTopics[Math.floor(Math.random() * currentTopics.length)];
        setSpinTarget(randomPlayer);
        setSpinPenalty(randomPenalty);
      }, 50); // very fast text updates for chaos
    }
    return () => clearInterval(interval);
  }, [gameData.phase, room.players, currentTopics]);

  const handleAddTopic = (topicText) => {
    const topic = typeof topicText === 'string' ? topicText : newTopicInput;
    if (topic.trim() !== '' && !currentTopics.includes(topic.trim())) {
      socket.emit('update_game_state', {
        roomId,
        payload: { penaltyTopics: [...currentTopics, topic.trim()] }
      });
    }
    setNewTopicInput('');
  };

  const handleRemoveTopic = (index) => {
    socket.emit('update_game_state', {
      roomId,
      payload: { penaltyTopics: currentTopics.filter((_, i) => i !== index) }
    });
  };

  const applyPreset = (presetTopics) => {
    socket.emit('update_game_state', {
      roomId,
      payload: { penaltyTopics: presetTopics }
    });
  };

  const triggerPenalty = () => {
    if (currentTopics.length === 0) {
      alert('罰ゲームの種類を1つ以上設定してください。');
      return;
    }

    const resultPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    const resultPenalty = currentTopics[Math.floor(Math.random() * currentTopics.length)];

    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { phase: 'spinning' }
      }
    });

    // Spin for 3 seconds
    setTimeout(() => {
      // Fake Ad
      socket.emit('update_game_state', {
        roomId,
        payload: {
          gameData: { phase: 'video_ad', target: resultPlayer, type: resultPenalty }
        }
      });

      // Ad lasts 3 seconds, then execution
      setTimeout(() => {
        socket.emit('update_game_state', {
          roomId,
          payload: {
            gameData: { phase: 'execute', target: resultPlayer, type: resultPenalty }
          }
        });
      }, 3000);

    }, 3000);
  };

  const endPenalty = () => {
    socket.emit('update_game_state', {
      roomId,
      payload: { status: 'lobby', game: null }
    });
  };

  if (gameData.phase === 'setup') {
    if (!isHost) {
      return (
        <div className="card center-content animate-pop">
          <p style={{ color: 'var(--gray-medium)', fontWeight: 600 }}>ホストが恐怖の罰ゲームルーレットを準備中...</p>
        </div>
      );
    }

    return (
      <div className="card set-content animate-pop" style={{ textAlign: 'left' }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#E53E3E', textAlign: 'center' }}>💀 罰ゲームルーレット設定</h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          {PENALTY_PRESETS.map((preset, i) => (
            <button 
              key={i} 
              className="btn btn-secondary" 
              style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--white)', border: '1px solid #E53E3E', color: '#E53E3E' }}
              onClick={() => applyPreset(preset.topics)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="新しい罰ゲームを入力..." 
            value={newTopicInput}
            onChange={(e) => setNewTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            style={{ padding: '0.5rem', fontSize: '0.875rem', border: '1px solid #E53E3E' }}
          />
          <button className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', backgroundColor: '#E53E3E', border: 'none' }} onClick={handleAddTopic}>追加</button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>よく使われる罰（タップで追加）</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {COMMON_PENALTIES.map((t, i) => (
              <button 
                key={i} 
                onClick={() => handleAddTopic(t)}
                disabled={currentTopics.includes(t)}
                style={{ 
                  fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #fecaca', 
                  backgroundColor: currentTopics.includes(t) ? '#fee2e2' : 'var(--white)',
                  color: currentTopics.includes(t) ? '#b91c1c' : '#E53E3E',
                  cursor: currentTopics.includes(t) ? 'default' : 'pointer'
                }}
              >
                + {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#fee2e2', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#b91c1c' }}>現在のラインナップ ({currentTopics.length}件)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentTopics.map((t, i) => (
              <div key={i} style={{ backgroundColor: 'var(--white)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #E53E3E' }}>
                {t}
                <button onClick={() => handleRemoveTopic(i)} style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="btn btn-primary animate-pulse" 
          style={{ backgroundColor: '#111', border: '5px solid #E53E3E', fontSize: '1.25rem', fontWeight: 900, padding: '1rem', width: '100%' }} 
          onClick={triggerPenalty}
        >
          恐怖のルーレットを回す！
        </button>
      </div>
    );
  }

  if (gameData.phase === 'video_ad') {
    return (
      <div className="card center-content animate-pop" style={{ backgroundColor: '#000', color: 'white', minHeight: '60vh' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#FFD700' }}>動画広告視聴中 (焦らし演出)</h2>
        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>「え、ここで広告！？笑」</p>
        <div className="loader" style={{ marginTop: '2rem', borderColor: '#333', borderTopColor: '#FFD700' }}></div>
      </div>
    );
  }

  // Spinning Phase
  if (gameData.phase === 'spinning') {
    return (
      <div className="card center-content" style={{ backgroundColor: '#111', color: 'white', minHeight: '60vh', overflow: 'hidden' }}>
        <style>{`
          @keyframes violentShake {
            0% { transform: translate(2px, 2px) rotate(0deg); }
            10% { transform: translate(-2px, -4px) rotate(-2deg); }
            20% { transform: translate(-6px, 0px) rotate(2deg); }
            30% { transform: translate(6px, 4px) rotate(0deg); }
            40% { transform: translate(2px, -2px) rotate(2deg); }
            50% { transform: translate(-2px, 4px) rotate(-2deg); }
            60% { transform: translate(-6px, 2px) rotate(0deg); }
            70% { transform: translate(6px, 2px) rotate(-2deg); }
            80% { transform: translate(-2px, -2px) rotate(2deg); }
            90% { transform: translate(2px, 4px) rotate(0deg); }
            100% { transform: translate(2px, -4px) rotate(-2deg); }
          }
          .animate-violent-shake {
            animation: violentShake 0.1s infinite;
          }
        `}</style>

        <h2 style={{ color: '#E53E3E', marginBottom: '3rem', fontSize: '2.5rem', fontWeight: 900 }} className="animate-violent-shake">
          ルーレット回転中...!!
        </h2>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ color: '#888', marginBottom: '0.5rem' }}>ターゲット候補</div>
          <div className="animate-violent-shake" style={{ fontSize: '3rem', fontWeight: 900, color: 'white', marginBottom: '2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {spinTarget}
          </div>

          <div style={{ color: '#888', marginBottom: '0.5rem' }}>罰ゲーム候補</div>
          <div className="animate-violent-shake" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E53E3E', padding: '0 1rem' }}>
            {spinPenalty}
          </div>
        </div>
      </div>
    );
  }

  // Execute Phase
  return (
    <div className="card center-content animate-pop" style={{ backgroundColor: '#FFebF0', border: '4px solid #E53E3E', minHeight: '60vh' }}>
      <h2 style={{ fontSize: '2.5rem', color: '#E53E3E', marginBottom: '2rem', fontWeight: 900, textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
        💀 罰ゲーム 決定 💀
      </h2>
      
      <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--dark)' }}>
        ターゲット
      </div>
      <div style={{ fontSize: '3rem', fontWeight: 900, color: '#E53E3E', marginBottom: '2rem' }}>
        {gameData.target?.name}
      </div>

      <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--dark)' }}>
        内容は...
      </div>
      <div style={{ 
        backgroundColor: 'var(--white)', 
        padding: '2rem', 
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '3rem',
        border: '3px dashed #E53E3E',
        width: '100%',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark)' }}>
          {gameData.type?.label}
        </p>
      </div>

      {isHost && (
        <button className="btn btn-primary" style={{ backgroundColor: '#111', border: 'none' }} onClick={endPenalty}>
          罰ゲーム終了（ロビーへ）
        </button>
      )}
    </div>
  );
}

export default Penalty;

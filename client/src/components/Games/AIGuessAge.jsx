import React, { useState, useEffect } from 'react';

function AIGuessAge({ socket, room, isHost, playerName, roomId }) {
  const [episode, setEpisode] = useState('');
  const [mySubmission, setMySubmission] = useState(false);

  const gameData = room.state.gameData || { phase: 'input', results: {} };
  
  const submitEpisode = async () => {
    setMySubmission(true);
    
    // In a real app, the server would call the AI API. For prototype, 
    // we can either call the backend which mocks it, or just use setTimeout here.
    // Here we'll notify the server to get a mock AI response
    socket.emit('update_game_state', {
      roomId,
      payload: {
        action: 'submit_episode',
        player: socket.id,
        name: playerName,
        text: episode
      }
    });

    // The backend in our current simple implementation doesn't listen to 'action: submit_episode' 
    // specially, so let's just do it directly here for the prototype speed.
    // In production, this would be an API call to the backend.
    
    // For prototype, we simulate standard REST request to a new endpoint we'll create:
    try {
      const response = await fetch('http://localhost:3001/api/ai/guess_age', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ episode })
      });
      
      const aiContext = await response.json();
      
      // AI Context is Claude Messages API format: { content: [ { text: "JSON string" } ] }
      const messageText = aiContext.content[0].text;
      
      let parsed = { age: '?', comment: 'エラーが発生しました。' };
      try {
        parsed = JSON.parse(messageText);
      } catch(e) {
        console.error("Failed to parse AI response as JSON", messageText);
        parsed.comment = messageText;
      }

      const newResults = {
        ...gameData.results,
        [socket.id]: {
          name: playerName,
          text: episode,
          estimatedAge: parsed.age,
          comment: parsed.comment
        }
      };

      const phase = Object.keys(newResults).length === room.players.length ? 'reveal' : 'input';

      socket.emit('update_game_state', {
        roomId,
        payload: {
          gameData: { ...gameData, results: newResults, phase }
        }
      });
    } catch (e) {
      console.error(e);
      setMySubmission(false);
      alert('AI通信エラー');
    }
  };

  const resetGame = () => {
    setMySubmission(false);
    setEpisode('');
    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { phase: 'input', results: {} }
      }
    });
  };

  if (gameData.phase === 'input') {
    const answeredCount = Object.keys(gameData.results).length;

    if (mySubmission) {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>AIが年齢を推定中...</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
            {room.players.length - answeredCount}人 待ち
          </div>
          <div className="loader" style={{ marginTop: '2rem' }}></div>
          <style>{`
            .loader {
              border: 4px solid var(--gray-light);
              border-top: 4px solid var(--primary);
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      );
    }

    return (
      <div className="card set-content animate-pop">
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center' }}>AI 年齢当てゲーム</h3>
        <p style={{ textAlign: 'center', margin: '1rem 0 2rem', fontSize: '0.9rem' }}>
          やらかしエピソードや子供の頃の話を入力して、<br/>AIに精神年齢を診断させよう！
        </p>

        <div className="input-group">
          <textarea 
            className="input-field"
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder="例：小学生の頃、傘を剣だと思って振り回してたら先生に見つかって..."
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary"
          onClick={submitEpisode}
          disabled={!episode.trim()}
        >
          AIに診断させる
        </button>
      </div>
    );
  }

  // phase === 'reveal'
  return (
    <div className="card animate-pop" style={{ padding: '1.5rem 1rem' }}>
      <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center', marginBottom: '1.5rem' }}>
        診断結果
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.values(gameData.results).map((res, i) => (
          <div key={i} style={{ 
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--light)',
            borderLeft: '4px solid var(--primary)'
          }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              {res.name} さんのエピソード
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--gray-medium)' }}>
              「{res.text}」
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>AIの推定年齢:</span>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
                {res.estimatedAge}歳
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {res.comment}
            </p>
          </div>
        ))}
      </div>

      {isHost && (
        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={resetGame}>
          もう一回遊ぶ
        </button>
      )}
    </div>
  );
}

export default AIGuessAge;

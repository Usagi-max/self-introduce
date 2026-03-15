import React, { useState, useEffect } from 'react';

const FACE_PROMPTS = [
  '悪そうな顔',
  'ピュアそうな顔・優しそうな顔',
  '厳しそうな顔',
  'めちゃくちゃ頭よさそうな顔',
  '悟りを開いた顔'
];

function AIFaceAnalysis({ socket, room, isHost, playerName, roomId }) {
  const [photoTaken, setPhotoTaken] = useState(false);
  const [mySubmission, setMySubmission] = useState(false);

  const gameData = room.state.gameData || { phase: 'setup', prompt: '', results: {} };

  const setupGame = () => {
    const randomPrompt = FACE_PROMPTS[Math.floor(Math.random() * FACE_PROMPTS.length)];
    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { prompt: randomPrompt, results: {}, phase: 'input' }
      }
    });
  };

  useEffect(() => {
    if (isHost && gameData.phase === 'setup') {
      setupGame();
    }
  }, []);

  const submitPhoto = async () => {
    setMySubmission(true);
    
    // In a real app, we would send the image file here.
    // For the prototype, we just send the prompt to the backend to get a funny text diagnosis.
    try {
      const response = await fetch('http://localhost:3001/api/ai/face_analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promptId: gameData.prompt }) // Tell AI what expression we *tried* to make
      });
      
      const aiContext = await response.json();
      const messageText = aiContext.content[0].text;
      
      let parsed = { diagnosis: '？な顔', comment: '解析エラーが発生しました。' };
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
          diagnosis: parsed.diagnosis,
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
    setPhotoTaken(false);
    setupGame();
  };

  if (gameData.phase === 'setup') {
    return <div className="card center-content"><p>ゲームを準備中...</p></div>;
  }

  if (gameData.phase === 'input') {
    const answeredCount = Object.keys(gameData.results).length;

    if (mySubmission) {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>AIが顔面を解析中...</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
            {room.players.length - answeredCount}人 待ち
          </div>
          <div className="loader" style={{ marginTop: '2rem' }}></div>
        </div>
      );
    }

    return (
      <div className="card center-content animate-pop">
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center' }}>AI 人相誤診断ゲーム</h3>
        
        <div style={{ margin: '1.5rem 0', padding: '1.5rem', backgroundColor: 'var(--light)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontWeight: 600, color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>以下のお題の顔をして、写真を撮れ！</p>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary)', textAlign: 'center' }}>
            「{gameData.prompt}」
          </h2>
        </div>

        {!photoTaken ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Mock Camera Viewfinder */}
            <div style={{ 
              width: '200px', height: '200px', backgroundColor: '#333', 
              borderRadius: '50%', marginBottom: '2rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: '4px dashed #666', color: '#888'
            }}>
              📱 カメラ起動中...
            </div>
            <button 
              className="btn btn-primary"
              style={{ padding: '1.5rem', borderRadius: '50%', width: '80px', height: '80px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              onClick={() => setPhotoTaken(true)}
            >
              📸
            </button>
            <p style={{ marginTop: '1rem', color: 'var(--gray-medium)', fontSize: '0.875rem' }}>
              （※プロトタイプのため写真は実際には保存されず、架空のデータが送信されます）
            </p>
          </div>
        ) : (
          <div className="animate-pop">
            <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: '#00A699' }}>いい顔ですね！</h3>
            <button 
              className="btn btn-primary"
              onClick={submitPhoto}
            >
              AIに診断させる
            </button>
            <button 
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
              onClick={() => setPhotoTaken(false)}
            >
              撮り直す
            </button>
          </div>
        )}
      </div>
    );
  }

  // phase === 'reveal'
  return (
    <div className="card animate-pop" style={{ padding: '1.5rem 1rem' }}>
      <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center', marginBottom: '1.5rem' }}>
        【お題: {gameData.prompt}】AIの診断結果
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.values(gameData.results).map((res, i) => (
          <div key={i} style={{ 
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--light)',
            borderLeft: '6px solid var(--primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1.2rem' }}>
              {res.name} の顔面解析結果
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', backgroundColor: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E53E3E' }}>
                {res.diagnosis}
              </span>
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: '1.6' }}>
              {res.comment}
            </p>
          </div>
        ))}
      </div>

      {isHost && (
        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={resetGame}>
          次のお題へ
        </button>
      )}
    </div>
  );
}

export default AIFaceAnalysis;

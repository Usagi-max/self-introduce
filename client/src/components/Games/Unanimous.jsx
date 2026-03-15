import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  '赤い果物といえば？',
  '冬のスポーツといえば？',
  '朝ごはんの定番といえば？',
  'ドラえもんの秘密道具といえば？'
];

function Unanimous({ socket, room, isHost, playerName, roomId }) {
  const [answer, setAnswer] = useState('');
  const [mySubmission, setMySubmission] = useState(false);

  const gameData = room.state.gameData || { question: '', answers: {}, phase: 'waiting' };

  // Reset local state if server starts a new round (question changes or answers clear)
  useEffect(() => {
    if (!gameData.answers[socket.id]) {
      setMySubmission(false);
      setAnswer('');
    }
  }, [gameData.question, gameData.answers, socket.id]);
  
  const setupGame = () => {
    const randomQuestion = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { question: randomQuestion, answers: {}, phase: 'input' }
      }
    });
  };

  const submitAnswer = () => {
    const updatedAnswers = { ...gameData.answers, [socket.id]: { name: playerName, text: answer } };
    
    // Check if everyone answered
    const phase = Object.keys(updatedAnswers).length === room.players.length ? 'reveal' : 'input';

    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { ...gameData, answers: updatedAnswers, phase }
      }
    });

    setMySubmission(true);
  };

  const resetGame = () => {
    setMySubmission(false);
    setAnswer('');
    setupGame();
  };

  // Auto setup on init if host
  useEffect(() => {
    if (isHost && !gameData.question) {
      setupGame();
    }
  }, []);

  if (gameData.phase === 'waiting') {
    return <div className="card center-content"><p>ゲームを準備中...</p></div>;
  }

  if (gameData.phase === 'input') {
    const answeredCount = Object.keys(gameData.answers).length;
    
    if (mySubmission) {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>全員の回答を待っています...</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
            {room.players.length - answeredCount}人 待ち
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <p style={{ color: 'var(--gray-medium)', fontSize: '0.875rem' }}>
              周りの人に「早く〜！」とプレッシャーをかけよう！
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="card set-content animate-pop">
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center' }}>お題</h3>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', margin: '1rem 0 2rem' }}>
          {gameData.question}
        </h2>

        <div className="input-group">
          <input 
            className="input-field"
            type="text" 
            placeholder="あなたの回答"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary"
          onClick={submitAnswer}
          disabled={!answer.trim()}
        >
          回答する（隠して待機）
        </button>
      </div>
    );
  }

  // phase === 'reveal'
  const isUnanimous = Object.values(gameData.answers).every(a => a.text === Object.values(gameData.answers)[0].text);

  return (
    <div className="card center-content animate-pop">
      <h3 style={{ color: 'var(--gray-medium)' }}>お題</h3>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{gameData.question}</h2>

      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 900, 
        color: isUnanimous ? '#00A699' : '#FF5A5F',
        marginBottom: '2rem',
        animation: 'popIn 0.5s ease-out'
      }}>
        {isUnanimous ? '🎉 全員一致！ 大成功！' : '❌ 残念！ 不一致...'}
      </div>

      <div style={{ width: '100%' }}>
        {Object.values(gameData.answers).map((ans, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid var(--gray-light)',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600 }}>{ans.name}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{ans.text}</span>
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

export default Unanimous;

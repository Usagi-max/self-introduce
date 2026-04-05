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
  const [customPrompt, setCustomPrompt] = useState('');

  const gameData = room.state.gameData || { question: '', answers: {}, phase: 'waiting', chooserIndex: 0, round: 1 };

  // Reset local state if server starts a new round (question changes or answers clear)
  useEffect(() => {
    if (!gameData.answers[socket.id]) {
      setMySubmission(false);
      setAnswer('');
    }
  }, [gameData.question, gameData.answers, socket.id]);
  
  const setupGame = () => {
    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { question: '', answers: {}, phase: 'prompt_selection', chooserIndex: 0, round: 1 }
      }
    });
  };

  const submitAnswer = () => {
    socket.emit('submit_unanimous_answer', {
      roomId,
      answer: { name: playerName, text: answer }
    });
    setMySubmission(true);
  };

  // Compute war criminal ranking for minority
  useEffect(() => {
    if (isHost && gameData.phase === 'reveal' && !gameData.scoredThisRound) {
      const allAnswers = Object.values(gameData.answers).map(a => a.text);
      const counts = {};
      allAnswers.forEach(a => counts[a] = (counts[a] || 0) + 1);
      
      let maxCount = 0;
      Object.values(counts).forEach(c => { if(c > maxCount) maxCount = c; });
      
      const minorityIds = [];
      Object.entries(gameData.answers).forEach(([pid, ans]) => {
        // Minority is defined as having picked an answer that is NOT the most frequent answer (or if it's a completely scattered 1-1-1 tie, everyone is minority)
        if (counts[ans.text] < maxCount || maxCount === 1) {
           minorityIds.push(pid);
        }
      });
      
      minorityIds.forEach(pid => {
        const p = room.players.find(x => x.id === pid);
        if (p) {
          socket.emit('update_player_metadata', {
            roomId,
            playerId: pid,
            payload: { penalties: (p.metadata?.penalties || 0) + 1 }
          });
        }
      });

      // Mark scored so we don't spam emits
      socket.emit('update_game_state', {
        roomId,
        payload: { gameData: { ...gameData, scoredThisRound: true } }
      });
    }
  }, [gameData.phase, isHost, gameData.scoredThisRound]);

  const nextRound = () => {
    setMySubmission(false);
    setAnswer('');
    
    let newIdx = (gameData.chooserIndex || 0) + 1;
    let newRound = gameData.round || 1;
    
    if (newIdx >= room.players.length) {
      newIdx = 0;
      newRound++;
    }

    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { ...gameData, question: '', answers: {}, phase: 'prompt_selection', chooserIndex: newIdx, round: newRound, scoredThisRound: false }
      }
    });
  };

  // Auto setup on init if host
  useEffect(() => {
    if (isHost && (!room.state.gameData || room.state.gameData.phase === 'waiting' || !room.state.gameData.phase)) {
      setupGame();
    }
  }, []);

  if (gameData.phase === 'waiting') {
    return <div className="card center-content"><p>ゲームを準備中...</p></div>;
  }

  if (gameData.phase === 'prompt_selection') {
    const currentChooser = room.players[gameData.chooserIndex || 0] || room.players[0];
    const isMyTurn = currentChooser && currentChooser.id === socket.id;

    if (isMyTurn) {
      return (
        <div className="card animate-pop" style={{ padding: '2rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
            あなたがお題を決める番です！ <span style={{ fontSize: '1rem', color: 'var(--gray-medium)' }}>(ラウンド {gameData.round || 1})</span>
          </h2>
          <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>既存のリストから選ぶ:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {QUESTIONS.map((q, i) => (
              <button key={i} className="btn btn-secondary" style={{ textAlign: 'left', backgroundColor: 'var(--white)', color: 'var(--gray-dark)' }} onClick={() => {
                socket.emit('update_game_state', { roomId, payload: { gameData: { ...gameData, question: q, phase: 'input' } } });
              }}>{q}</button>
            ))}
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--light)', borderRadius: '8px' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>自分で好きなお題を入力する:</p>
            <input 
              className="input-field" 
              placeholder="例: 無人島に一つだけ持っていくなら？" 
              value={customPrompt} 
              onChange={e => setCustomPrompt(e.target.value)} 
            />
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }} 
              disabled={!customPrompt.trim()}
              onClick={() => {
                socket.emit('update_game_state', { roomId, payload: { gameData: { ...gameData, question: customPrompt.trim(), phase: 'input' } } });
                setCustomPrompt('');
              }}
            >
              このお題でゲーム開始
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <div className="loader" style={{ marginBottom: '2rem' }}></div>
          <h2 style={{ fontSize: '1.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>{currentChooser?.name}</span> がお題を選んでいます...
          </h2>
          <p style={{ color: 'var(--gray-medium)', marginTop: '1rem' }}>(ラウンド {gameData.round || 1})</p>
        </div>
      );
    }
  }

  if (gameData.phase === 'input') {
    const answeredCount = Object.keys(gameData.answers || {}).length;
    const activeCount = room.players.filter(p => p.connected).length;
    
    if (mySubmission) {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>全員の回答を待っています...</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
            {Math.max(0, activeCount - answeredCount)}人 待ち
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
        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={nextRound}>
          次のお題へ（出題者を交代）
        </button>
      )}
    </div>
  );
}

export default Unanimous;

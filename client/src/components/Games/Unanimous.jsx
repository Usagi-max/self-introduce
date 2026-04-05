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

  // Host evaluation states
  const [evalMode, setEvalMode] = useState(false);
  const [safePlayerIds, setSafePlayerIds] = useState([]);

  // Compute default strict minority if host opens evalMode
  const initiateEvalMode = () => {
    const allAnswers = Object.values(gameData.answers).map(a => a.text);
    const counts = {};
    allAnswers.forEach(a => counts[a] = (counts[a] || 0) + 1);
    
    let maxCount = 0;
    Object.values(counts).forEach(c => { if(c > maxCount) maxCount = c; });
    
    const safeIds = [];
    Object.entries(gameData.answers).forEach(([pid, ans]) => {
      // safe if they belong to the majority answer
      if (counts[ans.text] === maxCount && maxCount > 1) {
         safeIds.push(pid);
      }
    });
    // If it was 1-1-1 everyone is wrong (safeIds empty), else safeIds has the majority.
    // However if everyone matched completely, safeIds has everyone.
    setSafePlayerIds(safeIds);
    setEvalMode(true);
  };

  const toggleSafePlayer = (pid) => {
    if (safePlayerIds.includes(pid)) {
      setSafePlayerIds(safePlayerIds.filter(id => id !== pid));
    } else {
      setSafePlayerIds([...safePlayerIds, pid]);
    }
  };

  const confirmScores = (isStrictAuto = false) => {
    let idsToSave = safePlayerIds;
    
    if (isStrictAuto) {
      // Recalculate auto just to be sure
      const allAnswers = Object.values(gameData.answers).map(a => a.text);
      const counts = {};
      allAnswers.forEach(a => counts[a] = (counts[a] || 0) + 1);
      let maxCount = 0;
      Object.values(counts).forEach(c => { if(c > maxCount) maxCount = c; });
      idsToSave = [];
      Object.entries(gameData.answers).forEach(([pid, ans]) => {
        if (counts[ans.text] === maxCount && maxCount > 1) idsToSave.push(pid);
      });
      // if literally true unanimous, everyone is safe.
      const isUnanimous = Object.values(gameData.answers).every(a => a.text === Object.values(gameData.answers)[0].text);
      if (isUnanimous) idsToSave = Object.keys(gameData.answers);
    }
    
    const minorityIds = Object.keys(gameData.answers).filter(pid => !idsToSave.includes(pid));
    
    minorityIds.forEach(pid => {
      const p = room.players.find(x => x.id === pid);
      if (p) {
        let currentBg = p.metadata?.penaltiesByGame || { unanimous: 0, face_analysis: 0 };
        currentBg.unanimous = (currentBg.unanimous || 0) + 1;
        socket.emit('update_player_metadata', {
          roomId,
          playerId: pid,
          payload: { penaltiesByGame: currentBg }
        });
      }
    });

    socket.emit('update_game_state', {
      roomId,
      payload: { gameData: { ...gameData, scoredThisRound: true } }
    });
    setEvalMode(false);
  };

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
        {Object.entries(gameData.answers).map(([pid, ans]) => (
          <div key={pid} style={{ 
             display: 'flex', 
             justifyContent: 'space-between',
             padding: '1rem',
             borderBottom: '1px solid var(--gray-light)',
             alignItems: 'center',
             backgroundColor: (gameData.scoredThisRound ? false : evalMode) ? (safePlayerIds.includes(pid) ? '#f0fff4' : '#fff5f5') : 'transparent'
          }}>
            <span style={{ fontWeight: 600 }}>
              {evalMode && !gameData.scoredThisRound && isHost && (
                <input 
                  type="checkbox" 
                  checked={safePlayerIds.includes(pid)}
                  onChange={() => toggleSafePlayer(pid)}
                  style={{ marginRight: '0.75rem', transform: 'scale(1.5)' }}
                />
              )}
              {ans.name}
              {(gameData.scoredThisRound ? false : evalMode) && (
                <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: safePlayerIds.includes(pid) ? '#38A169' : '#E53E3E' }}>
                  {safePlayerIds.includes(pid) ? '(セーフ)' : '(戦犯)'}
                </span>
              )}
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{ans.text}</span>
          </div>
        ))}
      </div>

      {isHost && !gameData.scoredThisRound && (
        <div style={{ marginTop: '2rem', width: '100%' }}>
          {!evalMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--gray-dark)', fontWeight: 'bold' }}>結果の判定方法を選んでください</p>
              <button className="btn btn-primary" onClick={() => confirmScores(true)}>
                自動判定（完全一致で評価）で確定する
              </button>
              <button className="btn btn-secondary" onClick={initiateEvalMode}>
                手動で判定を修正する（表記ゆれ等を許可）
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px', backgroundColor: '#f0fffd' }}>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>セーフ（一致）とする人を上のリストでチェックしてください。<br/><span style={{fontSize: '0.875rem', color: '#E53E3E'}}>※ チェックが入っていない人が全員戦犯になります</span></p>
              <button className="btn btn-primary" onClick={() => confirmScores(false)}>
                チェックした内容で結果確定
              </button>
              <button className="btn btn-secondary" onClick={() => setEvalMode(false)}>
                選び直す（キャンセル）
              </button>
            </div>
          )}
        </div>
      )}

      {isHost && gameData.scoredThisRound && (
        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={nextRound}>
          次のお題へ（出題者を交代）
        </button>
      )}
    </div>
  );
}

export default Unanimous;

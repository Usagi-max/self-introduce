import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, "");

const BLOOD_TYPES = ['A型', 'B型', 'O型', 'AB型', '不明'];
const MBTI_TYPES = [
  'INTJ (建築家)', 'INTP (論理学者)', 'ENTJ (指揮官)', 'ENTP (討論者)', 
  'INFJ (提唱者)', 'INFP (仲介者)', 'ENFJ (主人公)', 'ENFP (運動家)', 
  'ISTJ (管理者)', 'ISFJ (擁護者)', 'ESTJ (幹部)', 'ESFJ (領事)', 
  'ISTP (巨匠)', 'ISFP (冒険家)', 'ESTP (起業家)', 'ESFP (エンターテイナー)', 
  '不明'
];
const GENDER_TYPES = ['男性', '女性', 'その他', '不明'];
const ZODIACS = ['牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座', '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座', '不明'];

const ADDITIONAL_DIAGNOSIS_PRESETS = [
  "ゾンビ映画に出演したら、誰がどう生き残って誰が最初に死ぬ？",
  "無人島に漂流！それぞれの役割分担はどうなる？",
  "全員でRPGのパーティを組んだら？（職業やスキルなど）",
  "アイドルグループを結成！センターと各担当は？",
  "お笑い芸人のユニットを組むなら？",
  "全員でシェアハウスをしたら、どんなトラブルが起きる？",
  "銀行強盗の計画を立てるなら、それぞれの役割は？",
  "デスゲームに参加させられたら、最後まで生き残るのは？",
  "異世界転生したら、それぞれの職業やスキルは？",
  "映画「アベンジャーズ」のようなヒーロー集団だとしたら？",
  "自由入力"
];

function AICompatibility({ socket, room, isHost, playerName, roomId }) {
  const [bloodType, setBloodType] = useState('不明');
  const [mbti, setMbti] = useState('不明');
  const [siblingsCount, setSiblingsCount] = useState(1);
  const [birthOrder, setBirthOrder] = useState(1);
  const [siblingGenders, setSiblingGenders] = useState(['不明']);
  const [hasCloseSibling, setHasCloseSibling] = useState(false);
  const [closeSiblingRank, setCloseSiblingRank] = useState('1');
  const [closeSiblingReason, setCloseSiblingReason] = useState('');
  const [zodiac, setZodiac] = useState('不明');
  const [opinions, setOpinions] = useState([{ relation: '', opinion: '' }]);
  
  const [mySubmission, setMySubmission] = useState(false);
  const [spinNames, setSpinNames] = useState(['????', '????']);
  
  const [selectedPreset, setSelectedPreset] = useState(ADDITIONAL_DIAGNOSIS_PRESETS[0]);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isAdditionalLoading, setIsAdditionalLoading] = useState(false);

  const gameData = room.state.gameData || { 
    phase: 'setup', 
    results: {}, 
    evaluatedPairs: [], 
    currentPair: null, 
    pairAnalysis: null,
    additionalDiagnosis: null
  };
  const players = room.players || [];

  const setupGame = () => {
    socket.emit('update_game_state', {
      roomId,
      payload: { gameData: { phase: 'input', results: {}, evaluatedPairs: [], currentPair: null, pairAnalysis: null, additionalDiagnosis: null } }
    });
  };

  useEffect(() => {
    if (isHost && gameData.phase === 'setup') {
      setupGame();
    }
  }, []);

  useEffect(() => {
    if (gameData.phase === 'input') setMySubmission(false);
  }, [gameData.phase]);

  useEffect(() => {
    if (gameData.phase === 'roulette_spinning' && gameData.currentPair) {
      let count = 0;
      const intervalId = setInterval(() => {
        const randA = players[Math.floor(Math.random() * players.length)]?.name || 'A';
        const randB = players[Math.floor(Math.random() * players.length)]?.name || 'B';
        setSpinNames([randA, randB]);
        count++;
      }, 80);

      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        const playerA = players.find(p => p.id === gameData.currentPair[0])?.name || '...';
        const playerB = players.find(p => p.id === gameData.currentPair[1])?.name || '...';
        setSpinNames([playerA, playerB]);
        
        if (isHost) {
          setTimeout(() => analyzePair(gameData.currentPair), 500);
        }
      }, 2500);

      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [gameData.phase, gameData.currentPair, players, isHost]);

  const handleAddOpinion = () => setOpinions([...opinions, { relation: '', opinion: '' }]);
  const handleOpinionChange = (index, field, value) => {
    const newOps = [...opinions];
    newOps[index][field] = value;
    setOpinions(newOps);
  };
  const handleRemoveOpinion = (index) => setOpinions(opinions.filter((_, i) => i !== index));

  const handleSiblingsCountChange = (e) => {
    let count = parseInt(e.target.value, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 20) count = 20; 
    setSiblingsCount(count);
    
    setSiblingGenders(prev => {
      const next = [...prev];
      if (count > next.length) {
        for (let i = next.length; i < count; i++) next.push('不明');
      } else {
        next.length = count;
      }
      return next;
    });

    if (birthOrder > count) setBirthOrder(count);
  };

  const handleSiblingGenderChange = (idx, value) => {
    const newGenders = [...siblingGenders];
    newGenders[idx] = value;
    setSiblingGenders(newGenders);
  };

  const submitProfile = async () => {
    setMySubmission(true);
    const filteredOpinions = opinions.filter(op => op.relation.trim() !== '' && op.opinion.trim() !== '');
    
    // Merge close sibling details if applicable
    const profile = { 
      name: playerName, bloodType, mbti, siblingsCount, siblingGenders, birthOrder, 
      hasCloseSibling, 
      ...(hasCloseSibling ? { closeSiblingRank, closeSiblingReason } : {}),
      zodiac, opinions: filteredOpinions 
    };

    try {
      await fetch(`${API_URL}/api/ai/submit_compatibility_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, socketId: socket.id, profile })
      });
    } catch (error) {
       console.error(error);
       setMySubmission(false);
    }
  };

  const spinRoulette = () => {
    const allPairs = [];
    for (let i = 0; i < players.length; i++) {
       for (let j = i + 1; j < players.length; j++) {
         allPairs.push([players[i].id, players[j].id]);
       }
    }
    const availablePairs = allPairs.filter(pair => {
       const pairStr = [pair[0], pair[1]].sort().join('_');
       return !gameData.evaluatedPairs.includes(pairStr);
    });

    if (availablePairs.length === 0) {
       alert(players.length < 2 ? "最低2人以上の参加者が必要です。" : "すべての組み合わせの診断が完了しました！");
       return;
    }

    const selectedPair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
    const pairStr = [selectedPair[0], selectedPair[1]].sort().join('_');

    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { ...gameData, phase: 'roulette_spinning', currentPair: selectedPair, evaluatedPairs: [...gameData.evaluatedPairs, pairStr] }
      }
    });
  };

  const analyzePair = async (pairIds) => {
    socket.emit('update_game_state', { roomId, payload: { gameData: { ...gameData, phase: 'analyzing_pair' } } });
    
    try {
      const p1 = gameData.results[pairIds[0]];
      const p2 = gameData.results[pairIds[1]];
      
      const response = await fetch(`${API_URL}/api/ai/compatibility_pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles: [p1, p2] })
      });
      const aiContext = await response.json();
      const messageText = aiContext.content[0].text;
      
      let parsed = { theme: '謎の二人', compatibility: 0, details: messageText };
      try { parsed = JSON.parse(messageText); } catch(e) {}

      socket.emit('update_game_state', {
        roomId,
        payload: { gameData: { ...gameData, phase: 'reveal_pair', pairAnalysis: parsed } }
      });
    } catch (e) {
      console.error(e);
      socket.emit('update_game_state', {
        roomId,
        payload: { gameData: { ...gameData, phase: 'reveal_pair', pairAnalysis: { theme: '通信エラー', compatibility: 0, details: '通信またはAIエラーが発生しました。' } } }
      });
    }
  };

  const requestGroupDiagnosis = async () => {
    const finalPrompt = selectedPreset === '自由入力' ? additionalPrompt : selectedPreset;
    if (!finalPrompt) return;
    
    setIsAdditionalLoading(true);
    try {
      await fetch(`${API_URL}/api/ai/compatibility_additional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, prompt: finalPrompt })
      });
    } catch(e) { console.error(e); }
    setIsAdditionalLoading(false);
  };

  if (gameData.phase === 'setup') {
    return <div className="card center-content"><p>ゲームを準備中...</p></div>;
  }

  if (gameData.phase === 'input') {
    const answeredCount = Object.keys(gameData.results || {}).length;

    if (mySubmission) {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>他のプレイヤーの回答を待っています...</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
            {room.players.length - answeredCount}人 待ち
          </div>
          <div className="loader" style={{ marginTop: '2rem', marginBottom: '3rem' }}></div>
          <div style={{ padding: '2rem', backgroundColor: '#f5f7fa', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: 'var(--gray-dark)' }}>＼ 毎回入力するのが面倒な方へ ／</p>
            <a href="/register" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none', backgroundColor: '#FB8C00' }}>
              会員登録して次回の入力を自動化する ✨
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="card animate-pop">
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center', marginBottom: '1.5rem' }}>AI グループ相性診断</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          
          <div className="input-group">
            <label className="input-label">血液型</label>
            <select className="input-field" value={bloodType} onChange={e => setBloodType(e.target.value)}>
              {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">MBTI</label>
            <select className="input-field" value={mbti} onChange={e => setMbti(e.target.value)}>
              {MBTI_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">星座</label>
            <select className="input-field" value={zodiac} onChange={e => setZodiac(e.target.value)}>
              {ZODIACS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--light)', borderRadius: 'var(--radius-md)' }}>
          <label className="input-label" style={{ borderBottom: '1px solid var(--gray-light)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>兄弟構成</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>自分を含めた兄弟の合計人数</label>
              <input type="number" min="1" max="20" className="input-field" value={siblingsCount} onChange={handleSiblingsCountChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>自分は上から何番目？</label>
              <select className="input-field" value={birthOrder} onChange={e => setBirthOrder(Number(e.target.value))}>
                {Array.from({ length: siblingsCount }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}番目</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>兄弟それぞれの性別 (上から順に)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
              {siblingGenders.map((gender, idx) => {
                const isMe = (idx + 1) === birthOrder;
                return (
                  <div key={idx} style={{ padding: '0.5rem', backgroundColor: isMe ? 'rgba(0,166,153,0.1)' : '#fff', border: isMe ? '2px solid var(--primary)' : '1px solid var(--gray-light)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: isMe ? 'bold' : 'normal', color: isMe ? 'var(--primary)' : 'var(--gray-medium)' }}>
                      {idx + 1}番目 {isMe && '(自分)'}
                    </div>
                    <select className="input-field" style={{ marginBottom: 0, padding: '0.25rem' }} value={gender} onChange={e => handleSiblingGenderChange(idx, e.target.value)}>
                      {GENDER_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
          {siblingsCount > 1 && (
            <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--gray-light)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={hasCloseSibling} onChange={e => setHasCloseSibling(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem' }} />めちゃくちゃ仲が良い兄弟がいる
              </label>
              
              {hasCloseSibling && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem', color: 'var(--gray-medium)' }}>どの兄弟ですか？（上から何番目か）</label>
                    <select className="input-field" value={closeSiblingRank} onChange={e => setCloseSiblingRank(e.target.value)} style={{ width: '150px' }}>
                      {Array.from({ length: siblingsCount }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}番目</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem', color: 'var(--gray-medium)' }}>その兄弟と仲が良い理由（任意）</label>
                    <input 
                       className="input-field" 
                       placeholder="例: 趣味が同じでよく遊びに行くから" 
                       value={closeSiblingReason} 
                       onChange={e => setCloseSiblingReason(e.target.value)} 
                       style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--light)', borderRadius: 'var(--radius-md)' }}>
          <label className="input-label">他人からの評価（どういう関係の人に、どういう性格だと言われるか）</label>
          {opinions.map((op, idx) => (
            <div key={idx} style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', position: 'relative', border: '1px solid var(--gray-light)' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--gray-medium)', display: 'block', marginBottom: '0.25rem' }}>誰から言われるか（例：高校からの親友）</label>
                <input className="input-field" style={{ width: '100%', marginBottom: 0 }} placeholder="例: 職場の同期" value={op.relation} onChange={e => handleOpinionChange(idx, 'relation', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--gray-medium)', display: 'block', marginBottom: '0.25rem' }}>どういう性格だと言われるか</label>
                <textarea className="input-field" style={{ width: '100%', minHeight: '60px', marginBottom: 0 }} placeholder="例: 普段は静かだけど、話し出すと面白い" value={op.opinion} onChange={e => handleOpinionChange(idx, 'opinion', e.target.value)} />
              </div>
              {opinions.length > 1 && (
                <button className="btn btn-secondary" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.25rem 0.5rem', color: '#E53E3E', backgroundColor: '#FFebF0', border: 'none', width: 'auto' }} onClick={() => handleRemoveOpinion(idx)} title="削除">✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: 'white', color: 'var(--primary)' }} onClick={handleAddOpinion}>
            ＋ さらに評価を追加
          </button>
        </div>

        <button className="btn btn-primary" onClick={submitProfile}>診断へ進む</button>
      </div>
    );
  }

  if (gameData.phase === 'pair_selection') {
    return (
      <div className="card center-content animate-pop" style={{ minHeight: '50vh' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '1rem' }}>全員の入力が完了しました！</h2>
        <p style={{ color: 'var(--gray-medium)', marginBottom: '2rem' }}>ルーレットで2人組を選んで、相性を診断していきます。</p>
        
        {isHost ? (
           <button className="btn btn-primary" onClick={spinRoulette} style={{ fontSize: '1.25rem', padding: '1rem 3rem' }}>
             ルーレットを回す！ 🎯
           </button>
        ) : (
           <p style={{ fontWeight: 'bold' }}>ホストがルーレットを回すのを待っています...</p>
        )}
      </div>
    );
  }

  if (gameData.phase === 'roulette_spinning' || gameData.phase === 'analyzing_pair') {
    return (
      <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
        <h3 style={{ color: 'var(--gray-medium)', marginBottom: '2rem' }}>
          {gameData.phase === 'roulette_spinning' ? '運命のペアを選択中...' : 'AIが相性をディープに診断中...'}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', padding: '1.5rem', borderRadius: '12px', border: '4px solid var(--primary)', minWidth: '150px' }}>
            {spinNames[0]}
          </div>
          <div style={{ fontSize: '2rem', color: '#E53E3E', fontWeight: 'bold' }}>×</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', padding: '1.5rem', borderRadius: '12px', border: '4px solid var(--primary)', minWidth: '150px' }}>
            {spinNames[1]}
          </div>
        </div>

        {gameData.phase === 'analyzing_pair' && <div className="loader" style={{ marginTop: '2rem' }}></div>}
      </div>
    );
  }

  // phase === 'reveal_pair'
  const analysis = gameData.pairAnalysis || {};
  const playerA = players.find(p => p.id === gameData.currentPair[0])?.name || 'A';
  const playerB = players.find(p => p.id === gameData.currentPair[1])?.name || 'B';

  return (
    <div className="card animate-pop" style={{ padding: '1.5rem 1rem' }}>
      <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center', marginBottom: '1.5rem' }}>
        {playerA} × {playerB} AI相性診断結果
      </h3>

      <div style={{ backgroundColor: 'var(--light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', border: '4px solid #E53E3E', marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 800, color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>二人のテーマ</p>
        <h2 style={{ fontSize: '2rem', color: '#E53E3E', marginBottom: '1.5rem' }}>「{analysis.theme || '不明'}」</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontWeight: 800, color: 'var(--gray-medium)', fontSize: '0.875rem' }}>二人の相性度</p>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#00A699' }}>{analysis.compatibility || 0}%</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, lineHeight: '1.8' }}>
            <ReactMarkdown>{analysis.details || ''}</ReactMarkdown>
          </div>
        </div>
      </div>

      {gameData.additionalDiagnosis && (
        <div className="animate-pop" style={{ marginTop: '2.5rem', marginBottom: '1.5rem', border: '3px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#f0fffd' }}>
           <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 900 }}>グループ追加診断: {gameData.additionalDiagnosis.prompt}</h4>
           <div style={{ fontSize: '1rem', lineHeight: '1.8', color: 'var(--gray-dark)' }}>
             <ReactMarkdown>{gameData.additionalDiagnosis.result}</ReactMarkdown>
           </div>
        </div>
      )}

      {isHost && (
        <>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--light)', borderRadius: '8px', border: '1px dashed var(--gray-medium)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
           <h4 style={{ margin: 0 }}>グループ全員への追加診断</h4>
           <div style={{ width: '100%', maxWidth: '500px' }}>
              <select className="input-field" value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)} style={{ marginBottom: selectedPreset === '自由入力' ? '1rem' : '0' }}>
                 {ADDITIONAL_DIAGNOSIS_PRESETS.map((preset, idx) => <option key={idx} value={preset}>{preset}</option>)}
              </select>
              {selectedPreset === '自由入力' && (
                 <input className="input-field" value={additionalPrompt} onChange={e => setAdditionalPrompt(e.target.value)} placeholder="自由にプロンプトを入力してください" style={{ marginBottom: 0 }} />
              )}
           </div>
           <button className="btn btn-primary" style={{ width: '100%', maxWidth: '500px' }} onClick={requestGroupDiagnosis} disabled={isAdditionalLoading || (selectedPreset === '自由入力' && !additionalPrompt)}>
              {isAdditionalLoading ? 'AI考え中...' : 'グループ全体を診断する'}
           </button>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={spinRoulette}>
            次のペアを診断する 🎯
          </button>
          <button className="btn btn-secondary" onClick={() => {
            socket.emit('update_game_state', { roomId, payload: { status: 'lobby', game: null } });
          }}>
            別のゲームを選ぶ
          </button>
        </div>
        </>
      )}
    </div>
  );
}

export default AICompatibility;

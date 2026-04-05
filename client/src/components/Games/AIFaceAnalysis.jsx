import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, "");

const FACE_PROMPTS = [
  '社長になりそうな人',
  '絶対に秘密は守らない裏切り者',
  '休日はずっと寝てそうな人',
  '実は裏で世界を牛耳っている黒幕',
  '初対面でめちゃくちゃ良い人そうだけど、後で面倒くさい人',
  '何を聞いても「へぇー」としか言わない興味ない人',
  '飲み会で一番最後まで残って語り続ける人'
];

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

function AIFaceAnalysis({ socket, room, isHost, playerName, roomId }) {
  const [photoTaken, setPhotoTaken] = useState(false);
  const [mySubmission, setMySubmission] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [useCamera, setUseCamera] = useState(true);
  
  const [selectedPreset, setSelectedPreset] = useState(ADDITIONAL_DIAGNOSIS_PRESETS[0]);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isAdditionalLoading, setIsAdditionalLoading] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  const gameData = room.state.gameData || { phase: 'setup', prompt: '', results: [], additionalDiagnosis: null };

  useEffect(() => {
    if (gameData.phase === 'input') {
      setMySubmission(false);
      setPhotoTaken(false);
      setImageData(null);
    }
  }, [gameData.phase, gameData.prompt]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (gameData.phase === 'input' && !photoTaken && useCamera) {
      startCamera();
    }
    return () => stopCamera();
  }, [gameData.phase, photoTaken, useCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (video.videoWidth && video.videoHeight) {
         const scale = Math.min(600 / video.videoWidth, 600 / video.videoHeight, 1);
         canvas.width = video.videoWidth * scale;
         canvas.height = video.videoHeight * scale;
         context.drawImage(video, 0, 0, canvas.width, canvas.height);
         const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
         setImageData(dataUrl);
         setPhotoTaken(true);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result);
        setPhotoTaken(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const setupGame = () => {
    const randomPrompt = FACE_PROMPTS[Math.floor(Math.random() * FACE_PROMPTS.length)];
    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { prompt: randomPrompt, results: [], phase: 'input', additionalDiagnosis: null }
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
    try {
      await fetch(`${API_URL}/api/ai/submit_face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, socketId: socket.id, playerName, imageData, promptId: gameData.prompt, persona: room.state.persona || 'michael' })
      });
    } catch (e) {
      console.error(e);
      setMySubmission(false);
      alert('AI通信エラー');
    }
  };

  const requestAdditionalDiagnosis = async () => {
    const finalPrompt = selectedPreset === '自由入力' ? additionalPrompt : selectedPreset;
    if (!finalPrompt) return;
    
    setIsAdditionalLoading(true);
    try {
      await fetch(`${API_URL}/api/ai/face_additional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, prompt: finalPrompt, persona: room.state.persona || 'michael' })
      });
    } catch(e) { console.error(e); }
    setIsAdditionalLoading(false);
  };

  const downloadImageResult = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, { useCORS: true, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = 'face_analysis_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Image generation failed", e);
    }
  }

  const resetGame = () => setupGame();

  if (gameData.phase === 'setup') {
    return <div className="card center-content"><p>ゲームを準備中...</p></div>;
  }

  if (gameData.phase === 'input') {
    const waitingList = room.players.map(p => {
      const resultObj = Array.isArray(gameData.results) ? gameData.results.find(r => r.id === p.id) : null;
      let status = <span style={{ color: 'var(--gray-medium)' }}>📷 撮影待ち</span>;
      if (resultObj) {
        if (resultObj.status === 'done') status = <span style={{ color: '#00A699', fontWeight: 'bold' }}>✅ 診断完了</span>;
        else status = <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>⏳ AI診断中...</span>;
      }
      return { ...p, statusNode: status };
    });

    if (mySubmission) {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>AIが人相を診断中...</h2>
          
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginTop: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ color: 'var(--gray-medium)', marginBottom: '1rem', borderBottom: '1px solid var(--gray-light)', paddingBottom: '0.5rem' }}>プレイヤー進行状況</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {waitingList.map((p, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                  <strong>{p.name}</strong> {p.statusNode}
                </li>
              ))}
            </ul>
          </div>
          <div className="loader" style={{ marginTop: '2.5rem' }}></div>
        </div>
      );
    }

    return (
      <div className="card center-content animate-pop">
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center' }}>AI 人相診断ゲーム</h3>
        
        <div style={{ margin: '1.5rem 0', padding: '1.5rem', backgroundColor: 'var(--light)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontWeight: 'bold', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>以下のお題の顔をして、AIに人相判定させろ！</p>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary)', textAlign: 'center' }}>
            「{gameData.prompt}」
          </h2>
        </div>

        {!photoTaken ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-light)', width: '100%', maxWidth: '400px' }}>
              <div 
                onClick={() => setUseCamera(true)}
                style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: useCamera ? '3px solid var(--primary)' : 'none', color: useCamera ? 'var(--primary)' : 'var(--gray-medium)', transition: 'all 0.2s' }}
              >
                🎥 カメラで撮影
              </div>
              <div 
                onClick={() => setUseCamera(false)}
                style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: !useCamera ? '3px solid var(--primary)' : 'none', color: !useCamera ? 'var(--primary)' : 'var(--gray-medium)', transition: 'all 0.2s' }}
              >
                📁 画像アップロード
              </div>
            </div>

            {useCamera ? (
              <>
                <div style={{ position: 'relative', width: '300px', height: '300px', backgroundColor: '#333', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                </div>
                <button 
                  className="btn btn-primary"
                  style={{ padding: '0', borderRadius: '50%', width: '80px', height: '80px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  onClick={capturePhoto}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </button>
              </>
            ) : (
              <div style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                <button className="btn btn-primary" onClick={() => fileInputRef.current.click()} style={{ padding: '1rem 2rem' }}>画像を選択する</button>
                <p style={{ color: 'var(--gray-medium)', fontSize: '0.875rem' }}>顔がはっきりと写っている画像を選んでください。</p>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        ) : (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: '#00A699' }}>いい顔ですね！</h3>
            {imageData && (
               <div style={{ width: '200px', height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <img src={imageData} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: useCamera ? 'scaleX(-1)' : 'none' }} />
               </div>
            )}
            <button className="btn btn-primary" onClick={submitPhoto}>AIに診断させる</button>
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setPhotoTaken(false); setImageData(null); }}>撮り直す</button>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '500px', margin: '2rem auto 0', padding: '1rem', backgroundColor: 'var(--white)', borderRadius: '8px', border: '1px solid var(--gray-light)' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>現在の進行状況:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
            {waitingList.map((p, i) => <div key={i}><strong>{p.name}</strong>: {p.statusNode}</div>)}
          </div>
        </div>
      </div>
    );
  }

  const safeResultsArray = Array.isArray(gameData.results) ? gameData.results : Object.values(gameData.results || {});
  
  return (
    <div className="card animate-pop" style={{ padding: '2rem 1rem' }}>
      <div ref={resultRef} style={{ padding: '1rem', backgroundColor: 'var(--white)', borderRadius: '8px' }}>
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center', marginBottom: '1.5rem' }}>
          【お題: {gameData.prompt}】 AI人相診断結果
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {safeResultsArray.map((res, i) => (
            <div key={i} style={{ backgroundColor: res.is_war_criminal ? '#FFF5F5' : 'var(--light)', borderRadius: 'var(--radius-md)', border: res.is_war_criminal ? '2px solid #FED7D7' : '2px solid var(--gray-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
              
              {res.is_war_criminal && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#E53E3E', color: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 900, fontSize: '1.2rem', transform: 'rotate(15deg)', zIndex: 10, boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                  💀お題はき違え戦犯！
                </div>
              )}

              <div style={{ width: '100%', height: '220px', backgroundColor: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={res.imageData} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="face" />
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--gray-dark)' }}>{res.name} の人相診断</div>
                
                {/* 診断名 */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', borderBottom: '3px solid var(--primary)', paddingBottom: '0.2rem' }}>
                    {res.diagnosis || "診断不可"}
                  </span>
                </div>
                
                {/* AIの真面目な診断結果 */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>💡プロ診断士によるガチの人相分析</p>
                  <div className="markdown-body">
                    <ReactMarkdown>{res.professional_comment || res.comment || '解析エラー'}</ReactMarkdown>
                  </div>
                </div>

                {/* お題に対するAIのツッコミ */}
                {res.roast_comment && (
                  <div style={{ padding: '1rem', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px dashed #E53E3E' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#E53E3E', margin: '0 0 0.5rem 0' }}>🔥お題に対してのツッコミ</p>
                    <div className="markdown-body">
                      <ReactMarkdown>{res.roast_comment}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {gameData.additionalDiagnosis && (
          <div className="animate-pop" style={{ marginTop: '2.5rem', border: '3px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#f0fffd' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 900 }}>
              追加診断: {gameData.additionalDiagnosis.prompt}
            </h4>
            <div className="markdown-body">
              <ReactMarkdown>{gameData.additionalDiagnosis.result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
         <button className="btn btn-secondary" onClick={downloadImageResult}>画像をローカルに保存する 💾</button>
      </div>

      <hr style={{ margin: '2rem 0', borderColor: 'var(--gray-light)' }}/>

      {isHost && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', backgroundColor: 'var(--light)', borderRadius: '8px', border: '1px dashed var(--gray-medium)' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>グループへの追加診断</label>
            <select 
              className="input-field"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              style={{ marginBottom: selectedPreset === '自由入力' ? '1rem' : '1.5rem' }}
            >
              {ADDITIONAL_DIAGNOSIS_PRESETS.map((preset, idx) => (
                <option key={idx} value={preset}>{preset}</option>
              ))}
            </select>
            
            {selectedPreset === '自由入力' && (
              <input 
                className="input-field" 
                value={additionalPrompt} 
                onChange={e => setAdditionalPrompt(e.target.value)}
                placeholder="自由にプロンプトを入力してください"
                style={{ marginBottom: '1.5rem' }}
              />
            )}
            
            <button 
              className="btn btn-primary" 
              onClick={requestAdditionalDiagnosis} 
              disabled={isAdditionalLoading || (selectedPreset === '自由入力' && !additionalPrompt)}
            >
              {isAdditionalLoading ? 'AI考え中...' : '追加診断をリクエスト'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={resetGame}>次のお題へ (画像は破棄されます)</button>
            <button className="btn btn-secondary" onClick={() => socket.emit('update_game_state', { roomId, payload: { status: 'lobby', game: null } })}>別のゲームを選ぶ</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIFaceAnalysis;

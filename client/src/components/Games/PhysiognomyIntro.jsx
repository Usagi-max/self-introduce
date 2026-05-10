import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import { Camera, CheckCircle, Hourglass, FolderOpen, Save, Lightbulb } from 'lucide-react';
import ProfileModal from '../ProfileModal';
import { useAd } from '../../contexts/AdContext';
import { AD_CONFIG } from '../../config/adConfig';

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, "");

const PERSONA_PHRASES = {
  michael: {
    intro: "ヘイみんな！まずは自己紹介の前に、お前らのツラ構えをAIに診断させてもらうぜ！最高のスマイルをカメラに向けてくれよな！",
    reveal: "出たぜ結果が！このAIのガチ診断を踏まえて、合ってる部分はドヤ顔で、違ってる部分は笑い飛ばしながら、順番に自己紹介してくれよな！さあ、誰から行く！？"
  },
  butler: {
    intro: "皆様、自己紹介を始める前に、まずは皆様の『お顔立ち』から深層心理を紐解かせていただきます。どうぞ、カメラの前に立っていただけますでしょうか。",
    reveal: "さて、診断結果が出揃ったようでございます。こちらの結果を踏まえまして……図星であれば素直にお認めいただき、万が一的外れであれば優雅に訂正しつつ、皆様に自己紹介をしていただきたく存じます。（笑いをこらえる顔）"
  },
  gal: {
    intro: "やっほー！自己紹介の前に、とりあえずうちらの人相診断しちゃお！カメラ向いて一番いい顔つくってこ！",
    reveal: "結果出たんだけどマジウケるｗ この結果見ながら自己紹介してこ！「ここ当たってるー！」とか「これはマジないわー」とかツッコミながらよろしくっしょ！"
  },
  onee: {
    intro: "ちょっとアンタたち！自己紹介の前に、まずはアンタたちのツラ構えを丸裸にしてあげるわ♡ さぁ、カメラに向かってイイ顔しなさいな！",
    reveal: "アラヤダ、面白い結果が出たじゃない♡ さぁ、このガチ診断を見ながら自己紹介してもらうわよ！当たってるところは認めて、違ってるところは全力で否定しながら、アンタの魅力をアピールしなさいな♡"
  }
};

export default function PhysiognomyIntro({ socket, room, isHost, playerName, roomId }) {
  const [photoTaken, setPhotoTaken] = useState(false);
  const [mySubmission, setMySubmission] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [useCamera, setUseCamera] = useState(true);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState(null);
  const { showAd } = useAd();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  const gameData = room.state.gameData || { phase: 'setup', results: [] };
  const persona = room.state.persona || 'michael';
  const phrases = PERSONA_PHRASES[persona];

  useEffect(() => {
    let stream = null;
    if (useCamera && !photoTaken && gameData.phase === 'input') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera error:", err);
          setUseCamera(false);
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [useCamera, photoTaken, gameData.phase]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setImageData(canvas.toDataURL('image/jpeg', 0.8));
      setPhotoTaken(true);
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
    socket.emit('update_game_state', {
      roomId,
      payload: {
        gameData: { results: [], phase: 'input' }
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
    const shouldShowAd = AD_CONFIG.enableVideoAd && (Math.random() < AD_CONFIG.videoAdProbability);

    const apiPromise = fetch(`${API_URL}/api/ai/submit_physiognomy_intro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, socketId: socket.id, playerName, imageData, persona, adShown: shouldShowAd })
    });

    if (shouldShowAd) {
      try {
        await showAd();
      } catch (e) {
        console.error("Ad error", e);
      }
    }

    try {
      await apiPromise;
    } catch (e) {
      console.error(e);
      setMySubmission(false);
      alert('AI通信エラー');
    }
  };

  const downloadImageResult = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, { useCORS: true, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = 'physiognomy_intro_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Image generation failed", e);
    }
  }

  if (gameData.phase === 'setup') {
    return <div className="card center-content"><p>準備中...</p></div>;
  }

  if (gameData.phase === 'input') {
    const waitingList = room.players.map(p => {
      const resultObj = Array.isArray(gameData.results) ? gameData.results.find(r => r.id === p.id) : null;
      let status = <span style={{ color: 'var(--gray-medium)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Camera size={14} /> 撮影待ち</span>;
      if (resultObj) {
        if (resultObj.status === 'done') status = <span style={{ color: '#00A699', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> 診断完了</span>;
        else status = <span style={{ color: '#E53E3E', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Hourglass size={14} /> AI診断中...</span>;
      }
      return { ...p, statusNode: status };
    });

    if (mySubmission) {
      return (
        <div className="card center-content animate-pop" style={{ minHeight: '60vh' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>AIが人相をガチ診断中...</h2>
          
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginTop: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ color: 'var(--gray-medium)', marginBottom: '1rem', borderBottom: '1px solid var(--gray-light)', paddingBottom: '0.5rem' }}>プレイヤー進行状況</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {waitingList.map((p, i) => (
                <li 
                  key={i} 
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.1rem', cursor: 'pointer', backgroundColor: 'var(--light)', padding: '0.5rem 1rem', borderRadius: '8px', transition: 'all 0.2s' }}
                  onClick={() => setSelectedProfilePlayer(p)}
                  title="プロフィールを見る"
                >
                  <strong>{p.name}</strong> {p.statusNode}
                </li>
              ))}
            </ul>
          </div>
          <div className="loader" style={{ marginTop: '2.5rem' }}></div>
          
          <ProfileModal 
            isOpen={selectedProfilePlayer !== null} 
            onClose={() => setSelectedProfilePlayer(null)} 
            player={selectedProfilePlayer} 
          />
        </div>
      );
    }

    return (
      <div className="card center-content animate-pop">
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center' }}>人相診断自己紹介ゲーム</h3>
        
        <div className="animate-pop" style={{ padding: '1.5rem', backgroundColor: '#fff5f5', borderRadius: '8px', border: '2px dashed var(--primary)', margin: '1.5rem 0' }}>
           <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0, textAlign: 'center' }}>
             「{phrases.intro}」
           </p>
        </div>

        {!photoTaken ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-light)', width: '100%', maxWidth: '400px' }}>
              <div 
                onClick={() => setUseCamera(true)}
                style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: useCamera ? '3px solid var(--primary)' : 'none', color: useCamera ? 'var(--primary)' : 'var(--gray-medium)', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <Camera size={18} /> カメラで撮影
              </div>
              <div 
                onClick={() => setUseCamera(false)}
                style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: !useCamera ? '3px solid var(--primary)' : 'none', color: !useCamera ? 'var(--primary)' : 'var(--gray-medium)', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <FolderOpen size={18} /> 画像アップロード
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
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        ) : (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
      
      <div className="animate-pop" style={{ padding: '1.5rem', backgroundColor: '#fff5f5', borderRadius: '8px', border: '2px dashed var(--primary)', marginBottom: '2rem' }}>
         <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0, textAlign: 'center' }}>
           「{phrases.reveal}」
         </p>
      </div>

      <div ref={resultRef} style={{ padding: '1rem', backgroundColor: 'var(--white)', borderRadius: '8px' }}>
        <h3 style={{ color: 'var(--gray-medium)', textAlign: 'center', marginBottom: '1.5rem' }}>
          AI人相診断結果
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {safeResultsArray.map((res, i) => (
            <div key={i} style={{ backgroundColor: 'var(--light)', borderRadius: 'var(--radius-md)', border: '2px solid var(--gray-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
              <div style={{ width: '100%', height: '220px', backgroundColor: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={res.imageData} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="face" />
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--gray-dark)' }}>{res.name} の人相診断</div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', borderBottom: '3px solid var(--primary)', paddingBottom: '0.2rem' }}>
                    {res.diagnosis || "診断不可"}
                  </span>
                </div>
                
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Lightbulb size={14} /> プロの診断</p>
                  <div className="markdown-body">
                    <ReactMarkdown>{res.professional_comment || res.comment || '解析エラー'}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
         <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={downloadImageResult}><Save size={16} /> 画像をローカルに保存する</button>
      </div>

      <hr style={{ margin: '2rem 0', borderColor: 'var(--gray-light)' }}/>

      {isHost && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => socket.emit('update_game_state', { roomId, payload: { status: 'lobby', game: null } })}>自己紹介が終わったら別のゲームへ</button>
        </div>
      )}
    </div>
  );
}

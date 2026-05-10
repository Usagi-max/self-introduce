import React, { useEffect, useRef, useState } from 'react';
import { AD_CONFIG } from '../config/adConfig';

const VideoAdModal = ({ onComplete, onError }) => {
  const videoRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(Math.floor(AD_CONFIG.adDurationMs / 1000));
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoSrc, setVideoSrc] = useState('');

  useEffect(() => {
    // ランダムな動画を選択
    const randomVideo = AD_CONFIG.adVideos[Math.floor(Math.random() * AD_CONFIG.adVideos.length)];
    setVideoSrc(randomVideo);
  }, []);

  useEffect(() => {
    if (!isVideoLoading) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVideoLoading, onComplete]);

  const handleCanPlay = () => {
    setIsVideoLoading(false);
  };

  const handleError = () => {
    console.error("Ad video failed to load");
    onError();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', color: '#fff'
    }}>
      
      {/* 動画エリア */}
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            onCanPlay={handleCanPlay}
            onError={handleError}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        )}
      </div>

      {/* オーバーレイUI */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* ヘッダー部分 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="loader" style={{ width: '20px', height: '20px', borderTopColor: 'var(--primary)' }}></div>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>AI高度解析中...</span>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            リワード広告まで あと {timeLeft}秒
          </div>
        </div>

        {/* フッター部分 */}
        <div style={{ padding: '2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>スポンサー動画を読み込み中...</p>
          <p style={{ color: '#00A699', fontWeight: 'bold' }}>広告視聴でAIシステムをサポート！</p>
        </div>
      </div>
      
    </div>
  );
};

export default VideoAdModal;

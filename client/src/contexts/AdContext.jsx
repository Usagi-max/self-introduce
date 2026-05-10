import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import VideoAdModal from '../components/VideoAdModal';

const AdContext = createContext(null);

export const useAd = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAd must be used within an AdProvider');
  }
  return context;
};

export const AdProvider = ({ children }) => {
  const [isAdVisible, setIsAdVisible] = useState(false);
  const resolvePromiseRef = useRef(null);
  
  const showAd = useCallback(() => {
    return new Promise((resolve) => {
      // 広告開始をセッションに記録（簡易的な不正対策）
      sessionStorage.setItem('ad_status', 'started');
      sessionStorage.setItem('ad_start_time', Date.now().toString());
      
      resolvePromiseRef.current = resolve;
      setIsAdVisible(true);
    });
  }, []);

  const handleAdComplete = useCallback(() => {
    setIsAdVisible(false);
    sessionStorage.setItem('ad_status', 'completed');
    if (resolvePromiseRef.current) {
      resolvePromiseRef.current();
      resolvePromiseRef.current = null;
    }
  }, []);

  const handleAdError = useCallback(() => {
    // 動画エラー時もとりあえず完了扱いにしてUXをブロックしない
    setIsAdVisible(false);
    sessionStorage.setItem('ad_status', 'error_skipped');
    if (resolvePromiseRef.current) {
      resolvePromiseRef.current();
      resolvePromiseRef.current = null;
    }
  }, []);

  return (
    <AdContext.Provider value={{ showAd, isAdVisible }}>
      {children}
      {isAdVisible && (
        <VideoAdModal 
          onComplete={handleAdComplete} 
          onError={handleAdError} 
        />
      )}
    </AdContext.Provider>
  );
};

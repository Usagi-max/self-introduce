import React, { useEffect } from 'react';
import { AD_CONFIG } from '../config/adConfig';

const BannerAd = () => {
  useEffect(() => {
    if (!AD_CONFIG.enableBannerAd) return;
    try {
      // Adsenseスクリプトが読み込まれていれば実行
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  if (!AD_CONFIG.enableBannerAd) {
    return null;
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '1rem 0', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '320px', height: '50px', backgroundColor: '#f0f0f0', textAlign: 'center', lineHeight: '50px', color: '#999', fontSize: '0.8rem' }}
        data-ad-client="ca-pub-3723393984380742"
        data-ad-slot="1234567890" // 本番用のslot IDに後で変更
        data-ad-format="auto"
        data-full-width-responsive="true"
      >
        スポンサー
      </ins>
    </div>
  );
};

export default BannerAd;

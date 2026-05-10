export const AD_CONFIG = {
  // 動画広告（AI待機中）を有効にするか
  enableVideoAd: true,
  
  // バナー広告（画面下部）を有効にするか
  enableBannerAd: true,
  
  // 動画広告が表示される確率 (0.0 〜 1.0)
  videoAdProbability: 0.25,
  
  // 動画広告のスキップ不可時間 (ミリ秒)
  adDurationMs: 15000,
  
  // 再生する動画ファイルのパスリスト
  adVideos: ['/ads/ad1.mp4']
};

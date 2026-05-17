import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Dices, MessageCircle, Bot } from 'lucide-react';
import BannerAd from './BannerAd';

function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>遊び方・使い方</h1>
      <p style={{ textAlign: 'center', color: 'var(--gray-dark)', marginBottom: '2rem' }}>
        「アイブレ」に搭載されている各ゲームの特徴と遊び方をご紹介します。
      </p>

      <section style={{ marginBottom: '3rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Dices size={24} /> ルーレット
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <img 
            src="file:///C:/Users/User/.gemini/antigravity/brain/4a5cfbf9-7b25-468a-ab22-e8d4142d9f01/screenshot_roulette_1778999088943.png" 
            alt="ルーレットのゲーム画面" 
            style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', margin: '0 auto', display: 'block', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
          />
          <div>
            <p style={{ lineHeight: '1.6', color: 'var(--gray-dark)' }}>
              定番のルーレットゲームです。参加者の名前や、罰ゲーム、トークテーマなど自由に項目を設定してルーレットを回すことができます。
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--gray-dark)', lineHeight: '1.6' }}>
              <li><strong>遊び方:</strong> ホストがルーレットの項目を設定し、「回す」ボタンを押すだけ。結果は参加者全員の画面にリアルタイムで共有されます。</li>
              <li><strong>おすすめの使い方:</strong> 次に話す人を決める時や、自己紹介のお題を決める時に大活躍！</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Unanimous Game */}
      <section style={{ marginBottom: '3rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle size={24} /> 満場一致ゲーム
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <img 
            src="file:///C:/Users/User/.gemini/antigravity/brain/4a5cfbf9-7b25-468a-ab22-e8d4142d9f01/screenshot_unanimous_1778999112059.png" 
            alt="満場一致ゲームの画面" 
            style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', margin: '0 auto', display: 'block', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
          />
          <div>
            <p style={{ lineHeight: '1.6', color: 'var(--gray-dark)' }}>
              お題に対して、全員の答えが揃うか挑戦するゲームです。「朝食といえば？」「一番強い動物は？」などのお題に各自が回答します。
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--gray-dark)', lineHeight: '1.6' }}>
              <li><strong>遊び方:</strong> お題に対して、各自が自分のスマホから回答を入力。全員が入力完了すると結果が一斉に表示されます。</li>
              <li><strong>おすすめの使い方:</strong> 価値観の違いを楽しんだり、意外な回答で盛り上がることができます。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI Compatibility */}
      <section style={{ marginBottom: '3rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={24} /> AI相性診断
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <img 
            src="file:///C:/Users/User/.gemini/antigravity/brain/4a5cfbf9-7b25-468a-ab22-e8d4142d9f01/screenshot_ai_compatibility_1778999378108.png" 
            alt="AI相性診断の画面" 
            style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', margin: '0 auto', display: 'block', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
          />
          <div>
            <p style={{ lineHeight: '1.6', color: 'var(--gray-dark)' }}>
              最新のAI技術を使って、参加者同士の相性を診断します。事前に登録したプロフィールや趣味をもとに、意外な共通点や相性の良さを見つけ出します。
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--gray-dark)', lineHeight: '1.6' }}>
              <li><strong>遊び方:</strong> 各自が簡単なプロフィールを入力。AIが自動的に分析し、マッチ度の高いペアやグループを発表します。</li>
              <li><strong>おすすめの使い方:</strong> 参加者同士の共通の話題を見つけたい時や、会話のキッカケ作りに最適です。</li>
            </ul>
          </div>
        </div>
      </section>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ホームへ戻る
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <BannerAd />
      </div>
    </div>
  );
}

export default HowToPlay;

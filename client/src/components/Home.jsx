import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Gamepad2, Sparkles, Building } from 'lucide-react';
import BannerAd from './BannerAd';

function Home({ onCreate, onJoin, isLoading }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState('choose'); // 'choose', 'create', 'join'
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const joinParam = searchParams.get('join');
    if (joinParam) {
      setMode('join');
      setRoomId(joinParam);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="container center-content animate-pop">
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>通信中...</h2>
        <div className="loader"></div>
      </div>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="container center-content animate-pop" style={{ padding: '2rem 1rem' }}>
        <img
          src="/アイブレ広報画像.png"
          alt="アイブレ広報画像"
          style={{ width: '100%', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />

        <div style={{ marginBottom: '2rem', color: 'var(--gray-dark)', lineHeight: '1.6', textAlign: 'left', backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '600px' }}>
          <p style={{ marginBottom: '1rem', fontWeight: 'bold', color: 'var(--dark)' }}>
            会話を自然に生み出す、新感覚アイスブレイクアプリ
          </p>
          <p style={{ marginBottom: '1rem' }}>
            <strong>「アイブレ」</strong>はAIを活用した相性診断や、話題を提供するルーレット、顔表情採点ゲームなどを通じて、初対面のコミュニケーションを自然に活性化させます。
          </p>
          <p style={{ marginBottom: '0' }}>
            また、初対面だけでなく、すでに仲の良い仲間内で集まった時にも大活躍！「満場一致ゲーム」で価値観のズレを楽しんだり、お互いの意外な一面を発見したりと、普段の飲み会や遊びの場をさらに盛り上げます。
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => setMode('create')}
            style={{ minWidth: '220px' }}
          >
            ルームを作る（ホスト）
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setMode('join')}
            style={{ minWidth: '220px' }}
          >
            ルームに参加する（ゲスト）
          </button>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '600px', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--secondary)', borderBottom: '2px solid var(--secondary)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} /> コンテンツ
          </h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '1rem' }}>
              <Link to="/how-to-play" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gamepad2 size={20} /> 各ゲームの遊び方・使い方
              </Link>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-dark)', marginTop: '0.3rem', lineHeight: '1.4' }}>ルーレット、満場一致ゲーム、AI相性診断などの実際の画面と遊び方をご紹介します。</p>
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <Link to="/scenes" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} /> シーン別おすすめの使い方
              </Link>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-dark)', marginTop: '0.3rem', lineHeight: '1.4' }}>サークル新歓、研修、マッチングアプリの初対面など、場面に合わせたおすすめゲームをご紹介します。</p>
            </li>
            <li>
              <Link to="/machicon" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={20} /> 【イベント運営者向け】街コンなどでの活用法
              </Link>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-dark)', marginTop: '0.3rem', lineHeight: '1.4' }}>街コンやイベント企画者の方へ、参加者の会話をサポートし満足度を高める方法をご紹介します。</p>
            </li>
          </ul>
        </div>

        <BannerAd />
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="container center-content animate-pop">
        <h2>ルーム作成</h2>
        <div className="input-group">
          <label className="input-label">あなたの名前</label>
          <input
            className="input-field"
            type="text"
            placeholder="例：たろう"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginBottom: '1rem' }}
          onClick={() => onCreate(name)}
          disabled={!name.trim()}
        >
          作成する
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setMode('choose')}
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="container center-content animate-pop">
      <h2>ルーム参加</h2>

      <div className="input-group">
        <label className="input-label">あなたの名前</label>
        <input
          className="input-field"
          type="text"
          placeholder="例：はなこ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label className="input-label">ルームID</label>
        <input
          className="input-field"
          type="text"
          placeholder="例：AB12CD"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      <button
        className="btn btn-primary"
        style={{ marginBottom: '1rem' }}
        onClick={() => onJoin(roomId.toUpperCase(), name)}
        disabled={!name.trim() || !roomId.trim()}
      >
        参加する
      </button>
      <button
        className="btn btn-secondary"
        onClick={() => setMode('choose')}
      >
        戻る
      </button>
    </div>
  );
}

export default Home;

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
      <div className="container center-content animate-pop">
        <h2>ようこそ！</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--gray-medium)' }}>
          自己紹介ゲームで場を盛り上げよう
        </p>
        
        <button 
          className="btn btn-primary" 
          style={{ marginBottom: '1rem' }}
          onClick={() => setMode('create')}
        >
          ルームを作る（ホスト）
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={() => setMode('join')}
        >
          ルームに参加する（ゲスト）
        </button>
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

import React, { useState } from 'react';

const DEFAULT_PRESETS = [
  { name: '🔰 定番', topics: ['出身地', '血液型', '好きな食べ物', 'マイブーム', '趣味', '休日の過ごし方'] },
  { name: '🍻 飲み会・合コン', topics: ['初恋の思い出', '最近のやらかし', '誰にも言えない秘密', 'フェチ', '一番のエピソード', '好きなタイプ'] },
  { name: '🏢 ビジネスアイスブレイク', topics: ['今年挑戦したいこと', '最近買った高いもの', '子供の頃の夢', '尊敬する人', '自分を動物に例えると', '最近の小さな幸せ'] }
];

const COMMON_TOPICS = [
  '長所と短所', '座右の銘', '好きな映画', 'もし100万円あったら', 'ストレス発散法', '今まで一番痛かったこと', '無人島に一つだけ持っていくなら', 'タイムトラベルできるならいつ？', 'ここだけの話'
];

export default function RouletteSetup({ socket, room, roomId }) {
  const currentTopics = room.state.rouletteTopics || [];
  const [isOpen, setIsOpen] = useState(false);
  const [tempTopics, setTempTopics] = useState(currentTopics);
  const [newTopicInput, setNewTopicInput] = useState('');

  // Sync when opening
  const handleOpen = () => {
    setTempTopics(room.state.rouletteTopics || []);
    setIsOpen(true);
  };

  const handleAddTopic = (topicText) => {
    const topic = typeof topicText === 'string' ? topicText : newTopicInput;
    if (topic.trim() !== '' && !tempTopics.includes(topic.trim())) {
      setTempTopics([...tempTopics, topic.trim()]);
    }
    setNewTopicInput('');
  };

  const handleRemoveTopic = (index) => {
    setTempTopics(tempTopics.filter((_, i) => i !== index));
  };

  const applyPreset = (presetTopics) => {
    setTempTopics(presetTopics);
  };

  const saveSettings = () => {
    if (tempTopics.length === 0) {
      alert('お題を1つ以上追加してください。');
      return;
    }
    socket.emit('update_game_state', {
      roomId,
      payload: { rouletteTopics: tempTopics }
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--light)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--dark)' }}>ルーレットのお題 ({currentTopics.length}件)</span>
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={handleOpen}>
            編集する
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {currentTopics.slice(0, 5).map((t, i) => (
            <span key={i} style={{ fontSize: '0.75rem', backgroundColor: 'var(--gray-light)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{t}</span>
          ))}
          {currentTopics.length > 5 && <span style={{ fontSize: '0.75rem', color: 'var(--gray-medium)' }}>...他</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--light)', padding: '1rem', borderRadius: 'var(--radius-md)', animation: 'slideUp 0.3s ease-out' }}>
      <h4 style={{ marginBottom: '1rem', color: 'var(--dark)' }}>ルーレットのカスタマイズ</h4>
      
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        {DEFAULT_PRESETS.map((preset, i) => (
          <button 
            key={i} 
            className="btn btn-secondary" 
            style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--white)' }}
            onClick={() => applyPreset(preset.topics)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="新しいお題を入力..." 
          value={newTopicInput}
          onChange={(e) => setNewTopicInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
          style={{ padding: '0.5rem', fontSize: '0.875rem' }}
        />
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleAddTopic}>追加</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>よく使われるお題（タップで追加）</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {COMMON_TOPICS.map((t, i) => (
            <button 
              key={i} 
              onClick={() => handleAddTopic(t)}
              disabled={tempTopics.includes(t)}
              style={{ 
                fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--gray-light)', 
                backgroundColor: tempTopics.includes(t) ? 'var(--gray-light)' : 'var(--white)',
                color: tempTopics.includes(t) ? 'var(--gray-medium)' : 'var(--dark)',
                cursor: tempTopics.includes(t) ? 'default' : 'pointer'
              }}
            >
              + {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
        {tempTopics.map((t, i) => (
          <div key={i} style={{ backgroundColor: 'var(--white)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid var(--gray-light)' }}>
            {t}
            <button onClick={() => handleRemoveTopic(i)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={saveSettings}>保存</button>
        <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => setIsOpen(false)}>キャンセル</button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Star, Beer, Building2, Plus, X, Save, Ban } from 'lucide-react';

const DEFAULT_PRESETS = [
  { icon: <Star size={14} />, name: '定番', topics: ['出身地のちょっと変わったところ', '自分と相性の良い血液型/MBTI', '好きな食べ物とお気に入りの店', '一番最近始めた趣味', '最近いいねした動画', '最近の小さな幸せ'] },
  { icon: <Beer size={14} />, name: '恋愛', topics: ['初恋の思い出', '最近付き合った人', '好きなタイプ・芸能人'] },
  { icon: <Building2 size={14} />, name: 'ビジネス', topics: ["今の仕事の楽しいところ/大変なところ", '今年挑戦したいこと', '最近買った高いもの', '子供の頃の夢', '尊敬する人', "100万円あったらやってみたいこと"] }
];

const COMMON_TOPICS = [
  '長所と短所', '好きな映画/アニメ/ドラマ', 'もし100万円あったら', 'ストレス発散法', 'タイムトラベルできるならいつ？'
];

export default function RouletteSetup({ socket, room, roomId, forceOpen, onSaved }) {
  const currentTopics = room.state.rouletteTopics || [];
  const [isOpen, setIsOpen] = useState(forceOpen || false);
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
    if (onSaved) onSaved();
  };

  if (!isOpen && !forceOpen) {
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
            style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => applyPreset(preset.topics)}
          >
            {preset.icon} {preset.name}
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
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={handleAddTopic}><Plus size={16} /> 追加</button>
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
                cursor: tempTopics.includes(t) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}
            >
              <Plus size={12} /> {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
        {tempTopics.map((t, i) => (
          <div key={i} style={{ backgroundColor: 'var(--white)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid var(--gray-light)' }}>
            {t}
            <button onClick={() => handleRemoveTopic(i)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={14} /></button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" style={{ padding: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }} onClick={saveSettings}><Save size={16} /> 保存</button>
        {!forceOpen && (
          <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }} onClick={() => setIsOpen(false)}><Ban size={16} /> キャンセル</button>
        )}
      </div>
    </div>
  );
}

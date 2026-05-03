import React from 'react';
import { X, User } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, player }) => {
  if (!isOpen || !player) return null;

  const profile = player.metadata?.compatibilityProfile;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
      <div 
        className="card animate-pop" 
        style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-medium)' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--gray-dark)' }}>
          <User size={24} />
          {player.name} のプロフィール
        </h3>

        {!profile ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--gray-medium)' }}>
            まだプロフィールが入力されていません。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '120px', backgroundColor: 'var(--light)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginBottom: '0.25rem' }}>血液型</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{profile.bloodType}</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', backgroundColor: 'var(--light)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginBottom: '0.25rem' }}>MBTI</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{profile.mbti}</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', backgroundColor: 'var(--light)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginBottom: '0.25rem' }}>星座</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{profile.zodiac}</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--light)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>兄弟構成</div>
              <div style={{ fontWeight: 'bold' }}>
                {profile.siblingsCount}人兄弟の {profile.birthOrder}番目
              </div>
              {profile.siblingGenders && profile.siblingGenders.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {profile.siblingGenders.map((g, i) => (
                    <span key={i} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', backgroundColor: '#fff', borderRadius: '4px', border: i + 1 === profile.birthOrder ? '2px solid var(--primary)' : '1px solid var(--gray-light)', fontWeight: i + 1 === profile.birthOrder ? 'bold' : 'normal', color: i + 1 === profile.birthOrder ? 'var(--primary)' : 'var(--gray-dark)' }}>
                      {i + 1}番目: {g} {i + 1 === profile.birthOrder && '(本人)'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {profile.opinions && profile.opinions.length > 0 && (
              <div style={{ backgroundColor: 'var(--light)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>他人からの評価</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {profile.opinions.map((op, idx) => (
                    <div key={idx} style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--gray-light)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>{op.relation} より</div>
                      <div>「{op.opinion}」</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;

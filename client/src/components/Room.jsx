import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import Roulette from './Games/Roulette';
import Unanimous from './Games/Unanimous';
import AICompatibility from './Games/AICompatibility';
import AIFaceAnalysis from './Games/AIFaceAnalysis';
import Penalty from './Penalty/Penalty';
import RouletteSetup from './Games/RouletteSetup';

const ProfileModal = ({ player, onClose }) => {
  if (!player || !player.metadata?.compatibilityProfile) return null;
  const p = player.metadata.compatibilityProfile;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>{p.name} のプロフィール</h3>
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.25rem 0.75rem' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          <p><strong>血液型:</strong> {p.bloodType}</p>
          <p><strong>星座:</strong> {p.zodiac}</p>
          <p><strong>MBTI:</strong> {p.mbti}</p>
          <p><strong>兄弟:</strong> {p.siblingsCount}人中 {p.birthOrder}番目</p>
        </div>
        {p.siblingGenders && p.siblingGenders.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>兄弟構成:</strong> {p.siblingGenders.join(' / ')}</p>
          </div>
        )}
        {p.hasCloseSibling && (
          <div style={{ marginBottom: '1rem', backgroundColor: '#f0fff4', padding: '0.5rem', borderRadius: '8px' }}>
            <p><strong>仲良しの兄弟:</strong> {p.closeSiblingRank}番目</p>
            {p.closeSiblingReason && <p style={{ fontSize: '0.875rem' }}>「{p.closeSiblingReason}」</p>}
          </div>
        )}
        {p.opinions && p.opinions.length > 0 && (
          <div>
            <p><strong>他人からの評価:</strong></p>
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              {p.opinions.map((op, i) => (
                <li key={i} style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--gray-medium)' }}>{op.relation}より:</span> {op.opinion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const TransferModal = ({ sourcePlayer, candidates, onTransfer, onClose }) => {
  const [targetId, setTargetId] = useState('');
  const [mode, setMode] = useState('overwrite');

  if (!sourcePlayer) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>データ引き継ぎ</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--gray-dark)' }}>
          <strong>{sourcePlayer.name}</strong> のデータを誰に引き継ぎますか？
        </p>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>引継ぎ先</label>
          <select className="input-field" value={targetId} onChange={e => setTargetId(e.target.value)}>
            <option value="">選択してください</option>
            {candidates.map(c => (
              <option key={c.sessionId} value={c.sessionId}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>引継ぎモード</label>
          <label style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="mode" value="overwrite" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} style={{ marginRight: '0.5rem' }} />
            完全上書き (プロフィール等のステータスも引き継ぐ)
          </label>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <input type="radio" name="mode" value="penalties_only" checked={mode === 'penalties_only'} onChange={() => setMode('penalties_only')} style={{ marginRight: '0.5rem' }} />
            戦犯回数のみ加算
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" disabled={!targetId} onClick={() => {
            if(window.confirm('本当に引き継ぎを実行しますか？')) {
              onTransfer(sourcePlayer.sessionId, targetId, mode);
              onClose();
            }
          }}>実行する</button>
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
};

function Room({ socket, room, isHost, playerName }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [mustSetup, setMustSetup] = useState(location.state?.isNew || false);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState(null);
  const [transferSourcePlayer, setTransferSourcePlayer] = useState(null);

  // If page refershed and context lost, return home
  useEffect(() => {
    if (!socket || !room) {
      if (roomId) navigate(`/?join=${roomId}`);
      else navigate('/');
    }
  }, [socket, room, navigate, roomId]);

  if (!socket || !room) return null;

  const joinUrl = `${window.location.origin}/room/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartGame = (gameName) => {
    socket.emit('start_game', { roomId, gameName });
  };

  const handleReturnToLobby = () => {
    socket.emit('update_game_state', { roomId, payload: { status: 'lobby', game: null } });
  };

  const handleLeaveRoom = () => {
    if (window.confirm('ルームから退出しますか？')) {
      socket.emit('leave_room', { roomId });
      sessionStorage.removeItem('savedRoomId');
      navigate('/');
    }
  };

  const executeTransfer = (sourceSessionId, targetSessionId, mode) => {
    socket.emit('transfer_player_data', { roomId, sourceSessionId, targetSessionId, mode });
  };

  // Lobby state
  if (room.state.status === 'lobby') {
    if (mustSetup && isHost) {
      return (
        <div className="container animate-slide-up">
          <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>🎉 ルーム作成成功！</h2>
            <p style={{ color: 'var(--dark)' }}>まずは、このルームで遊ぶ「お題」を決めましょう。</p>
          </div>
          <RouletteSetup socket={socket} room={room} roomId={roomId} forceOpen={true} onSaved={() => setMustSetup(false)} />
        </div>
      );
    }

    return (
      <div className="container animate-slide-up">
        
        {/* QR Code and Room Sharing Card */}
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--gray-medium)', margin: 0 }}>ルームの共有</h2>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'transparent', color: 'var(--gray-medium)', border: '1px solid var(--gray-light)' }} 
              onClick={handleLeaveRoom}
            >
              退出する
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'white', border: '1px solid var(--gray-light)', borderRadius: '8px' }}>
              <QRCodeCanvas value={joinUrl} size={150} level={"H"} />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-medium)', marginBottom: '0.5rem' }}>招待リンク</p>
            <div 
              style={{
                fontSize: '1rem', 
                fontWeight: 600, 
                color: 'var(--primary)',
                wordBreak: 'break-all',
                marginBottom: '1rem',
                cursor: 'pointer'
              }}
              onClick={handleCopyLink}
            >
              {joinUrl}
            </div>
            <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={handleCopyLink}>
              {copiedLink ? '✓ コピーしました' : 'リンクをコピーする'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-medium)', marginTop: '0.5rem' }}>
              直接ルームIDを入力: <span style={{fontWeight: 'bold', letterSpacing: '2px'}}>{roomId}</span>
            </p>
          </div>
        </div>

        {/* Global Scoreboard / War Criminal Ranking */}
        {room.players.some(p => {
          const bg = p.metadata?.penaltiesByGame || {};
          return Object.values(bg).reduce((a, b) => a + b, 0) > 0 || (p.metadata?.penalties || 0) > 0;
        }) && (
          <div className="card animate-pop" style={{ marginBottom: '1.5rem', border: '3px solid #E53E3E', backgroundColor: '#FFF5F5' }}>
            <h3 style={{ marginBottom: '1rem', color: '#E53E3E', textAlign: 'center' }}>🔥 総合 戦犯ランキング 🔥</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[...room.players]
                .map(p => {
                  const bg = p.metadata?.penaltiesByGame || {};
                  const legacyScore = p.metadata?.penalties || 0;
                  const total = Object.values(bg).reduce((a, b) => a + b, 0) + legacyScore;
                  return { ...p, totalPenalties: total, unanimousCnt: bg.unanimous || 0, faceCnt: bg.face_analysis || 0 };
                })
                .filter(p => p.totalPenalties > 0)
                .sort((a, b) => b.totalPenalties - a.totalPenalties)
                .map((p, i) => (
                <li key={p.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', 
                  borderBottom: '1px solid #fed7d7', 
                  backgroundColor: i === 0 ? '#FED7D7' : 'transparent', 
                  borderRadius: i === 0 ? '8px' : '0',
                  fontWeight: i === 0 ? 900 : 600,
                  fontSize: i === 0 ? '1.2rem' : '1rem',
                  color: i === 0 ? '#C53030' : 'var(--dark)'
                }}>
                  <span>{i + 1}位 {i === 0 && '💀 '} {p.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#E53E3E' }}>戦犯 {p.totalPenalties}回</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-medium)' }}>
                      (全員一致: {p.unanimousCnt}回 / 人相: {p.faceCnt}回)
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card" style={{ flex: 1, marginBottom: '1.5rem' }}>
          <h3>参加者 ({room.players.length}人)</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
            {room.players.map(p => (
              <li 
                key={p.sessionId || p.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--gray-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 600
                }}
              >
                <div 
                  style={{ display: 'flex', alignItems: 'center', cursor: p.metadata?.compatibilityProfile ? 'pointer' : 'default' }}
                  onClick={() => p.metadata?.compatibilityProfile && setSelectedProfilePlayer(p)}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: p.isHost ? 'var(--primary)' : 'var(--secondary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    fontSize: '0.875rem',
                    opacity: p.connected ? 1 : 0.5
                  }}>
                    {p.name.charAt(0)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>
                      {p.name}
                      {p.metadata?.compatibilityProfile && <span style={{fontSize: '0.75rem', color:'var(--secondary)', marginLeft: '0.5rem'}}>(📝プロフィール有)</span>}
                      {p.isHost && <span style={{fontSize: '0.75rem', color:'var(--primary)', marginLeft: '0.5rem'}}>(ホスト)</span>}
                      {!p.connected && <span style={{fontSize: '0.75rem', color:'var(--gray-medium)', marginLeft: '0.5rem'}}>(接続切れ)</span>}
                    </span>
                  </div>
                </div>

                {isHost && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }} 
                      onClick={() => setTransferSourcePlayer(p)}>
                      🔄 記録を他のユーザーに引き継ぐ
                    </button>
                    {!p.isHost && (
                      <>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }} 
                          onClick={() => {
                            if (window.confirm(`${p.name}にホスト権限を譲りますか？`)) {
                              socket.emit('transfer_host', { roomId, targetSessionId: p.sessionId });
                            }
                          }}>
                          ホストにする
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ backgroundColor: '#FFebF0', color: '#E53E3E', border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }} 
                          onClick={() => {
                            if (window.confirm(`${p.name}を離脱させますか？`)) {
                              socket.emit('kick_player', { roomId, targetSessionId: p.sessionId });
                            }
                          }}>
                          離脱させる
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>ゲームを選ぶ</h3>
            
            <RouletteSetup socket={socket} room={room} roomId={roomId} />

            <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: 'var(--light)', borderRadius: '8px', border: '1px solid var(--gray-light)' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--gray-dark)' }}>🤖 AIの性格（人格）を選ぶ</label>
              <select 
                className="input-field" 
                value={room.state.persona || 'michael'}
                onChange={(e) => socket.emit('update_game_state', { roomId, payload: { persona: e.target.value } })}
              >
                <option value="michael">マイケル（アメリカン・バディ / フランク）</option>
                <option value="butler">セバスチャン（慇懃無礼 / 毒舌執事）</option>
                <option value="gal">辛口ギャル（感情豊か / 若者言葉）</option>
                <option value="onee">歌舞伎町のオネエ（愛ある毒舌 / オネエ言葉）</option>
              </select>
            </div>

            <button className="btn btn-primary" style={{ marginBottom: '0.75rem' }} onClick={() => handleStartGame('roulette')}>
              自己紹介ルーレット
            </button>
            <button className="btn btn-secondary" style={{ marginBottom: '0.75rem' }} onClick={() => handleStartGame('unanimous')}>
              全員一致ゲーム
            </button>
            <button className="btn btn-secondary" style={{ marginBottom: '0.75rem' }} onClick={() => handleStartGame('compatibility')}>
              AI相性診断ゲーム
            </button>
            <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => handleStartGame('face_analysis')}>
              AI人相誤診断ゲーム
            </button>
            <div style={{ borderTop: '1px solid var(--gray-light)', margin: '1rem 0', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ backgroundColor: '#FFebF0', color: 'var(--primary)' }} onClick={() => handleStartGame('penalty')}>
                💀 罰ゲームを設定する
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--gray-medium)', fontWeight: 600 }}>ホストがゲームを開始するのを待っています...</p>
          </div>
        )}

        {selectedProfilePlayer && (
          <ProfileModal player={selectedProfilePlayer} onClose={() => setSelectedProfilePlayer(null)} />
        )}

        {transferSourcePlayer && (
          <TransferModal 
            sourcePlayer={transferSourcePlayer} 
            candidates={room.players.filter(p => p.id !== transferSourcePlayer.id)} 
            onTransfer={executeTransfer} 
            onClose={() => setTransferSourcePlayer(null)} 
          />
        )}
      </div>
    );
  }

  // Active game dispatch
  return (
    <div className="container" style={{ position: 'relative' }}>
      {room.state.game === 'roulette' && (
        <Roulette socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'unanimous' && (
        <Unanimous socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'compatibility' && (
        <AICompatibility socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'face_analysis' && (
        <AIFaceAnalysis socket={socket} room={room} isHost={isHost} playerName={playerName} roomId={roomId} />
      )}
      {room.state.game === 'penalty' && (
        <Penalty socket={socket} room={room} isHost={isHost} roomId={roomId} />
      )}
      
      {isHost && (
        <button 
          className="btn btn-secondary"
          style={{ position: 'absolute', top: '-60px', right: '0', width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          onClick={handleReturnToLobby}
        >
          やめる
        </button>
      )}
    </div>
  );
}

export default Room;

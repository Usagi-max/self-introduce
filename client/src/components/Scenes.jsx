import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, GraduationCap, Briefcase, Coffee, Target } from 'lucide-react';
import BannerAd from './BannerAd';

function Scenes() {
  const navigate = useNavigate();

  const SceneCard = ({ title, description, recommendedGame, reason }) => (
    <div style={{ marginBottom: '2rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '4px solid var(--primary)' }}>
      <h3 style={{ fontSize: '1.3rem', color: 'var(--dark)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--gray-dark)', marginBottom: '1rem', lineHeight: '1.5' }}>{description}</p>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
        <h4 style={{ color: 'var(--secondary)', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Target size={18} /> おすすめゲーム: {recommendedGame}
        </h4>
        <p style={{ color: 'var(--dark)', fontSize: '0.95rem', lineHeight: '1.5' }}>{reason}</p>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>シーン別おすすめの使い方</h1>
      <p style={{ textAlign: 'center', color: 'var(--gray-dark)', marginBottom: '3rem' }}>
        「アイブレ」は様々な場面で場を盛り上げるのに役立ちます。<br />代表的な利用シーンとおすすめのゲームをご紹介します。
      </p>

      <SceneCard 
        title={<><Heart size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />街コン・合コン</>}
        description="初対面の男女が集まる場。最初の緊張をほぐし、お互いを知るキッカケ作りが重要です。"
        recommendedGame="AI相性診断"
        reason="各自のプロフィールを基にAIが相性を分析！「私たち、95%マッチしてるって！」「趣味が同じみたい！」と、自然な会話のキッカケが生まれます。最初のアイスブレイクに最適です。"
      />

      <SceneCard 
        title={<><GraduationCap size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />サークルの新入生歓迎会</>}
        description="先輩と新入生が交流する場。年齢の壁を越えて、みんなで一緒に盛り上がれる企画が求められます。"
        recommendedGame="満場一致ゲーム"
        reason="「大学生活で一番大切にしたいことは？」などのお題を設定して遊びましょう。意外な珍回答で爆笑が起きたり、先輩と後輩で価値観の違いを楽しんだりと、大人数でも一体感を持って楽しめます。"
      />

      <SceneCard 
        title={<><Briefcase size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />会社の研修・内定者懇親会</>}
        description="ビジネスライクな関係になりがちな場。適度なカジュアルさで、同僚の意外な一面を引き出したい時に。"
        recommendedGame="ルーレット"
        reason="「最近あった嬉しかったこと」「実は私〇〇なんです」などのトークテーマをルーレットに設定。ランダムで当たるドキドキ感と、自己紹介を兼ねたトークで、参加者のパーソナリティを楽しく知ることができます。"
      />

      <SceneCard 
        title={<><Coffee size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />マッチングアプリの初対面 (1対1)</>}
        description="カフェや食事での初デート。沈黙が怖かったり、何を話せばいいか迷ってしまうことも。"
        recommendedGame="AI顔診断 (Physiognomy)"
        reason="お互いの顔写真を読み込んで、AIが性格や相性を診断。「AIに『マイペース』って言われてるけど当たってる？(笑)」など、スマホの画面を一緒に見ながら自然と距離を縮めることができます。（※今後実装予定の機能も含まれます）"
      />

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

export default Scenes;

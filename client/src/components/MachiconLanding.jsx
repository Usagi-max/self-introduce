import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Rocket } from 'lucide-react';
import BannerAd from './BannerAd';

function MachiconLanding() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <section style={{ marginBottom: '4rem', backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', textAlign: 'center' }}>
          【街コン・イベント運営者様へ】<br/>初対面の会話のきっかけを作る「アイブレ」
        </h1>
        
        <div style={{ color: 'var(--gray-dark)', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1rem' }}>
            街コン、イベントなどを企画・運営している皆様。<br/>
            企画したイベントで、こんな光景を見たことはありませんか？
          </p>
          <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem', fontWeight: 'bold' }}>
            <li>「最初の会話がぎこちない」</li>
            <li>「話題が続かず沈黙が生まれる」</li>
            <li>「テーブルごとに盛り上がりに差が出る」</li>
          </ul>
          <p style={{ marginBottom: '1rem' }}>
            これは、会話の展開が「参加者個人のコミュニケーション能力や発想」に依存しているために起こる問題です。<br/>
            そこで私たちが開発したのが、<strong>自然に会話が生まれるきっかけを作るWebアプリ「アイブレ」</strong>です。
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            このアプリの目的は、参加者のコミュニケーション能力に依存しない初対面の会話を実現することです。「アイブレ」を導入すれば、自然な会話の展開を作ることができます。
          </p>

          <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginBottom: '1rem', marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={24} /> 街コンで活躍する３つの機能
          </h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', listStyleType: 'decimal' }}>
            <li style={{ marginBottom: '0.8rem' }}>
              <strong>会話のきっかけを作る「自己紹介ルーレット」</strong><br/>
              ルーレットを回すと、話題が自動で出てきます。その話題に回答することで、自然に会話を始めることができます。「出身地」や「趣味」など話しやすいテーマがテンプレートとして入っており、「もし100万円あったら？」など別の質問も追加可能。<br/>
              プロフィールカードを使った自己紹介がイベントにある場合はスキップしても問題ありません。会話が止まったときに、もう一度会話を始めるきっかけとして活用できます。
            </li>
            <li style={{ marginBottom: '0.8rem' }}>
              <strong>話題を広げる「AI相性診断ゲーム」</strong><br/>
              一般的な相性診断と違い、MBTIや兄弟構成など複数の要素を入力してもらい、多角的に相手を深掘りするきっかけを作ります。また、結果をAIが少しユーモア（偏見？）を交えて解説するため、「私そんなことないよ」みたいに会話が広がります。さらに「ゾンビ映画ならどんな役になる？」「シェアハウスをしたらどんなトラブルが起きる？」といったシチュエーション別の追加解説で、会話のネタを外部から供給し、沈黙を取り除きます。
            </li>
            <li style={{ marginBottom: '0.8rem' }}>
              <strong>場の緊張をなくす「〇〇な顔ゲーム」</strong><br/>
              「AI採点！〇〇な顔ゲーム」では、お題に沿って顔写真を撮影すると、AIが採点とコメントをしてくれます。「砂漠で１週間ぶりにオアシスを見つけた瞬間」「お会計の時に財布を忘れたと気づいた瞬間」などのお題に合わせて、色々な表情にチャレンジ。お互いの表情を見ることで、会話だけでは縮まりきらない距離も一気に変わります！
            </li>
          </ul>

          <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Rocket size={20} /> 導入に際して
            </h3>
            <p style={{ marginBottom: '1rem' }}>
              「アイブレ」を導入することで、<br/>
              <strong>「会話が止まるテーブルが発生する」「盛り上がりが参加者に依存する」「司会のフォローが必要になる」</strong><br/>
              こんなイベントが、<br/>
              <strong>「会話が止まる状況を防げる」「盛り上がりのばらつきが減る」「運営の再現性が高まる」</strong><br/>
              結果として、イベント全体の満足度を安定させることができます。
            </p>
            <p style={{ marginBottom: '1rem' }}>
              本アプリは、営利目的でも非営利目的でも、<strong>どなたでも無料</strong>で利用することができます。Webアプリですのでダウンロードは不要です。
            </p>
            <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
              ① リンクを共有する。<br/>
              ② 1人がホストとなり、ルームを作成する。<br/>
              ③ ルームに参加する。
            </p>
            <p style={{ marginBottom: '0', fontSize: '0.95rem' }}>
              出会いの場の価値は、人を集めることではなく、<strong>「また会いたい」と思える関係を生むこと</strong>です。そして、そのために必要なのは、「また話したい」と思える会話をつくること。このアプリを通して、1つでも多くのいい出会いが生まれることを願っています。
            </p>
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

export default MachiconLanding;

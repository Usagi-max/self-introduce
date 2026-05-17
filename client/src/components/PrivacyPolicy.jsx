import React from 'react';
import { useNavigate } from 'react-router-dom';
import BannerAd from './BannerAd';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center' }}>プライバシーポリシー</h1>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. 広告の配信について</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--gray-dark)' }}>
          当サイトでは、第三者配信の広告サービス（Google AdSense等）を利用しています。<br />
          このような広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報 『Cookie』(氏名、住所、メール アドレス、電話番号は含まれません) を使用することがあります。<br />
          またGoogleアドセンスに関して、このプロセスの詳細やこのような情報が広告配信事業者に使用されないようにする方法については、<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer">Googleポリシーと規約</a>をご覧ください。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>2. アクセス解析ツールについて</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--gray-dark)' }}>
          当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。<br />
          このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。<br />
          この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>3. 個人情報の管理</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--gray-dark)' }}>
          当サイトは、ユーザーの個人情報を正確かつ最新の状態に保ち、個人情報への不正アクセス・紛失・破損・改ざん・漏洩などを防止するため、セキュリティシステムの維持・管理体制の整備等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行ないます。
        </p>
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

export default PrivacyPolicy;

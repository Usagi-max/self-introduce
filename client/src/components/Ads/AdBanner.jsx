import React from 'react';

function AdBanner() {
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#f0f0f0',
      color: '#aaa',
      textAlign: 'center',
      padding: '0.5rem',
      fontSize: '0.75rem',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      borderTop: '1px solid #ddd'
    }}>
      [広告枠] ここにバナー広告が表示されます
    </div>
  );
}

export default AdBanner;

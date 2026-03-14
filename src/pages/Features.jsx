import React from 'react';

export default function Features({ onBack, texts }) {
  const featureList = [
    { title: texts.feature_1_title, desc: texts.feature_1_desc, icon: '✏️' },
    { title: texts.feature_2_title, desc: texts.feature_2_desc, icon: '⚡' },
    { title: texts.feature_3_title, desc: texts.feature_3_desc, icon: '📄' },
    { title: texts.feature_4_title, desc: texts.feature_4_desc, icon: '🏗️' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '20px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>VoltFlow</div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', fontSize: '1rem' }}>{texts.auth_back}</button>
      </nav>

      <main style={{ flex: 1, padding: '50px 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: '700' }}>{texts.features_title}</h2>
        <p style={{ fontSize: '1.2rem', opacity: 0.8, marginBottom: '60px' }}>{texts.features_subtitle}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
          {featureList.map((feature, idx) => (
            <div key={idx} style={{ background: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', transition: 'transform 0.2s', cursor: 'default' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', fontWeight: '600' }}>{feature.title}</h3>
              <p style={{ lineHeight: '1.6', opacity: 0.8 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid var(--border)', fontSize: '0.9rem', opacity: 0.6 }}>
        © 2024 VoltFlow. Tous droits réservés.
      </footer>
    </div>
  );
}

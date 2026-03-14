import React from 'react';

export default function Home({ onStartEditor, onLoginClick, texts, onFeaturesClick, onPricingClick, lang, setLang }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '20px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>VoltFlow</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onFeaturesClick} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>{texts.home_nav_features}</button>
          <button onClick={onPricingClick} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>{texts.home_nav_pricing}</button>
          <button onClick={onLoginClick} style={{ padding: '8px 20px', borderRadius: '5px', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'none', cursor: 'pointer' }}>{texts.home_nav_login}</button>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{ background: 'var(--item-bg)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', padding: '5px' }}>
            <option value="fr">🇫🇷 FR</option>
            <option value="en">🇬🇧 EN</option>
          </select>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '20px', fontWeight: '800' }}>
          {texts.home_hero_title} <br/> 
          <span style={{ color: 'var(--accent)' }}>{texts.home_hero_subtitle}</span>
        </h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '700px', opacity: 0.8, marginBottom: '40px', lineHeight: '1.6' }}>
          {texts.home_hero_desc}
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            onClick={onStartEditor}
            style={{ padding: '15px 40px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', cursor: 'pointer', boxShadow: '0 4px 15px rgba(170, 59, 255, 0.3)' }}
          >
            {texts.home_btn_start}
          </button>
          <button style={{ padding: '15px 40px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--item-bg)', color: 'var(--text-color)', cursor: 'pointer' }}>
            {texts.home_btn_demo}
          </button>
        </div>
      </main>

      <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid var(--border)', fontSize: '0.9rem', opacity: 0.6 }}>
        © 2024 VoltFlow. Tous droits réservés.
      </footer>
    </div>
  );
}

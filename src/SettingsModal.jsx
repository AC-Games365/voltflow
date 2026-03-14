import React from 'react';

export default function SettingsModal({ isOpen, onClose, theme, setTheme, lang, setLang, texts, projectData, setProjectData }) {
  if (!isOpen) return null;

  const handleStandardChange = (e) => {
    setProjectData(pd => ({...pd, standard: e.target.value}));
  };

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        background: 'rgba(0,0,0,0.5)', display: 'flex', 
        justifyContent: 'center', alignItems: 'center', zIndex: 1000 
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'var(--sidebar-bg)', padding: '30px', borderRadius: '8px', 
          width: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
          border: '1px solid var(--sidebar-border)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '25px', color: 'var(--text-color)' }}>{texts.settings_title}</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-color)', fontSize: '14px' }}>{texts.theme_label}</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="light">{texts.theme_light}</option>
            <option value="dark">{texts.theme_dark}</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-color)', fontSize: '14px' }}>{texts.language_label}</label>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-color)', fontSize: '14px' }}>Norme électrique</label>
          <select value={projectData.standard || 'be'} onChange={handleStandardChange} style={{ width: '100%', padding: '8px' }}>
            <option value="be">Belgique (RGIE/AREI)</option>
            <option value="fr">France (NF C 15-100)</option>
          </select>
        </div>

        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'var(--button-primary-bg)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Fermer
        </button>
      </div>
    </div>
  );
}

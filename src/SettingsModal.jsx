import React from 'react';

export default function SettingsModal({ isOpen, onClose, theme, setTheme, lang, setLang, texts }) {
  if (!isOpen) {
    return null;
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h2>{texts.settings_title || 'Paramètres'}</h2>

        {/* --- Section Thème --- */}
        <div className="settings-section">
          <label>{texts.theme_label || 'Thème'}</label>
          <div className="settings-options">
            <button 
              onClick={() => handleThemeChange('light')}
              className={theme === 'light' ? 'active' : ''}
            >
              ☀️ {texts.theme_light || 'Clair'}
            </button>
            <button 
              onClick={() => handleThemeChange('dark')}
              className={theme === 'dark' ? 'active' : ''}
            >
              🌙 {texts.theme_dark || 'Sombre'}
            </button>
          </div>
        </div>

        {/* --- Section Langue --- */}
        <div className="settings-section">
          <label>{texts.language_label || 'Langue'}</label>
          <div className="settings-options">
            <button 
              onClick={() => handleLangChange('fr')}
              className={lang === 'fr' ? 'active' : ''}
            >
              FR
            </button>
            <button 
              onClick={() => handleLangChange('en')}
              className={lang === 'en' ? 'active' : ''}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
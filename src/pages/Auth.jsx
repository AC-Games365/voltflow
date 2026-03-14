import React, { useState } from 'react';

export default function Auth({ onLogin, onBack, texts }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--item-bg)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow)' }}>
        <div 
          onClick={onBack}
          style={{ marginBottom: '20px', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.7 }}
        >
          {texts.auth_back}
        </div>
        
        <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>
          {isLogin ? texts.auth_title_login : texts.auth_title_register}
        </h2>
        <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '30px', fontSize: '0.9rem' }}>
          {isLogin ? texts.auth_desc_login : texts.auth_desc_register}
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{texts.auth_label_name}</label>
              <input type="text" placeholder="Jean Dupont" style={{ width: '100%', padding: '10px', borderRadius: '6px' }} />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{texts.auth_label_email}</label>
            <input type="email" placeholder="nom@exemple.com" style={{ width: '100%', padding: '10px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{texts.auth_label_pass}</label>
            <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px', borderRadius: '6px' }} />
          </div>

          <button 
            type="submit"
            style={{ marginTop: '10px', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isLogin ? texts.auth_btn_login : texts.auth_btn_register}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ opacity: 0.6 }}>
            {isLogin ? texts.auth_switch_login.split('?')[0] + '? ' : texts.auth_switch_register.split('?')[0] + '? '}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
          >
            {isLogin ? texts.auth_switch_login.split('?')[1] : texts.auth_switch_register.split('?')[1]}
          </button>
        </div>
      </div>
    </div>
  );
}

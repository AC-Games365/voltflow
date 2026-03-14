import React from 'react';

export default function Profile({ onLogout, onBackToEditor, currentUser, texts }) {
  // Simulation de données
  const projects = [
    { id: 1, name: 'Maison Individuelle - Lille', date: '12/05/2024', status: texts.profile_status_ongoing },
    { id: 2, name: 'Appartement T3 - Paris', date: '08/05/2024', status: texts.profile_status_done },
  ];

  if (!currentUser) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', display: 'flex' }}>
      {/* Sidebar Profil */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--border)', padding: '40px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent)', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold' }}>
            {currentUser.name.charAt(0)}
          </div>
          <h3 style={{ margin: 0 }}>{currentUser.name}</h3>
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>{currentUser.email}</p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={{ padding: '12px', textAlign: 'left', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer' }}>{texts.profile_my_projects}</button>
          <button style={{ padding: '12px', textAlign: 'left', borderRadius: '8px', border: 'none', background: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>{texts.profile_settings}</button>
          <button style={{ padding: '12px', textAlign: 'left', borderRadius: '8px', border: 'none', background: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>{texts.profile_subscription}</button>
        </nav>

        <button 
          onClick={onLogout}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dc3545', color: '#dc3545', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {texts.profile_logout}
        </button>
      </aside>

      {/* Contenu Principal */}
      <main style={{ flex: 1, padding: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ margin: 0 }}>{texts.profile_my_projects}</h1>
          <button 
            onClick={onBackToEditor}
            style={{ padding: '12px 25px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {texts.profile_new_project}
          </button>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {projects.map(p => (
            <div key={p.id} style={{ padding: '20px', backgroundColor: 'var(--item-bg)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{p.name}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.5 }}>{texts.profile_modified} {p.date}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', backgroundColor: p.status === texts.profile_status_done ? '#28a74522' : 'var(--accent-bg)', color: p.status === texts.profile_status_done ? '#28a745' : 'var(--accent)' }}>
                  {p.status}
                </span>
                <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>⋮</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

import React from 'react';

export default function Pricing({ onBack, texts }) {
  const plans = [
    {
      name: texts.pricing_free_name,
      price: texts.pricing_free_price,
      period: '',
      features: [texts.pricing_free_feat1, texts.pricing_free_feat2, texts.pricing_free_feat3],
      btn: texts.pricing_btn_choose,
      highlight: false
    },
    {
      name: texts.pricing_pro_name,
      price: texts.pricing_pro_price,
      period: texts.pricing_pro_period,
      features: [texts.pricing_pro_feat1, texts.pricing_pro_feat2, texts.pricing_pro_feat3, texts.pricing_pro_feat4],
      btn: texts.pricing_btn_choose,
      highlight: true
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '20px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>VoltFlow</div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', fontSize: '1rem' }}>{texts.auth_back}</button>
      </nav>

      <main style={{ flex: 1, padding: '50px 20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: '700' }}>{texts.pricing_title}</h2>
        <p style={{ fontSize: '1.2rem', opacity: 0.8, marginBottom: '60px' }}>{texts.pricing_subtitle}</p>

        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: 'var(--panel-bg)', 
                padding: '40px', 
                borderRadius: '16px', 
                border: plan.highlight ? '2px solid var(--accent)' : '1px solid var(--border)', 
                textAlign: 'left', 
                width: '320px', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: plan.highlight ? '0 10px 30px rgba(170, 59, 255, 0.1)' : 'none'
              }}
            >
              <h3 style={{ fontSize: '1.8rem', marginBottom: '10px', fontWeight: '700' }}>{plan.name}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '20px' }}>
                {plan.price}
                <span style={{ fontSize: '1rem', fontWeight: '400', opacity: 0.6 }}>{plan.period}</span>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1 }}>
                {plan.features.map((feat, fidx) => (
                  <li key={fidx} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--accent)' }}>✓</span> {feat}
                  </li>
                ))}
              </ul>

              <button 
                style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  backgroundColor: plan.highlight ? 'var(--accent)' : 'var(--item-bg)', 
                  color: plan.highlight ? 'white' : 'var(--text-color)', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  border: plan.highlight ? 'none' : '1px solid var(--border)'
                }}
              >
                {plan.btn}
              </button>
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

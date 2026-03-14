import React from 'react';

/**
 * Symboles Électriques conformes au RGIE (Belgique)
 */
const RGIE_SYMBOLS = {
  // --- ÉCLAIRAGE ---
  light: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="22" y1="22" x2="78" y2="78" stroke={color} strokeWidth="5" />
      <line x1="78" y1="22" x2="22" y2="78" stroke={color} strokeWidth="5" />
    </svg>
  ),
  spotlight: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="22" y1="22" x2="78" y2="78" stroke={color} strokeWidth="5" />
      <line x1="78" y1="22" x2="22" y2="78" stroke={color} strokeWidth="5" />
      <line x1="50" y1="10" x2="50" y2="25" stroke={color} strokeWidth="5" />
      <line x1="50" y1="75" x2="50" y2="90" stroke={color} strokeWidth="5" />
    </svg>
  ),
  wall_light: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="22" y1="22" x2="78" y2="78" stroke={color} strokeWidth="5" />
      <line x1="78" y1="22" x2="22" y2="78" stroke={color} strokeWidth="5" />
      <line x1="10" y1="50" x2="25" y2="50" stroke={color} strokeWidth="8" />
    </svg>
  ),

  // --- PRISES (Norme Belge avec Terre) ---
  socket: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <path d="M 10,50 A 40,40 0 1,1 90,50" stroke={color} strokeWidth="5" fill="none" />
      <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="5" />
      {/* Broche de terre (spécifique Belgique/France) */}
      <line x1="50" y1="50" x2="50" y2="20" stroke={color} strokeWidth="5" />
    </svg>
  ),
  socket_no_earth: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <path d="M 10,50 A 40,40 0 1,1 90,50" stroke={color} strokeWidth="5" fill="none" />
      <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="5" />
    </svg>
  ),
  socket_double: (color = 'currentColor') => (
    <svg width="60" height="40" viewBox="0 0 150 100">
      <g transform="translate(0,0)">
        <path d="M 10,50 A 40,40 0 1,1 90,50" stroke={color} strokeWidth="5" fill="none" />
        <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="5" />
        <line x1="50" y1="50" x2="50" y2="20" stroke={color} strokeWidth="5" />
      </g>
      <g transform="translate(50,0)">
        <path d="M 10,50 A 40,40 0 1,1 90,50" stroke={color} strokeWidth="5" fill="none" />
        <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="5" />
        <line x1="50" y1="50" x2="50" y2="20" stroke={color} strokeWidth="5" />
      </g>
    </svg>
  ),

  // --- INTERRUPTEURS ---
  switch_single: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="50" y1="10" x2="50" y2="50" stroke={color} strokeWidth="5" />
      <line x1="50" y1="10" x2="70" y2="10" stroke={color} strokeWidth="5" />
    </svg>
  ),
  switch_double: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="50" y1="10" x2="50" y2="50" stroke={color} strokeWidth="5" />
      <line x1="50" y1="10" x2="70" y2="10" stroke={color} strokeWidth="5" />
      <line x1="50" y1="20" x2="70" y2="20" stroke={color} strokeWidth="5" />
    </svg>
  ),
  switch_two_way: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="50" y1="10" x2="50" y2="90" stroke={color} strokeWidth="5" />
      <line x1="50" y1="10" x2="70" y2="10" stroke={color} strokeWidth="5" />
      <line x1="50" y1="90" x2="30" y2="90" stroke={color} strokeWidth="5" />
    </svg>
  ),
  switch_intermediate: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="50" y1="10" x2="50" y2="90" stroke={color} strokeWidth="5" />
      <line x1="50" y1="10" x2="70" y2="10" stroke={color} strokeWidth="5" />
      <line x1="50" y1="10" x2="30" y2="10" stroke={color} strokeWidth="5" />
      <line x1="50" y1="90" x2="70" y2="90" stroke={color} strokeWidth="5" />
      <line x1="50" y1="90" x2="30" y2="90" stroke={color} strokeWidth="5" />
    </svg>
  ),
  push_button: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <circle cx="50" cy="50" r="8" fill={color} />
      <line x1="50" y1="10" x2="50" y2="42" stroke={color} strokeWidth="5" />
      <line x1="50" y1="10" x2="70" y2="10" stroke={color} strokeWidth="5" />
    </svg>
  ),

  // --- TABLEAU ET PROTECTION ---
  panel: (color = 'currentColor') => (
    <svg width="50" height="50" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" stroke={color} strokeWidth="5" fill="none" />
      <line x1="10" y1="10" x2="90" y2="90" stroke={color} strokeWidth="5" />
      <line x1="90" y1="10" x2="10" y2="90" stroke={color} strokeWidth="5" />
    </svg>
  ),
  breaker: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="30" cy="50" r="5" fill={color} />
      <circle cx="70" cy="50" r="5" fill={color} />
      <path d="M 30,50 L 65,30" stroke={color} strokeWidth="5" fill="none" />
      <path d="M 50,20 A 20,20 0 0,1 70,40" stroke={color} strokeWidth="3" fill="none" />
    </svg>
  ),
  rcd: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="30" cy="50" r="5" fill={color} />
      <circle cx="70" cy="50" r="5" fill={color} />
      <path d="M 30,50 L 65,30" stroke={color} strokeWidth="5" fill="none" />
      <rect x="20" y="20" width="60" height="60" stroke={color} strokeWidth="2" fill="none" strokeDasharray="5,5" />
      <path d="M 40,70 Q 50,85 60,70" stroke={color} strokeWidth="3" fill="none" />
    </svg>
  ),
  junction_box: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <rect x="20" y="20" width="60" height="60" stroke={color} strokeWidth="5" fill="none" />
    </svg>
  ),
};

/**
 * Symboles Électriques conformes à la NF C 15-100 (France)
 */
const NFC_SYMBOLS = {
  // --- ÉCLAIRAGE ---
  light: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="22" y1="22" x2="78" y2="78" stroke={color} strokeWidth="5" />
      <line x1="78" y1="22" x2="22" y2="78" stroke={color} strokeWidth="5" />
    </svg>
  ),
  spotlight: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="50" y1="10" x2="50" y2="90" stroke={color} strokeWidth="5" />
    </svg>
  ),
  wall_light: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="22" y1="22" x2="78" y2="78" stroke={color} strokeWidth="5" />
      <line x1="78" y1="22" x2="22" y2="78" stroke={color} strokeWidth="5" />
      <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="5" />
    </svg>
  ),

  // --- PRISES ---
  socket: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="20" stroke={color} strokeWidth="5" fill="none" />
      <line x1="50" y1="30" x2="50" y2="10" stroke={color} strokeWidth="5" />
      <line x1="50" y1="70" x2="50" y2="90" stroke={color} strokeWidth="5" />
    </svg>
  ),
  socket_double: (color = 'currentColor') => (
    <svg width="60" height="40" viewBox="0 0 150 100">
      <g transform="translate(0,0)">
        <circle cx="50" cy="50" r="20" stroke={color} strokeWidth="5" fill="none" />
        <line x1="50" y1="30" x2="50" y2="10" stroke={color} strokeWidth="5" />
        <line x1="50" y1="70" x2="50" y2="90" stroke={color} strokeWidth="5" />
      </g>
      <g transform="translate(50,0)">
        <circle cx="50" cy="50" r="20" stroke={color} strokeWidth="5" fill="none" />
        <line x1="50" y1="30" x2="50" y2="10" stroke={color} strokeWidth="5" />
        <line x1="50" y1="70" x2="50" y2="90" stroke={color} strokeWidth="5" />
      </g>
    </svg>
  ),

  // --- INTERRUPTEURS ---
  switch_single: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
    </svg>
  ),
  switch_double: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <text x="42" y="62" fontSize="30" fill={color}>D</text>
    </svg>
  ),
  switch_two_way: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <line x1="30" y1="50" x2="70" y2="50" stroke={color} strokeWidth="5" />
      <line x1="50" y1="30" x2="50" y2="70" stroke={color} strokeWidth="5" />
    </svg>
  ),
  push_button: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
      <text x="42" y="62" fontSize="30" fill={color}>P</text>
    </svg>
  ),

  // --- TABLEAU ET PROTECTION ---
  panel: (color = 'currentColor') => (
    <svg width="50" height="50" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" stroke={color} strokeWidth="5" fill="none" />
      <line x1="10" y1="10" x2="90" y2="90" stroke={color} strokeWidth="5" />
    </svg>
  ),
  breaker: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <rect x="20" y="20" width="60" height="60" stroke={color} strokeWidth="5" fill="none" />
      <text x="42" y="62" fontSize="30" fill={color}>D</text>
    </svg>
  ),
  rcd: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <rect x="20" y="20" width="60" height="60" stroke={color} strokeWidth="5" fill="none" />
      <text x="42" y="62" fontSize="30" fill={color}>ID</text>
    </svg>
  ),
  junction_box: (color = 'currentColor') => (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="5" fill="none" />
    </svg>
  ),
};

export const getSymbols = (standard = 'be') => {
  if (standard.toLowerCase() === 'fr') {
    return NFC_SYMBOLS;
  }
  return RGIE_SYMBOLS;
};

import React, { useState, useEffect, useRef } from 'react';

const LevelManager = ({ levels, activeLevelId, setActiveLevelId, addLevel, deleteLevel, renameLevel, texts }) => {
  const [isEditing, setIsEditing] = useState(false);
  const activeLevel = levels.find(l => l.id === activeLevelId);
  const inputRef = useRef(null);

  const handleRename = () => {
    setIsEditing(true);
  };

  const handleRenameConfirm = (newName) => {
    if (newName && activeLevel && newName !== activeLevel.name) {
      renameLevel(activeLevel.id, newName);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const selectStyle = {
    background: 'var(--item-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--item-border)',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '13px',
    minWidth: '150px',
  };

  const buttonStyle = {
    background: 'var(--item-bg)',
    border: '1px solid var(--item-border)',
    color: 'var(--text-color)',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const inputStyle = {
    ...selectStyle,
    cursor: 'text',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          defaultValue={activeLevel?.name}
          onBlur={(e) => handleRenameConfirm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameConfirm(e.target.value);
            if (e.key === 'Escape') setIsEditing(false);
          }}
          style={inputStyle}
        />
      ) : (
        <select
          value={activeLevelId}
          onChange={(e) => setActiveLevelId(e.target.value)}
          style={selectStyle}
        >
          {levels.map(level => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      )}

      <button onClick={addLevel} style={buttonStyle} title={texts.add_level || "Ajouter un niveau"}>+</button>
      <button onClick={handleRename} disabled={isEditing} style={buttonStyle} title={texts.rename_level || "Renommer le niveau"}>✏️</button>
      <button onClick={() => deleteLevel(activeLevelId)} disabled={levels.length <= 1} style={{...buttonStyle, color: levels.length > 1 ? '#dc3545' : 'grey'}} title={texts.delete_level || "Supprimer le niveau"}>🗑️</button>
    </div>
  );
};

export default LevelManager;

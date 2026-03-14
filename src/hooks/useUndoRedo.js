import { useState, useCallback } from 'react';

export const useUndoRedo = (initialState) => {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [present, setPresent] = useState(initialState);

  // takeSnapshot ne doit pas modifier l'état, juste le sauvegarder.
  const takeSnapshot = useCallback(() => {
    setPast((p) => [...p.slice(-50), present]);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((f) => [present, ...f]);
    setPast((p) => p.slice(0, -1));
    setPresent(previous);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast((p) => [...p, present]);
    setFuture((f) => f.slice(1));
    setPresent(next);
  }, [future, present]);

  return {
    state: present,
    setState: setPresent, // Le setter d'état brut
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};
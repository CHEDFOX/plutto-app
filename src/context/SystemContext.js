import React, { createContext, useContext, useState, useCallback } from 'react';
import { SYSTEMS } from '../theme/design';

const SystemContext = createContext();

export function SystemProvider({ children }) {
  const [systemId, setSystemId] = useState('bphs');
  
  const system = SYSTEMS.find(s => s.id === systemId) || SYSTEMS[0];
  
  const switchSystem = useCallback((id) => {
    const valid = SYSTEMS.find(s => s.id === id);
    if (valid) setSystemId(id);
  }, []);

  return (
    <SystemContext.Provider value={{ system, systemId, switchSystem, systems: SYSTEMS }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within SystemProvider');
  return ctx;
}
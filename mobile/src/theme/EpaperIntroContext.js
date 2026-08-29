import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import EpaperIntroModal from '../components/EpaperIntroModal';
import {
  clearAcknowledgedEpaperDevice,
  hasAcknowledgedEpaperDevice,
  setAcknowledgedEpaperDevice,
} from '../utils/epaperIntro';

const EpaperIntroContext = createContext({
  confirmHasDevice: async () => false,
  resetIntro: async () => {},
});

export function EpaperIntroProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const pendingRef = useRef(null);

  const settle = useCallback((value) => {
    const resolve = pendingRef.current;
    pendingRef.current = null;
    setVisible(false);
    resolve?.(value);
  }, []);

  const confirmHasDevice = useCallback(async () => {
    if (await hasAcknowledgedEpaperDevice()) {
      return true;
    }

    return new Promise((resolve) => {
      pendingRef.current = resolve;
      setVisible(true);
    });
  }, []);

  const resetIntro = useCallback(async () => {
    await clearAcknowledgedEpaperDevice();
  }, []);

  const handleHasDevice = useCallback(async () => {
    await setAcknowledgedEpaperDevice();
    settle(true);
  }, [settle]);

  const handleClose = useCallback(() => {
    settle(false);
  }, [settle]);

  return (
    <EpaperIntroContext.Provider value={{ confirmHasDevice, resetIntro }}>
      {children}
      <EpaperIntroModal
        visible={visible}
        onHasDevice={handleHasDevice}
        onClose={handleClose}
      />
    </EpaperIntroContext.Provider>
  );
}

export function useEpaperIntro() {
  return useContext(EpaperIntroContext);
}

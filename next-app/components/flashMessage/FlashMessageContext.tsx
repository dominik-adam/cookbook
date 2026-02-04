import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import FlashMessage from '@/components/flashMessage/FlashMessage';

type FlashMessageStatus = 'success' | 'error' | 'warning' | 'info';

type FlashMessageContextType = {
  showMessage: (msg: string, stat: FlashMessageStatus) => void;
  clearMessage: () => void;
};

const FlashMessageContext = createContext<FlashMessageContextType | undefined>(undefined);

type FlashMessageProviderProps = {
  children: ReactNode;
};

export const FlashMessageProvider = ({ children }: FlashMessageProviderProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<FlashMessageStatus | null>(null);
  const [active, setActive] = useState<boolean>(false);

  const showMessage = (msg: string, stat: FlashMessageStatus) => {
    setMessage(msg);
    setStatus(stat);
    setActive(true);
  };

  const clearMessage = () => {
    setMessage(null);
    setStatus(null);
    setActive(false);
  };

  useEffect(() => {
    const statusTimer = setTimeout(() => {
      setActive(false);
    }, 5000);

    const messageTimer = setTimeout(() => {
      clearMessage();
    }, 6000);

    return () => {
      clearTimeout(statusTimer);
      clearTimeout(messageTimer);
    };
  }, [message]);

  return (
    <FlashMessageContext.Provider value={{ showMessage, clearMessage }}>
      {children}
      {message && status && <FlashMessage active={active} message={message} status={status} />}
    </FlashMessageContext.Provider>
  );
};

export const useFlashMessage = () => {
  const context = useContext(FlashMessageContext);
  if (context === undefined) {
    throw new Error('useFlashMessage must be used within a FlashMessageProvider');
  }
  return context;
};

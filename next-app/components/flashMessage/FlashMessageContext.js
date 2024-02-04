import React, { createContext, useState, useContext, useEffect } from 'react';
import FlashMessage from '@/components/flashMessage/FlashMessage';

const FlashMessageContext = createContext();

export const FlashMessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null);
  const [status, setStatus] = useState(null);
  const [active, setActive] = useState(false);

  const showMessage = (msg, stat) => {
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
      {message && <FlashMessage active={active} message={message} status={status} onClose={clearMessage} />}
    </FlashMessageContext.Provider>
  );
};

export const useFlashMessage = () => useContext(FlashMessageContext);

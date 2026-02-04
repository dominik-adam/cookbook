
import React from 'react';
import styles from '@/styles/FlashMessage.module.css';

type FlashMessageStatus = 'success' | 'error' | 'warning' | 'info';

type FlashMessageProps = {
  active: boolean;
  message: string;
  status: FlashMessageStatus;
};

const FlashMessage = ({ active, message, status }: FlashMessageProps) => {
  return (
    <div className={`${styles.flashMessage} ${styles[status]} ${active ? '' : styles.inactive}`}>
      {message}
    </div>
  );
};

export default FlashMessage;


import React from 'react';
import styles from '@/styles/FlashMessage.module.css';

const FlashMessage = ({ active, message, status }) => {
  return (
    <div className={`${styles.flashMessage} ${styles[status]} ${active ? '' : styles.inactive}`}>
      {message}
    </div>
  );
};

export default FlashMessage;
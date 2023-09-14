import Image from 'next/image';
import { useState } from 'react';
import styles from './ingredient.module.css';
import react from 'react';

export default function Ingredient({ ingredient, amount, unit, image }) {

  const [isChecked, setIsChecked] = useState(false);

  const toggleCheck = () => {
    setIsChecked(!isChecked);
  }

  return (
    <div className={styles.ingredient}>
      <Image
        className={styles.ingredientImage}
        src={isChecked ? '/ingredients/checked.png' : image}
        style={{objectFit: "cover"}}
        height={80}
        width={80}
        alt={ingredient}
        onClick={toggleCheck}
      />
      <div className={styles.ingredientInfo}>
        <span className={`${styles.ingredientName} ${isChecked ? styles.crossedOut : null}`}>
          {ingredient}
        </span>
        {(amount || unit) && (
          <span className={`${styles.ingredientAmount} ${isChecked ? styles.crossedOut : null}`}>
            {amount} {unit}
          </span>
        )}
      </div>
    </div>
  );
}
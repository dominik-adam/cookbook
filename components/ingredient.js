import Image from 'next/image';
import { useState } from 'react';
import styles from './ingredient.module.css';

export default function Ingredient({ ingredient, amount, unit, image, multiplier, initState, handleToggle }) {

  const [isChecked, setIsChecked] = useState(initState);

  const toggleCheck = () => {
    handleToggle(ingredient, !isChecked);
    setIsChecked(!isChecked);
  }

  return (
    <div className={styles.ingredient}>
      <Image
        className={styles.ingredientImage}
        src={isChecked ? '/ingredients/checked.jpg' : image}
        style={{objectFit: "cover", cursor: "pointer"}}
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
            {amount && multiplier ? amount * multiplier : ""} {unit}
          </span>
        )}
      </div>
    </div>
  );
}
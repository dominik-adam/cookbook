import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/ingredient.module.css';

export default function Ingredient({ 
  ingredient, 
  amount, 
  unit, 
  instruction, 
  multiplier = 1, 
  initState = false, 
  handleToggle = (a, b) => {}
}) {

  const { id: ingredientId, name: ingredientName, image: ingredientImage } = ingredient;
  const { name: unitName, plural: unitPluralName } = unit;

  const [isChecked, setIsChecked] = useState(initState);

  const toggleCheck = () => {
    handleToggle(ingredientId, !isChecked);
    setIsChecked(!isChecked);
  }

  return (
    <div className={styles.ingredient}>
      <Image
        className={styles.ingredientImage}
        src={isChecked ? '/ingredients/checked.jpg' : ingredientImage}
        style={{objectFit: "cover", cursor: "pointer"}}
        height={80}
        width={80}
        alt={ingredientName}
        onClick={toggleCheck}
      />
      <div className={styles.ingredientInfo}>
        <span className={`${styles.ingredientName} ${isChecked ? styles.crossedOut : null}`}>
          {ingredientName}
        </span>
        {(amount || instruction) && (
          <span className={`${styles.ingredientAmount} ${isChecked ? styles.crossedOut : null}`}>
            {amount && multiplier ? amount * multiplier : ""} {amount && amount > 1 ? unitPluralName : unitName} {instruction}
          </span>
        )}
      </div>
    </div>
  );
}
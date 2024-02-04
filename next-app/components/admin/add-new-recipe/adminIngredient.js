import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/ingredient.module.css';

export default function AdminIngredient({ 
  ingredient, 
  amount, 
  unit, 
  instruction, 
  multiplier = 1, 
  handleClick = (a, b) => {}
}) {
  const { id: ingredientId, name: ingredientName, image: ingredientImage } = ingredient;
  const { name: unitName, plural: unitPluralName } = unit;

  const toggleDelete = () => {
    handleClick();
  }

  const [isHover, setIsHover] = useState(false);

  const toggleHover = () => {
    setIsHover(!isHover);
  };

  const image = isHover ? '/icons/close.png' : ingredientImage;

  return (
    <div className={styles.ingredient}>
      <Image
        className={styles.ingredientImage}
        src={image}
        style={{objectFit: "cover", cursor: "pointer"}}
        height={80}
        width={80}
        alt={ingredientName}
        onClick={toggleDelete}
        onMouseEnter={toggleHover}
        onMouseLeave={toggleHover}
      />
      <div className={styles.ingredientInfo}>
        <span className={`${styles.ingredientName} ${isHover ? styles.crossedOut : null}`}>
          {ingredientName}
        </span>
        {(amount || unit) && (
          <span className={`${styles.ingredientAmount} ${isHover ? styles.crossedOut : null}`}>
            {amount && multiplier ? amount * multiplier : ""} {amount && amount > 1 ? unitPluralName : unitName} {instruction}
          </span>
        )}
      </div>
    </div>
  );
}
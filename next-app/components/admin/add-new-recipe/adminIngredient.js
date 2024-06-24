import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/ingredient.module.css';

export default function AdminIngredient({ 
  ingredient, 
  amount, 
  unit, 
  instruction, 
  multiplier = 1, 
  handleUpdate,
  handleDelete = (a, b) => {}
}) {
  const { id: ingredientId, name: ingredientName, image: ingredientImage } = ingredient;
  const { name: unitName, plural: unitPluralName } = unit;

  const [isHover, setIsHover] = useState(false);
  const [isHoverDelete, setIsHoverDelete] = useState(false);

  const toggleHover = () => {
    setIsHover(!isHover);
  };

  const toggleDeleteHover = () => {
    setIsHoverDelete(!isHoverDelete);
  };

  const image = isHoverDelete ? '/icons/close.png' : ingredientImage;

  return (
    <div 
      className={`${styles.ingredient} ${isHover ? styles.ingredientCanUpdate : null}`}
      onClick={handleUpdate}
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
    >
      <Image
        className={styles.ingredientImage}
        src={image}
        style={{objectFit: "cover", cursor: "pointer"}}
        height={80}
        width={80}
        alt={ingredientName}
        onClick={handleDelete}
        onMouseEnter={toggleDeleteHover}
        onMouseLeave={toggleDeleteHover}
      />
      <div className={styles.ingredientInfo}>
        <span className={`${styles.ingredientName} ${isHoverDelete ? styles.crossedOut : null}`}>
          {ingredientName}
        </span>
        {(amount || unit) && (
          <span className={`${styles.ingredientAmount} ${isHoverDelete ? styles.crossedOut : null}`}>
            {amount && multiplier ? amount * multiplier : ""} {amount && amount > 1 ? unitPluralName : unitName} {instruction}
          </span>
        )}
      </div>
    </div>
  );
}
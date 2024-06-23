import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/ingredient.module.css';

export default function BagIngredient({ 
  ingredient, 
  amount, 
  unit, 
  note,
  handleRemove
}) {
  const { id: ingredientId, name: ingredientName, image: ingredientImage } = ingredient;
  const { id: unitId, name: unitName, plural: unitPluralName } = unit;

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
        onClick={() => handleRemove(ingredientId, ingredientName, unitId)}
        onMouseEnter={toggleHover}
        onMouseLeave={toggleHover}
      />
      <div className={styles.ingredientInfo}>
        <span className={`${styles.ingredientName}`}>
          {ingredientName}
        </span>
        {(amount) && (
          <span className={`${styles.ingredientAmount}`}>
            {amount} {unitName ?? ""}
          </span>
        )}
        {(note) && (
          <span className={`${styles.ingredientNote}`}>
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
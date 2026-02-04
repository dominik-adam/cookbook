import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/ingredient.module.css';
import type { Ingredient, IngredientUnit } from '@/types/recipe';

type AdminIngredientProps = {
  ingredient: Ingredient;
  amount: number | null;
  unit: IngredientUnit;
  instruction: string | null;
  multiplier?: number;
  handleUpdate: () => void;
  handleDelete?: (event: React.MouseEvent) => void;
};

export default function AdminIngredient({
  ingredient,
  amount,
  unit,
  instruction,
  multiplier = 1,
  handleUpdate,
  handleDelete = (a: React.MouseEvent) => {}
}: AdminIngredientProps) {
  const { id: ingredientId, name: ingredientName, image: ingredientImage } = ingredient;
  const { name: unitName, plural: unitPluralName } = unit;

  const [isHover, setIsHover] = useState<boolean>(false);
  const [isHoverDelete, setIsHoverDelete] = useState<boolean>(false);

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
        onClick={(event) => {
          event.stopPropagation();
          handleDelete(event);
        }}
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

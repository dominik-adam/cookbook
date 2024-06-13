import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/ingredient.module.css';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

export default function Ingredient({ 
  ingredient, 
  amount, 
  unit, 
  instruction, 
  multiplier = 1, 
  initState = false, 
  handleToggle = (a, b) => {}
}) {
  const { showMessage } = useFlashMessage();

  const { id: ingredientId, name: ingredientName, image: ingredientImage } = ingredient;
  const { name: unitName, plural: unitPluralName } = unit;

  const [isChecked, setIsChecked] = useState(initState);
  const [wasAdded, setWasAdded] = useState(false);

  const toggleCheck = () => {
    handleToggle(ingredientId, !isChecked);
    setIsChecked(!isChecked);
  }

  const addToBag = () => {
    setWasAdded(true);
    showMessage(`${ingredientName} was added to the bag`, 'success');
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
      <div className={styles.addToBagWrapper}>
        <div className={styles.addToBagButtonWrapper}>
          <button 
            className={`${styles.addToBagButton} ${wasAdded ? styles.animated : null}`} 
            onClick={addToBag}
            onAnimationEnd={() => setWasAdded(false)}
            // onMouseEnter={() => showMessage(`Add ${ingredientName} to the bag`, 'warning')}
            // onMouseLeave={() => clearMessage()}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
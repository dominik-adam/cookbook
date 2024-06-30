import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/bagIngredients.module.css';
import { updateBagIngredient } from '@/utils/ingredients';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

export default function BagIngredient({ 
  ingredient, 
  amount: initAmount, 
  unit, 
  note: initNote,
  handleRemove
}) {
  const { showMessage } = useFlashMessage();

  const { id: ingredientId, name: ingredientName, image: ingredientImage } = ingredient;
  const { id: unitId, name: unitName, plural: unitPluralName } = unit;

  const [amount, setAmount] = useState(initAmount);
  const [note, setNote] = useState(initNote);
  const [newAmount, setNewAmount] = useState(initAmount);
  const [newNote, setNewNote] = useState(initNote);

  const [isHover, setIsHover] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const editBagIngredient = async () => {
    const response = await updateBagIngredient({ingredientId, unitId, newAmount, newNote});
    if (response.ok) {
      showMessage(`${ingredientName} was updated`, 'success');
      setAmount(newAmount);
      setNote(newNote);
      setIsEdit(false);
    } else {
      showMessage(`${ingredientName} could not be updated`, 'error');
    }
  }

  const toggleHover = () => {
    setIsHover(!isHover);
  };

  const image = isHover ? '/icons/close.png' : ingredientImage;

  return (
    <div 
      className={`${styles.ingredient} ${isEdit ? styles.editOn : undefined}`}
      onClick={() => setIsEdit(true)}
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
          setIsEdit(false);
          handleRemove(ingredientId, ingredientName, unitId)
        }}
        onMouseEnter={toggleHover}
        onMouseLeave={toggleHover}
      />
      {isEdit ? 
        <div className={styles.editInfo}>
          <div className={styles.amountWrapper}>
            <label className={styles.inputLabel}>
              Amount
            </label>
            <div className={styles.amountAndUnitWrapper}>
              <input
                type="number"
                className={styles.amountInput}
                value={newAmount}
                onChange={(event) => setNewAmount(parseFloat(event.target.value))}
                placeholder="Enter a number"
              />
              <div className={styles.unitWrapper}>
                {unitName}
              </div>
            </div>
          </div>
          <div className={styles.noteWrapper}>
            <label className={styles.inputLabel}>
              Note
            </label>
            <input
              className={styles.noteInput}
              type="text"
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              placeholder="Enter a note"
            />
          </div>
          <div className={styles.buttonWrapper}>
            <button
              className={styles.cancelButton}
              onClick={(event) => {
                event.stopPropagation();
                setIsEdit(false)
              }}
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              onClick={(event) => {
                event.stopPropagation();
                editBagIngredient()
              }}
            >
              Save
            </button>
          </div>
        </div> 
      :
        <div className={styles.ingredientInfo}>
          <span className={`${styles.ingredientName} ${isHover ? styles.crossedOut : null}`}>
            {ingredientName}
          </span>
          {(amount) && (
            <span className={`${styles.ingredientAmount} ${isHover ? styles.crossedOut : null}`}>
              {amount} {unitName ?? ""}
            </span>
          )}
          {(note) && (
            <span className={`${styles.ingredientNote} ${isHover ? styles.crossedOut : null}`}>
              {note}
            </span>
          )}
        </div>
      }
    </div>
  );
}
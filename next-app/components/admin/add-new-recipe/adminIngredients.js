import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import AdminIngredientModal from '@/components/admin/adminIngredientModal';
import AdminIngredient from '@/components/admin/add-new-recipe/adminIngredient';
import styles from '@/styles/ingredients.module.css';
import ingredientStyles from '@/styles/ingredient.module.css';
import { ModalState } from '@/components/admin/add-new-recipe/modal/modalState'

export default function AdminIngredients({ 
  serves = 2, 
  setServes,
  ingredients, 
  addIngredient,
  updateIngredient,
  deleteIngredient
}) {
  const [modalState, setModalState] = useState(ModalState.CLOSED)
  const [modalIngredient, setModalIngredient] = useState(undefined)
  const [updatedPosition, setUpdatedPosition] = useState(undefined)
  const newIngredientRef = useRef(null);

  const openUpdateModal = (i, ingredient) => {
    setModalIngredient(ingredient)
    setModalState(ModalState.UPDATE)
    setUpdatedPosition(i)
  }

  const handleUpdate = (ingredient, amount, unit, instruction) => {
    if (modalIngredient && updatedPosition !== undefined) {
      const { ingredient: ing, amount: a, unit: u, instruction: ins, ...otherStuff } = modalIngredient;
      updateIngredient(updatedPosition, {ingredient, amount, unit, instruction, otherStuff});
    }
  }

  useEffect(() => {
    newIngredientRef.current.focus();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.serves}>
        <span>Serves {serves}</span>
        <input 
          className={styles.slider} 
          type="range" 
          min="1" 
          max="10" 
          value={serves} 
          onChange={e => setServes(parseInt(e.target.value))}    
        />
      </div>
      <div className={styles.ingredients}>
        <ul>
          {ingredients.map(( ingredient, i ) => (
            <AdminIngredient 
              {...ingredient} 
              setModalState={setModalState}
              setModalIngredient={setModalIngredient}
              handleDelete={() => deleteIngredient(i)}
              handleUpdate={() => openUpdateModal(i, ingredient)}
              key={i}
            />
          ))}
          {console.log(ingredients)}
          <button 
            className={ingredientStyles.addIngredient}
            onClick={() => setModalState(ModalState.SELECT)}
            tabIndex={1}
            ref={newIngredientRef}
          >
            <Image
              className={ingredientStyles.ingredientImage}
              src={'/icons/plus.jpg'}
              style={{objectFit: "cover", cursor: "pointer"}}
              height={80}
              width={80}
            />
            <div className={ingredientStyles.ingredientInfo}>
              <span className={`${ingredientStyles.ingredientName}`}>
                Add ingredient
              </span>
            </div>
          </button>
          <AdminIngredientModal
            modalState={modalState}
            modalIngredient={modalIngredient}
            setModalState={setModalState}
            setModalIngredient={setModalIngredient}
            serves={serves}
            addIngredient={addIngredient}
            updateIngredient={handleUpdate}
            newIngredientRef={newIngredientRef}
          />
          
        </ul>
      </div>
    </div>
  );
}
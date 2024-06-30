import styles from '@/styles/ingredients.module.css';
import Ingredient from './ingredient';
import { useState, useEffect } from 'react';
import { updateRecipeState, clearRecipeState, addIngredientsToBag } from '@/utils/ingredients';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

export default function Ingredients({ recipeId, serves, ingredients, initSliderState, initIngredientState }) {

  const { showMessage } = useFlashMessage();

  const [slider, setSlider] = useState(initSliderState);
  const [ingredientState, setIngredientState] = useState(initIngredientState ?? Array(ingredients.length).fill('0').join(''));

  const handleSliderChange = (value) => {
    setSlider(value);
  }

  const handleIngredientToggle = (key, isChecked) => {
    const updatedKeyState = [...ingredientState];
    const index = ingredients.findIndex((item) => item.ingredientId === key);
    updatedKeyState[index] = isChecked ? '1' : '0';
    const newKeystate = updatedKeyState.join('');
    
    setIngredientState(newKeystate);
    updateRecipeState({
      recipeId,
      ingredient: {
        index,
        newState: newKeystate
      }
    });
  }

  const handleClear = async () => {
    const clearState = Array(ingredients.length).fill('0').join('');
    setIngredientState(clearState);
    const response = await clearRecipeState({ recipeId, clearState });
    if (response.ok) {
      showMessage('Recipe state cleared successfuly', 'success');
    } else {
      const { error } = await response.json();
      showMessage(`Error clearing recipe state: ${error}`, 'error');
    }
  }

  const addAllIngredientsToBag = async () => {
    const filteredIngredients = ingredients.filter((ingredient, index) => ingredientState[index] === '0');
    const response = await addIngredientsToBag({ ingredients: filteredIngredients });
    if (response.ok) {
      showMessage('Recipe added to the bag successfuly', 'success');
    } else {
      const { error } = await response.json();
      showMessage(`Error adding recipe to the bag: ${error}`, 'error');
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      updateRecipeState({recipeId, slider});
    }, 300);
  
    return () => {
      clearTimeout(timer);
    };
  }, [slider]);

  return (
    <div className={styles.container}>
      <div className={styles.serves}>
        <span>Serves {slider}</span>
        <input 
          className={styles.slider} 
          type="range" 
          min="1" 
          max="10" 
          value={slider} 
          onChange={e => handleSliderChange(e.target.value)}    
        />
      </div>
      <div className={styles.ingredients}>
        <ul>
          {ingredients.map(( ingredient, i ) => (
            <Ingredient 
              {...ingredient} 
              multiplier={slider / serves} 
              key={ingredient.id}
              isChecked={ingredientState[i] == '1'}
              handleToggle={handleIngredientToggle}
            />
          ))}   
        </ul>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.clearButton}
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          className={styles.addToBagButton}
          onClick={addAllIngredientsToBag}
        >
          Add to bag
        </button>
      </div>
    </div>
  );
}
import styles from '@/styles/ingredients.module.css';
import Ingredient from './ingredient';
import { useState, useEffect } from 'react';
import { updateRecipeState } from '@/utils/ingredients';

export default function Ingredients({ recipeId, serves, ingredients, initSliderState, initIngredientState }) {

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
              initState={ingredientState[i] == '1'}
              handleToggle={handleIngredientToggle}
            />
          ))}   
        </ul>
      </div>
    </div>
  );
}
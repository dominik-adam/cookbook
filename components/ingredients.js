import styles from './ingredients.module.css';
import Ingredient from '../components/ingredient';
import { useState } from 'react';
import { useRouter } from 'next/router'

export default function Ingredients({ ingredients, initServes }) {

  const router = useRouter();
  const queryString = router.asPath.split('?')[1];
  const searchParams = new URLSearchParams(queryString);
  const [slider, setSlider] = useState(searchParams.get('serves') ?? initServes);
  const [ingredientState, setIngredientState] = useState(searchParams.get('ingredients') ?? Array(ingredients.length).fill('0').join(''));

  const handleSliderChange = (value) => {
    setSlider(value);
    const url = new URL(window.location);
    url.searchParams.set('serves', value);
    router.replace(url.toString(), undefined, { scroll: false });
  }

  const handleIngredientToggle = (key, isChecked) => {
    const updatedKeyState = [...ingredientState];
    const index = ingredients.findIndex((item) => item.ingredient === key);
    updatedKeyState[index] = isChecked ? '1' : '0';
    const newKeystate = updatedKeyState.join('');

    const url = new URL(window.location);
    url.searchParams.set('ingredients', newKeystate);
    router.replace(url.toString(), undefined, { scroll: false });
    setIngredientState(updatedKeyState);
  }

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
          {ingredients.map(( recipeData, i ) => (
            <Ingredient 
              {...recipeData} 
              multiplier={slider / initServes} 
              key={recipeData.ingredient}
              initState={ingredientState[i] == '1'}
              handleToggle={handleIngredientToggle}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
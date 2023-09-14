import styles from './ingredients.module.css';
import Ingredient from '../components/ingredient';

export default function Ingredients({ ingredients }) {

  return (
    <div className={styles.container}>
      <ul>
        {ingredients.map(( recipeData ) => (
          <Ingredient {...recipeData} key={recipeData.ingredient}/>
        ))}
      </ul>
    </div>
  );
}
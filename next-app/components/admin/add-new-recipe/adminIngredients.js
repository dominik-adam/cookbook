import AddIngredient from '../addIngredient';
import AdminIngredient from '@/components/admin/add-new-recipe/adminIngredient';
import styles from '@/styles/ingredients.module.css';

export default function AdminIngredients({ 
  serves = 2, 
  setServes,
  ingredients, 
  addIngredient,
  deleteIngredient
}) {
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
              key={i}
              handleClick={() => deleteIngredient(i)}
            />
          ))}
          {addIngredient &&
            <AddIngredient
              serves={serves}
              addIngredient={addIngredient}
            />
          }
          
        </ul>
      </div>
    </div>
  );
}
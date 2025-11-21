import Image from 'next/image';
import { useState } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';
import styles from "@/styles/add-new-recipe/modal/addNewIngredient.module.css"

export default function AddNewIngredient({
  selectIngredient,
  initialName = ""
}) {
	const [newIngredientName, setNewIngredientName] = useState(initialName);
	const [newIngredientImage, setNewIngredientImage] = useState();
	const [newIngredientImageUrlObj, setNewIngredientImageUrlObj] = useState();
	const [caloriesPer100g, setCaloriesPer100g] = useState(null);
	const [proteinPer100g, setProteinPer100g] = useState(null);
	const [carbsPer100g, setCarbsPer100g] = useState(null);
	const [fatPer100g, setFatPer100g] = useState(null);
  const inputRef = useRef(null);

	function handleNewIngredientImageChange(e) {
		setNewIngredientImage(e.target.files[0]);
    setNewIngredientImageUrlObj(URL.createObjectURL(e.target.files[0]));
	}

  useEffect(() => {
    // Focus on the input element when the component mounts
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    // Update the ingredient name when initialName changes
    setNewIngredientName(initialName);
  }, [initialName]);

	const saveIngredient = async (event) => {
    event.preventDefault();
		if (!newIngredientName) {
      // Name is required
			return;
		}

    try {
      let imagePath = null;

      // Upload image only if provided
      if (newIngredientImage) {
        const formData = new FormData();
        formData.append('file', newIngredientImage);

        const addNewFileResponse = await fetch('/api/add-new-ingredient-image', {
          method: 'POST',
          body: formData,
        });

        if (!addNewFileResponse.ok) {
          const { error } = await addNewFileResponse.json();
          console.log(`Error: ${error}`);
          return;
        }

        const { filepath } = await addNewFileResponse.json();
        imagePath = filepath;
      }

      const addNewIngredientResponse = await fetch('/api/add-new-ingredient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newIngredientName,
          image: imagePath,
          caloriesPer100g: caloriesPer100g,
          proteinPer100g: proteinPer100g,
          carbsPer100g: carbsPer100g,
          fatPer100g: fatPer100g,
        }),
      });

      if (!addNewIngredientResponse.ok) {
        const { error } = await addNewIngredientResponse.json();
        console.log(`Error: ${error}`);
        return;
      }

      const { ingredient } = await addNewIngredientResponse.json();
      selectIngredient(ingredient);
    } catch (error) {
      console.log(error);
    }
	}

  return (
    <>
      <div className={styles.ingredientNameWrapper}>
        <label className={styles.inputLabel}>
          Ingredient name
        </label>
        <input
          ref={inputRef}
          className={styles.ingredientNameInput}
          type="text"
          placeholder="Enter name..."
          value={newIngredientName}
          onChange={(event) => setNewIngredientName(event.target.value)}
        />
      </div>
      <div className={styles.ingredientImageWrapper}>
        <label className={styles.inputLabel}>
          Ingredient image (optional)
        </label>
        <div className={styles.ingredientImageDragAndDrop}>
          <input
            className={styles.ingredientImageInput}
            type="file"
            onChange={handleNewIngredientImageChange}
          />
          {newIngredientImageUrlObj ? <Image
            className={styles.ingredientImageImage}
            src={newIngredientImageUrlObj}
            style={{objectFit: "cover", cursor: "pointer"}}
            layout='fill'
            objectFit='cover'
            objectPosition='center'
            alt="New ingredient image"
          /> :
          <div className={styles.ingredientImagePlaceholder}>
            <span>
              Click and select
            </span>
            <span>
              <b>OR</b>
            </span>
            <span>
              Drag & Drop
            </span>
          </div>
          }
        </div>
      </div>
      <div className={styles.ingredientNameWrapper}>
        <label className={styles.inputLabel}>
          Nutritional Information (optional, per 100g)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className={styles.ingredientNameWrapper}>
            <label className={styles.inputLabel} style={{ fontSize: '0.85rem', paddingBottom: '3px' }}>
              Calories
            </label>
            <input
              className={styles.ingredientNameInput}
              type="number"
              step="0.1"
              placeholder="e.g., 250"
              value={caloriesPer100g ?? ''}
              onChange={(e) => setCaloriesPer100g(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.ingredientNameWrapper}>
            <label className={styles.inputLabel} style={{ fontSize: '0.85rem', paddingBottom: '3px' }}>
              Protein (g)
            </label>
            <input
              className={styles.ingredientNameInput}
              type="number"
              step="0.1"
              placeholder="e.g., 15.5"
              value={proteinPer100g ?? ''}
              onChange={(e) => setProteinPer100g(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.ingredientNameWrapper}>
            <label className={styles.inputLabel} style={{ fontSize: '0.85rem', paddingBottom: '3px' }}>
              Carbs (g)
            </label>
            <input
              className={styles.ingredientNameInput}
              type="number"
              step="0.1"
              placeholder="e.g., 30.2"
              value={carbsPer100g ?? ''}
              onChange={(e) => setCarbsPer100g(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.ingredientNameWrapper}>
            <label className={styles.inputLabel} style={{ fontSize: '0.85rem', paddingBottom: '3px' }}>
              Fat (g)
            </label>
            <input
              className={styles.ingredientNameInput}
              type="number"
              step="0.1"
              placeholder="e.g., 8.5"
              value={fatPer100g ?? ''}
              onChange={(e) => setFatPer100g(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
        </div>
      </div>
      <div className={styles.submitButtonWrapper}>
        <button
          className={styles.submitButton}
          onClick={saveIngredient}
          disabled={!newIngredientName}
        >
          Save Ingredient
        </button>
      </div>
    </>
  );
}
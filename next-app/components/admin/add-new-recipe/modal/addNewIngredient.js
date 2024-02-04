import Image from 'next/image';
import { useState } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';
import styles from "@/styles/add-new-recipe/modal/addNewIngredient.module.css"

export default function AddNewIngredient({ 
  backToIngredientSelection
}) {
	const [newIngredientName, setNewIngredientName] = useState(undefined);
	const [newIngredientImage, setNewIngredientImage] = useState();
	const [newIngredientImageUrlObj, setNewIngredientImageUrlObj] = useState();
  const inputRef = useRef(null);

	function handleNewIngredientImageChange(e) {
		setNewIngredientImage(e.target.files[0]);
    setNewIngredientImageUrlObj(URL.createObjectURL(e.target.files[0]));
	}

  useEffect(() => {
    // Focus on the input element when the component mounts
    inputRef.current.focus();
  }, []);

	const saveIngredient = async (event) => {
    event.preventDefault();
		if (!newIngredientName || !newIngredientImage) {
      // wrong form data alert
			return;
		}

    try {
      const formData = new FormData();
      formData.append('file', newIngredientImage);

      const addNewFileResponse = await fetch('/api/add-new-ingredient-image', {
        method: 'POST',
        body: formData,
      });

      if (!addNewFileResponse.ok) {
        const { error } = await addNewFileResponse.json();
        console.log(`Error: ${error}`);
      }

      const { filepath } = await addNewFileResponse.json();

      const addNewIngredientResponse = await fetch('/api/add-new-ingredient', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newIngredientName, image: filepath }),
      });

      if (!addNewIngredientResponse.ok) {
        const { error } = await addNewIngredientResponse.json();
        console.log(`Error: ${error}`);
      }

      backToIngredientSelection();
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
          onChange={(event) => setNewIngredientName(event.target.value)}
        />
      </div>
      <div className={styles.ingredientImageWrapper}>
        <label className={styles.inputLabel}>
          Ingredient image
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
      <div className={styles.submitButtonWrapper}>
        <button 
          className={styles.submitButton}
          onClick={saveIngredient}
          disabled={!newIngredientName || !newIngredientImage}
        >
          Save Ingredient
        </button>
      </div>
    </>
  );
}
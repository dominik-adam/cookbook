import Image from 'next/image';
import styles from '@/styles/add-new-recipe/modal/measurement.module.css';
import { useState, useEffect, useRef } from 'react';

export default function MeasurementAndInstructions({
  ingredient,
  amount,
  unit,
  instruction,
  serves,
  setUnit,
  setAmount,
  setInstructions,
  addIngredient,
  isUpdate,
  updateIngredient
}) {

  const [units, setUnits] = useState([]);
  const inputRef = useRef(null);

  const fetchUnits = async () => {
		try {
			const response = await fetch(`/api/get-units`);
			if (!response.ok) {
				throw new Error('Failed to fetch units');
			}
			const { units } = await response.json();
			setUnits(units);
		} catch (error) {
			console.error('Error fetching units:', error);
		}
	};

  useEffect(() => {
    fetchUnits();
    inputRef.current.focus();
  }, []);

  return (
    <>
      <div className={styles.parentDiv}>
        <div className={styles.ingredientImageWrapper}>
          <Image
            className={styles.ingredientImage}
            src={ingredient ? ingredient.image : ""}
            alt={ingredient ? ingredient.title : ""}
            sizes="(max-width: 600px) 50vw, 20vw"
            style={{objectFit: "cover"}}
            quality={50}
            height={200}
            width={200}
          />
          <div className={styles.ingredientName}>
            <span>
              {ingredient ? ingredient.name : ""}
            </span>
          </div>
        </div>
        <div className={styles.ingredientInfo}>
          <div className={styles.amountWrapper}>
            <label className={styles.inputLabel}>
              Amount per {serves} servings
            </label>
            <input
              type="number"
              className={styles.amountInput}
              value={isUpdate ? amount : undefined}
              onChange={(event) => setAmount(parseFloat(event.target.value))}
              placeholder="Enter a number"
              ref={inputRef}
            />
          </div>
          <div className={styles.unitWrapper}>
            <label className={styles.inputLabel}>
              Unit
            </label>
            <select 
              className={styles.unitSelect}
              value={unit ? unit.id : undefined}
              onChange={(event) => setUnit(units.find(unit => unit.id === event.target.value))}
            >
              <option value="">Select a measurement unit</option>
              {units.map((unit) => (
                <option 
                  value={unit.id}
                  key={unit.id}
                >
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.instructionWrapper}>
            <label className={styles.inputLabel}>
              Instruction
            </label>
            <input
              className={styles.instructionInput}
              type="text"
              value={isUpdate ? instruction : undefined}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Enter an instruction"
            />
          </div>
        </div>
      </div>
      <div className={styles.submitButtonWrapper}>
        {isUpdate ?
          <button 
          className={styles.submitButton}
          onClick={updateIngredient}
        >
          Update Ingredient
        </button> 
        :
        <button 
          className={styles.submitButton}
          onClick={addIngredient}
        >
          Add Ingredient
        </button>
        }
      </div>
    </>
  );
}
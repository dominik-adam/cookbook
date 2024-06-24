import Image from 'next/image';
import { useState } from 'react';
import styles from '@/styles/ingredient.module.css';
import SelectIngredient from './add-new-recipe/modal/selectIngredient';
import AddNewIngredient from './add-new-recipe/modal/addNewIngredient';
import MeasurementAndInstructions from './add-new-recipe/modal/measurementAndInstructions';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

export default function AddIngredient({ serves, addIngredient }) {

	const { showMessage } = useFlashMessage();

	const [isOpen, setIsOpen] = useState(false);
	const [modalTitle, setModalTitle] = useState("Select ingredient")
	
	const [ingredient, setIngredient] = useState(undefined);
	const [unit, setUnit] = useState(undefined);
	const [amount, setAmount] = useState(undefined);
	const [instruction, setInstruction] = useState("");

	const openModal = () => {
    setIsOpen(true);
	}

	const closeModal = () => {
		setIsOpen(false);
		setModalTitle("Select ingredient");
		setIngredient(undefined);
		setUnit(undefined);
		setAmount(undefined);
		setInstruction(undefined);
	}

	const selectIngredient = (ingredient) => {
		setIngredient(ingredient);
		setModalTitle("Measurement and Instructions");
	}

	const createNewIngredient = () => {
		setModalTitle("Create new ingredient");
  }

  const backToIngredientSelection = () => {
    setModalTitle("Select ingredient");
    fetchIngredients(searchTerm);
  }

  const addIngredientWrapper = () => {
		if (!unit) {
			showMessage("Unit must be entered", "error");
			return;
		}
    addIngredient({
      ingredient,
      amount,
      unit,
      instruction
    });
    closeModal();
  }

  return (
		<>
			<div 
				className={styles.addIngredient}
				onClick={openModal}
			>
				<Image
					className={styles.ingredientImage}
					src={'/icons/plus.jpg'}
					style={{objectFit: "cover", cursor: "pointer"}}
					height={80}
					width={80}
				/>
				<div className={styles.ingredientInfo}>
					<span className={`${styles.ingredientName}`}>
						Add ingredient
					</span>
				</div>
			</div>
			{isOpen && <div className={`${styles.modalWindow} ${isOpen ? styles.modalWindowOpened : null}`}>
				<div className={styles.modalWindowContent}>
					<div className={styles.modalWindowHeader}>
						<div className={styles.modalWindowTitle}>
							<b>{modalTitle}</b>
						</div>
						<Image
							className={styles.modalCloseButton}
							src={'/icons/close.png'}
							style={{objectFit: "cover", cursor: "pointer"}}
							height={40}
							width={40}
							onClick={closeModal}
						/>
					</div>
					<div className={styles.modalWindowBody}>
						{modalTitle === "Select ingredient" ?
							<SelectIngredient
                selectIngredient={selectIngredient}
                createNewIngredient={createNewIngredient}
              /> : modalTitle === "Create new ingredient" ?
							<AddNewIngredient
                backToIngredientSelection={backToIngredientSelection}
              /> : modalTitle === "Measurement and Instructions" ?
							<MeasurementAndInstructions
                ingredient={ingredient}
                serves={serves}
                setUnit={setUnit}
                setAmount={setAmount}
                setInstructions={setInstruction}
                addIngredient={addIngredientWrapper}
              /> :
							<>
								Nothing but ( . )( . )
							</>
						}
					</div>
				</div>
			</div>
			}
		</>
  );
}
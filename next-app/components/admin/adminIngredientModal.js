import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from '@/styles/adminIngredientsModal.module.css';
import SelectIngredient from './add-new-recipe/modal/selectIngredient';
import AddNewIngredient from './add-new-recipe/modal/addNewIngredient';
import MeasurementAndInstructions from './add-new-recipe/modal/measurementAndInstructions';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';
import { ModalState } from '@/components/admin/add-new-recipe/modal/modalState'

export default function AdminIngredientModal({ 
	modalState,
	modalIngredient,
	setModalState,
	setModalIngredient,
	serves, 
	addIngredient,
	updateIngredient,
	newIngredientRef
}) {

	const { showMessage } = useFlashMessage();

	const [modalTitle, setModalTitle] = useState("Select ingredient")

	const [ingredient, setIngredient] = useState(undefined);
	const [unit, setUnit] = useState(undefined);
	const [amount, setAmount] = useState(undefined);
	const [instruction, setInstruction] = useState("");
	const [initialIngredientName, setInitialIngredientName] = useState("");

	const isOpen = modalState !== ModalState.CLOSED;

	const closeModal = () => {
		setModalState(ModalState.CLOSED)
    setModalIngredient(undefined)
		setModalTitle("");
		setIngredient(undefined);
		setUnit(undefined);
		setAmount(undefined);
		setInstruction("");
		if (newIngredientRef) {
			newIngredientRef.current.focus();
		}
	}

	const selectIngredient = (ingredient) => {
		setIngredient(ingredient);
		setModalTitle("Measurement and Instructions");
		setModalState(ModalState.MEASUREMENT_AND_INSTRUCTIONS);
	}

	const createNewIngredient = (searchTerm = "") => {
		setInitialIngredientName(searchTerm);
		setModalTitle("Create new ingredient");
		setModalState(ModalState.CREATE);
  }

	const updateIngredientWrapper = () => {
		if (!unit) {
			showMessage("Unit must be entered", "error");
			return;
		}
		updateIngredient(ingredient, amount, unit, instruction);
		closeModal();
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

	useEffect(() => {
    if (modalIngredient) {
      setIngredient(modalIngredient.ingredient);
      setAmount(modalIngredient.amount);
      setUnit(modalIngredient.unit);
      setInstruction(modalIngredient.instruction);
    }
  }, [modalIngredient]);

  return (
		<>
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
						{modalState == ModalState.SELECT ?
							<SelectIngredient
                selectIngredient={selectIngredient}
                createNewIngredient={createNewIngredient}
              /> : modalState == ModalState.CREATE ?
							<AddNewIngredient
                selectIngredient={selectIngredient}
                initialName={initialIngredientName}
              /> : modalState == ModalState.MEASUREMENT_AND_INSTRUCTIONS || modalState == ModalState.UPDATE ?
							<MeasurementAndInstructions
                ingredient={ingredient}
								amount={amount}
								unit={unit}
								instruction={instruction}
                serves={serves}
                setUnit={setUnit}
                setAmount={setAmount}
                setInstructions={setInstruction}
                addIngredient={addIngredientWrapper}
								isUpdate={modalState == ModalState.UPDATE}
								updateIngredient={updateIngredientWrapper}
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
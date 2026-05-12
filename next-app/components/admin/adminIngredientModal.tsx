import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from '@/styles/adminIngredientsModal.module.css';
import SelectIngredient from './add-new-recipe/modal/selectIngredient';
import AddNewIngredient from './add-new-recipe/modal/addNewIngredient';
import MeasurementAndInstructions from './add-new-recipe/modal/measurementAndInstructions';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';
import { ModalState } from '@/components/admin/add-new-recipe/modal/modalState'
import type { Ingredient, IngredientUnit, RecipeIngredient } from '@/types/recipe';

type RecipeIngredientInput = {
  ingredient: Ingredient;
  amount: number | null;
  unit: IngredientUnit;
  instruction: string | null;
};

type AdminIngredientModalProps = {
  modalState: symbol;
  modalIngredient: RecipeIngredient | undefined;
  setModalState: (state: symbol) => void;
  setModalIngredient: (ingredient: RecipeIngredient | undefined) => void;
  serves: number | null;
  addIngredient: (ingredient: RecipeIngredientInput) => void;
  updateIngredient: (ingredient: Ingredient, amount: number | null, unit: IngredientUnit, instruction: string) => void;
  newIngredientRef: React.RefObject<HTMLButtonElement> | null;
};

export default function AdminIngredientModal({
  modalState,
  modalIngredient,
  setModalState,
  setModalIngredient,
  serves,
  addIngredient,
  updateIngredient,
  newIngredientRef
}: AdminIngredientModalProps) {

  const { showMessage } = useFlashMessage();

  const [modalTitle, setModalTitle] = useState<string>("Select ingredient")

  const [ingredient, setIngredient] = useState<Ingredient | undefined>(undefined);
  const [unit, setUnit] = useState<IngredientUnit | undefined>(undefined);
  const [amount, setAmount] = useState<number | null | undefined>(undefined);
  const [instruction, setInstruction] = useState<string>("");
  const [initialIngredientName, setInitialIngredientName] = useState<string>("");

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
      newIngredientRef.current?.focus();
    }
  }

  const selectIngredient = (ingredient: Ingredient) => {
    setIngredient(ingredient);
    setModalTitle("Measurement and Instructions");
    setModalState(ModalState.MEASUREMENT_AND_INSTRUCTIONS);
  }

  const createNewIngredient = (searchTerm: string = "") => {
    setInitialIngredientName(searchTerm);
    setModalTitle("Create new ingredient");
    setModalState(ModalState.CREATE);
  }

  const updateIngredientWrapper = () => {
    if (!unit || !ingredient) {
      showMessage("Unit must be entered", "error");
      return;
    }
    updateIngredient(ingredient, amount ?? null, unit, instruction);
    closeModal();
  }

  const addIngredientWrapper = () => {
    if (!unit || !ingredient) {
      showMessage("Unit must be entered", "error");
      return;
    }
    addIngredient({
      ingredient,
      amount: amount ?? null,
      unit,
      instruction: instruction || null
    });
    closeModal();
  }

  useEffect(() => {
    if (modalIngredient) {
      setIngredient(modalIngredient.ingredient);
      setAmount(modalIngredient.amount);
      setUnit(modalIngredient.unit);
      setInstruction(modalIngredient.instruction ?? "");
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
              alt="Close modal"
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

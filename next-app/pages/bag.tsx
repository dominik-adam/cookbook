import Head from 'next/head';
import Layout from '../components/layout';
import Image from 'next/image';
import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options'
import { prisma } from "@/utils/prisma";
import { getCanonicalEmail } from '@/utils/auth';
import styles from '@/styles/bagIngredients.module.css';

import BagIngredient from '@/components/bag/bagIngredient';
import { useState, useEffect } from 'react';
import { addIngredientToBag, removeBagIngredient, getBagIngredients } from '@/utils/ingredients'
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';
import AdminIngredientModal from '@/components/admin/adminIngredientModal';
import { ModalState } from '@/components/admin/add-new-recipe/modal/modalState'
import { GetServerSidePropsContext } from 'next';
import { Socket } from 'socket.io-client';
import { calculateIngredientNutrition } from '@/utils/nutritionCalculations';

import io from 'socket.io-client'

let socket: Socket | undefined;

interface BagIngredient {
  ingredientId: string;
  unitId: string;
  amount?: number;
  note?: string;
  ingredient: {
    id: string;
    name: string;
    image: string;
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
  };
  unit: {
    id: string;
    name: string;
  };
}

interface IngredientToAdd {
  ingredient: {
    id: string;
    name: string;
  };
  unit: {
    id: string;
  };
  amount?: number;
  instruction?: string;
}

interface BagProps {
  bagIngredients?: BagIngredient[];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res } = context;

  const session = await getServerSession(req, res, options);

  if (session && session.user?.email) {

    try {
      const user = await prisma.user.findUnique({
        where: {
          email: getCanonicalEmail(session.user.email),
        },
      });

      if (user) {
        const bagIngredients = await prisma.bagIngredient.findMany({
          where: {
            userId: user.id,
          },
          include: {
            ingredient: true,
            unit: true
          },
          orderBy: {
            order: 'asc',
          }
        });

        if (bagIngredients != null) {
          return {
            props: {
              bagIngredients: JSON.parse(JSON.stringify(bagIngredients))
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching bag ingredients:', error);
    }
  }

  return {
    props: {}
  }
}

export default function ShoppingBag({ bagIngredients: initBagIngredients }: BagProps) {

  const { showMessage } = useFlashMessage();

  const siteTitle = 'My Shopping Bag';

  const [bagIngredients, setBagIngredients] = useState<BagIngredient[]>(initBagIngredients ?? []);
  const [modalState, setModalState] = useState(ModalState.CLOSED)
  const [modalIngredient, setModalIngredient] = useState<any>(undefined)

  // Calculate total nutrition for all bag ingredients
  const totalNutrition = bagIngredients.reduce((acc, bagIngredient) => {
    const nutrition = calculateIngredientNutrition(
      bagIngredient.ingredient,
      bagIngredient.amount || 0,
      bagIngredient.unit.name
    );

    if (nutrition.calories) {
      acc.calories += nutrition.calories;
      acc.protein += nutrition.protein || 0;
      acc.carbs += nutrition.carbs || 0;
      acc.fat += nutrition.fat || 0;
      acc.hasData = true;
    }

    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, hasData: false });

  const addIngredient = async (ingredient: IngredientToAdd) => {
    const response = await addIngredientToBag({
      ingredientId: ingredient.ingredient.id,
      unitId: ingredient.unit.id,
      amount: ingredient.amount,
      note: ingredient.instruction
    });
    if (response.ok) {
      refreshBag();
      showMessage(`${ingredient.ingredient.name} was added to the bag`, 'success');
    } else {
      showMessage(`${ingredient.ingredient.name} could not be added to the bag`, 'error');
    }
  }

  const refreshBag = async () => {
    try {
			const response = await getBagIngredients();
			if (!response.ok) {
				throw new Error('Failed to fetch ingredients');
			}
			const { bagIngredients: newBag } = await response.json();
			setBagIngredients(newBag);
		} catch (error) {
			console.error('Error fetching ingredients:', error);
		}
  }

  const removeIngredient = (key: number) => async (ingredientId: string, ingredientName: string, unitId: string) => {
    const response = await removeBagIngredient(ingredientId, unitId);
    if (response.ok) {
      setBagIngredients((prevIngredients) => {
        const updatedIngredients = [...prevIngredients];
        updatedIngredients.splice(key, 1);
        return updatedIngredients;
      });

      if (socket) {
        socket.emit('removed-from-bag', key);
      }
      showMessage(`${ingredientName} was removed from the bag`, 'success');
    } else {
      showMessage(`${ingredientName} could not be removed from the bag`, 'error');
    }
  }

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('/api/socket');
      socket = io();

      socket.on('connect', () => {
        console.log('connected');
      });

      socket.on('remove-from-bag', (key: number) => {
        setBagIngredients((prevIngredients) => {
          const updatedIngredients = [...prevIngredients];
          updatedIngredients.splice(key, 1);
          return updatedIngredients;
        });
      });
    };

    socketInitializer();

    return () => {
      if (socket) {
        socket.disconnect();
        console.log('Socket disconnected');
      }
    };
  }, []);

  return (
    <Layout pageTitle={"Shopping Bag"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>

      {totalNutrition.hasData && (
        <div className={styles.nutritionSummary}>
          <h2>Total Nutrition</h2>
          <div className={styles.nutritionGrid}>
            <div className={styles.nutritionItem}>
              <span className={styles.nutritionLabel}>Calories</span>
              <span className={styles.nutritionValue}>{Math.round(totalNutrition.calories)}</span>
            </div>
            {totalNutrition.protein > 0 && (
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionLabel}>Protein</span>
                <span className={styles.nutritionValue}>{Math.round(totalNutrition.protein * 10) / 10}g</span>
              </div>
            )}
            {totalNutrition.carbs > 0 && (
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionLabel}>Carbs</span>
                <span className={styles.nutritionValue}>{Math.round(totalNutrition.carbs * 10) / 10}g</span>
              </div>
            )}
            {totalNutrition.fat > 0 && (
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionLabel}>Fat</span>
                <span className={styles.nutritionValue}>{Math.round(totalNutrition.fat * 10) / 10}g</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.bagIngredients}>
        {bagIngredients.map(( bagIngredient, i ) => (
          <BagIngredient
            key={bagIngredient.ingredientId + bagIngredient.unitId + bagIngredient.amount}
            ingredient={bagIngredient.ingredient}
            amount={bagIngredient.amount}
            unit={bagIngredient.unit}
            note={bagIngredient.note}
            handleRemove={removeIngredient(i)}
          />
        ))}
        <div
          className={styles.ingredient}
          onClick={() => {setModalState(ModalState.SELECT)}}
        >
          <Image
            className={styles.ingredientImage}
            src={'/icons/plus.jpg'}
            style={{objectFit: "cover"}}
            height={80}
            width={80}
            alt={"Add new bag item"}
          />
          <div className={styles.ingredientInfo}>
            <span className={styles.ingredientName}>
              Add new item
            </span>
          </div>
        </div>
      </div>
      <AdminIngredientModal
        modalState={modalState}
        modalIngredient={modalIngredient}
        setModalState={setModalState}
        setModalIngredient={setModalIngredient}
        serves={null}
        addIngredient={addIngredient}
        updateIngredient={() => {}}
        newIngredientRef={null}
      />
    </Layout>
  );
}

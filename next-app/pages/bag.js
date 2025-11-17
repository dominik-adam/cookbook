import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
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

import io from 'socket.io-client'
let socket

export async function getServerSideProps(context) {
  const { params, req, res } = context;

  const session = await getServerSession(req, res, options);

  if (session) {

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
              bagIngredients
            }
          }
        }
      }
    }
  }

  return {
    props: {}
  }
}

export default function ShoppingBag({bagIngredients: initBagIngredients}) {

  const { showMessage } = useFlashMessage();

  const [bagIngredients, setBagIngredients] = useState(initBagIngredients ?? []);
  const [modalState, setModalState] = useState(ModalState.CLOSED)
  const [modalIngredient, setModalIngredient] = useState(undefined)

  const addIngredient = async (ingredient) => {
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

  const removeIngredient = (key) => async (ingredientId, ingredientName, unitId) => {
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
  
      socket.on('remove-from-bag', key => {
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
      <div className={styles.bagIngredients}>
        {bagIngredients.map(( bagIngredient, i ) => (
          <BagIngredient 
            key={bagIngredient.ingredientId + bagIngredient.unitId + bagIngredient.amount}
            {...bagIngredient}
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
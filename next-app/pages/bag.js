import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import Image from 'next/image';
import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options'
import { PrismaClient } from "@prisma/client"
import styles from '@/styles/bagIngredients.module.css';

import BagIngredient from '@/components/bag/bagIngredient';
import { useState } from 'react';
import { removeBagIngredient } from '@/utils/ingredients'
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

export async function getServerSideProps(context) {
  const { params, req, res } = context;

  const session = await getServerSession(req, res, options);
  const prisma = new PrismaClient();

  if (session) {

    try {    
      const user = await prisma.user.findUnique({
        where: {
          email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
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
        });
  
        if (bagIngredients != null) {
          return {
            props: {
              bagIngredients
            }
          }
        }
      }
    } finally {
      await prisma.$disconnect();
    }
  }

  return {
    props: {}
  }
}

export default function ShoppingBag({bagIngredients: initBagIngredients}) {

  const { showMessage } = useFlashMessage();

  const [bagIngredients, setBagIngredients] = useState(initBagIngredients ?? []);

  const removeIngredient = (key) => async (ingredientId, ingredientName, unitId) => {
    const response = await removeBagIngredient(ingredientId, unitId);
    if (response.ok) {
      const updatedIngredients = [...bagIngredients];
      updatedIngredients.splice(key, 1);
      setBagIngredients(updatedIngredients);
      showMessage(`${ingredientName} was removed from the bag`, 'success');
    } else {
      showMessage(`${ingredientName} could not be removed from the bag`, 'error');
    }
  }

  return (
    <Layout pageTitle={"Shopping Bag"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div className={styles.bagIngredients}>
        {bagIngredients.map(( bagIngredient, i ) => (
          <BagIngredient 
            key={i}
            {...bagIngredient}
            handleRemove={removeIngredient(i)}
          />
        ))}
        <div 
          className={styles.ingredient}
          onClick={() => {}}
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
    </Layout>
  );
}
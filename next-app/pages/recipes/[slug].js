import Head from 'next/head';
import Layout from '@/components/layout';
import Ingredients from '@/components/recipe/ingredients';
import styles from '@/styles/recipe.module.css';
import YoutubeVideo from '@/components/youtube';
import RecipeLink from '@/components/link';
import adminStyles from '@/styles/add-new-recipe/addNewRecipe.module.css';

import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'

import { remark } from 'remark';
import html from 'remark-html';

import { PrismaClient } from "@prisma/client"
import { useRouter } from 'next/router';
import { isAdmin } from '@/utils/auth.js';


export async function getServerSideProps(context) {
  const { params, req, res } = context;
  const { slug } = params;
  
  const prisma = new PrismaClient()

  try {
    const recipe = await prisma.recipe.findUnique({
      where: {
        slug: slug,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
          orderBy: {
            id: 'asc'
          }
        },
      },
    });
  
    const processedContent = await remark()
      .use(html)
      .process(recipe.instructions);
    recipe.instructions = processedContent.toString();
  
    if (!recipe) {
      return {
        notFound: true,
      };
    }
  
    const session = await getServerSession(req, res, options);
  
    if (session) {
      const user = await prisma.user.findUnique({
        where: {
          email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
        },
      });
  
      if (user) {
        const initIngredientState = await prisma.recipeIngredientState.findUnique({
          where: {
            id: {
              userId: user.id,
              recipeId: recipe.id,
            },
          },
        });
  
        if (initIngredientState) {
          return {
            props: {
              recipe,
              sliderState: initIngredientState.serves,
              ingredientState: initIngredientState.state,
              isAdmin: isAdmin(session.user.email)
            },
          };
        }
      }
    }
    return {
      props: {
        recipe,
        sliderState: recipe.serves
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

export default function Recipe({ recipe, sliderState, ingredientState, isAdmin }) {

  const router = useRouter();

  const editRecipe = () => {
    router.push(`/recipes/add-new/${recipe.slug}?c=${recipe.categoryId}`);
  };

  return (
    <Layout pageTitle={recipe.title}>
      <Head>
        <title>{recipe.title}</title>
      </Head>
      <article>
        <div className={styles.container}>

          <div className={styles.ingredients}>
            <Ingredients 
              recipeId={recipe.id}
              serves={recipe.serves}
              ingredients={recipe.ingredients}
              initSliderState={sliderState}
              initIngredientState={ingredientState}
            />
          </div>
          
          <div className={styles.instructions}>

            <div dangerouslySetInnerHTML={{ __html: recipe.instructions }} />

            <div>
              {recipe.video && <YoutubeVideo videoId={recipe.video}/>}
            </div>

            <div>
              {recipe.link && <RecipeLink url={recipe.link}/>}
            </div>

          </div>

        </div>
      </article>
      {isAdmin && 
      <div className={adminStyles.submitButtonWrapper}>
        <button 
          className={adminStyles.submitButton}
          onClick={editRecipe}
        >
          Edit Recipe
        </button>
      </div>}
    </Layout>
  );
}
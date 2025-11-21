import Head from 'next/head';
import Layout from '@/components/layout';
import Ingredients from '@/components/recipe/ingredients';
import styles from '@/styles/recipe.module.css';
import YoutubeVideo from '@/components/youtube';
import RecipeLink from '@/components/link';
import adminStyles from '@/styles/add-new-recipe/addNewRecipe.module.css';
import { prisma } from "@/utils/prisma";

import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'

import { remark } from 'remark';
import html from 'remark-html';

import { useRouter } from 'next/router';
import { isAdmin, getCanonicalEmail } from '@/utils/auth.js';
import { calculateRecipeNutrition } from '@/utils/nutritionCalculations';


export async function getServerSideProps(context) {
  const { params, req, res } = context;
  const { slug } = params;

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

  // Calculate nutrition
  const nutrition = calculateRecipeNutrition(recipe.ingredients, recipe.serves);
  recipe.nutrition = nutrition;

  const session = await getServerSession(req, res, options);

  if (session) {
    const user = await prisma.user.findUnique({
      where: {
        email: getCanonicalEmail(session.user.email),
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

            {recipe.nutrition && recipe.nutrition.perServing.calories && (
              <div className={styles.nutritionInfo}>
                <h3>Nutrition Facts (per serving)</h3>
                <div className={styles.nutritionGrid}>
                  <div className={styles.nutritionItem}>
                    <span className={styles.nutritionLabel}>Calories</span>
                    <span className={styles.nutritionValue}>{recipe.nutrition.perServing.calories}</span>
                  </div>
                  {recipe.nutrition.perServing.protein && (
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>Protein</span>
                      <span className={styles.nutritionValue}>{recipe.nutrition.perServing.protein}g</span>
                    </div>
                  )}
                  {recipe.nutrition.perServing.carbs && (
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>Carbs</span>
                      <span className={styles.nutritionValue}>{recipe.nutrition.perServing.carbs}g</span>
                    </div>
                  )}
                  {recipe.nutrition.perServing.fat && (
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>Fat</span>
                      <span className={styles.nutritionValue}>{recipe.nutrition.perServing.fat}g</span>
                    </div>
                  )}
                </div>
                {!recipe.nutrition.hasCompleteData && (
                  <p className={styles.nutritionDisclaimer}>
                    * Some ingredients lack nutritional data
                  </p>
                )}
              </div>
            )}
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
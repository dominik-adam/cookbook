import Head from 'next/head';
import Layout from '@/components/layout';
import { useRouter } from 'next/router';

import { getServerSession } from "next-auth/next"
import styles from '@/styles/recipe.module.css';
import adminStyles from '@/styles/add-new-recipe/addNewRecipe.module.css';
import { options } from 'app/api/auth/[...nextauth]/options'

import { prisma } from "@/utils/prisma";
import { useState } from 'react';
import AdminIngredients from '@/components/admin/add-new-recipe/adminIngredients';
import AdminContent from '@/components/admin/add-new-recipe/adminContent';
import AdminInfo from '@/components/admin/add-new-recipe/adminInfo';

import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';
import { isAdmin } from '@/utils/auth';
import RecipeCategorySlug from '@/enum/recipeCategorySlug';
import type { GetServerSideProps } from 'next';
import type { Recipe, RecipeIngredient, Tag } from '@/types/recipe';

type RecipeWithDetails = Recipe & {
  tags?: Tag[];
  ingredients?: RecipeIngredient[];
  gallery?: string[] | null;
};

type AddRecipePageProps = {
  recipe?: RecipeWithDetails;
};

export const getServerSideProps: GetServerSideProps<AddRecipePageProps> = async (context) => {
  const { params, req, res } = context;
  const slug = params?.slug as string[] | undefined;

  const session = await getServerSession(req, res, options)

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  if (!slug || slug.length === 0) {
    return {
      props: {},
    };
  }

  const recipe = await prisma.recipe.findUnique({
    where: {
      slug: slug[0],
    },
    include: {
      tags: true,
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

  if (!recipe) {
    return {
      props: {},
    };
  }

  return {
    props: {
      recipe
    },
  };
}

export default function AddRecipe({ recipe }: AddRecipePageProps) {
  const { showMessage } = useFlashMessage();
  const siteTitle = 'Add New Recipe';

  const router = useRouter();

  const [slug, setSlug] = useState<string | undefined>(recipe?.slug)
  const [title, setTitle] = useState<string | undefined>(recipe?.title)
  const [serves, setServes] = useState<number>(recipe?.serves ?? 2)
  const [thumbnail, setThumbnail] = useState<string>(recipe?.thumbnail ?? '')
  const [instructions, setInstructions] = useState<string>(recipe?.instructions ?? '')
  const [video, setVideo] = useState<string>(recipe?.video ?? '')
  const [link, setLink] = useState<string>(recipe?.link ?? '')
  const [gallery, setGallery] = useState<string[] | null | undefined>(recipe?.gallery)
  const [tags, setTags] = useState<string[] | null>(recipe?.tags ? recipe.tags.map(tag => tag.name) : null)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients ?? [])

  const addIngredient = (ingredient: any) => {
    setIngredients([...ingredients, ingredient]);
  }

  const updateIngredient = (index: number, ingredient: any) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = ingredient;
    setIngredients(updatedIngredients);
  }

  const deleteIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients.splice(index, 1);
    setIngredients(updatedIngredients);
  }

  const saveRecipe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const category = router.query.c as string;

    try {
      const formData = {
        id: recipe?.id,
        title,
        slug,
        category,
        thumbnail,
        serves,
        instructions,
        video,
        link,
        tags,
        gallery,
        ingredients
      };

      const response = await fetch('/api/add-new-recipe', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {

        if (recipe?.id) {
          showMessage('Recipe updated successfully', 'success');
        } else {
          showMessage('Recipe created successfully', 'success');
        }
        router.push(`/${RecipeCategorySlug[category]}`);

      } else {
        const { error } = await response.json();
        showMessage(`Error: ${error}`, 'error');
      }
    } catch (error) {
      showMessage('Error sending request', 'error');
    }
  };

  const deleteRecipe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!recipe?.id) return;

    try {
      const response = await fetch('/api/delete-recipe?recipeId=' + recipe.id, {
        method: 'DELETE',
        headers: {
        'Content-Type': 'application/json',
        }
      });

      if (response.ok) {

        if (recipe?.id) {
          showMessage('Recipe deleted successfully', 'success');
        }
        const category = router.query.c as string;
        router.push(`/${RecipeCategorySlug[category]}`);

      } else {
        const { error } = await response.json();
        showMessage(`Error: ${error}`, 'error');
      }
    } catch (error) {
      showMessage('Error sending request', 'error');
    }
  }

  return (
    <Layout pageTitle={"Add new recipe"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <article>
        <AdminInfo
          title={title ?? ''}
          setTitle={setTitle}
          slug={slug ?? ''}
          setSlug={setSlug}
          thumbnail={thumbnail}
          setThumbnail={setThumbnail}
          tags={tags}
          setTags={setTags}
        />
        <div className={styles.container}>
          <div className={styles.ingredients}>
            <AdminIngredients
              serves={serves}
              setServes={setServes}
              ingredients={ingredients}
              addIngredient={addIngredient}
              updateIngredient={updateIngredient}
              deleteIngredient={deleteIngredient}
            />
          </div>

          <div className={styles.instructions}>
            <AdminContent
              instructions={instructions}
              setInstructions={setInstructions}
              video={video}
              setVideo={setVideo}
              link={link}
              setLink={setLink}
            />
          </div>
        </div>
      </article>
      <div className={adminStyles.submitButtonWrapper}>
        <button
          className={adminStyles.deleteButton}
          onClick={deleteRecipe}
        >
          Delete Recipe
        </button>
        <button
          className={adminStyles.submitButton}
          onClick={saveRecipe}
        >
          Save Recipe
        </button>
      </div>
    </Layout>
  );
}

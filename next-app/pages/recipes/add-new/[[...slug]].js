import Head from 'next/head';
import Layout, { siteTitle } from '@/components/layout';
import { useRouter } from 'next/router';

import { getServerSession } from "next-auth/next"
import styles from '@/styles/recipe.module.css';
import adminStyles from '@/styles/add-new-recipe/addNewRecipe.module.css';
import { options } from 'app/api/auth/[...nextauth]/options'

import { PrismaClient } from "@prisma/client"
import { useState } from 'react';
import AdminIngredients from '@/components/admin/add-new-recipe/adminIngredients';
import AdminContent from '@/components/admin/add-new-recipe/adminContent';
import AdminInfo from '@/components/admin/add-new-recipe/adminInfo';

import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';
import { isAdmin } from '@/utils/auth.js';


export async function getServerSideProps(context) {
  const { params, req, res } = context;
  const { slug } = params;
  
  const session = await getServerSession(req, res, options)
  const prisma = new PrismaClient()

  if (!session || !isAdmin(session.user.email)) {
    await prisma.$disconnect();
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  if (!slug) {
    await prisma.$disconnect();
    return {
      props: {},
    };
  }

  const recipe = await prisma.recipe.findUnique({
    where: {
      slug: slug[0],
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

  await prisma.$disconnect();

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

export default function AddRecipe({ recipe }) {
  const { showMessage } = useFlashMessage();

  const router = useRouter();

  const [slug, setSlug] = useState(recipe ? recipe.slug : undefined)
  const [title, setTitle] = useState(recipe ? recipe.title : undefined)
  const [serves, setServes] = useState(recipe ? recipe.serves : 2)
  const [thumbnail, setThumbnail] = useState(recipe ? recipe.thumbnail : undefined)
  const [instructions, setInstructions] = useState(recipe ? recipe.instructions : undefined)
  const [video, setVideo] = useState(recipe ? recipe.video : undefined)
  const [link, setLink] = useState(recipe ? recipe.link : undefined)
  const [gallery, setGallery] = useState(recipe ? recipe.gallery : undefined)
  const [tags, setTags] = useState(recipe ? recipe.tags : undefined)
  const [ingredients, setIngredients] = useState(recipe ? recipe.ingredients : [])

  const addIngredient = (ingredient) => {
    setIngredients([...ingredients, ingredient]);
  }

  const updateIngredient = (index, ingredient) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = ingredient;
    setIngredients(updatedIngredients);
  }

  const deleteIngredient = (index) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients.splice(index, 1);
    setIngredients(updatedIngredients);
  }
  
  const saveRecipe = async (e) => {
    e.preventDefault();

    try {
      const formData = {
        id: recipe?.id,
        title,
        slug,
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
        router.push('/');
      } else {
        const { error } = await response.json();
        showMessage(`Error: ${error}`, 'error');
      }
    } catch (error) {
      showMessage('Error sending request', 'error');
    }
  };

  const deleteRecipte = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/delete-recipe?recipeId=' + recipe.id, {
        method: 'DELETE',
        headers: {
        'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        if (recipe?.id) {
          showMessage('Recipe updated successfully', 'success');
        } else {
          showMessage('Recipe created successfully', 'success');
        }
        router.push('/');
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
          title={title}
          setTitle={setTitle}
          slug={slug}
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
          className={adminStyles.submitButton}
          onClick={saveRecipe}
          // disabled={!newIngredientName || !newIngredientImage}
        >
          Save Recipe
        </button>
        <button 
          className={adminStyles.deleteButton}
          onClick={deleteRecipte}
        >
          Delete Recipe
        </button>
      </div>
    </Layout>
  );
}
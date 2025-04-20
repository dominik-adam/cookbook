import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import Recipes from '../components/recipes';
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/utils/auth.js';
import RecipeCategory from '@/enum/recipeCategory';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, options)
  const prisma = new PrismaClient();

  try {
    const drinks = await prisma.recipe.findMany({
      where: {
        title: {
          contains: context.query.s,
          mode: 'insensitive'
        },
        categoryId: RecipeCategory.DRINK,
      },
      orderBy: {
        title: 'asc'
      }
    });
  
    if (session && isAdmin(session.user.email)) {
      const addNew = {
        slug: `add-new?c=${RecipeCategory.DRINK}`,
        title: "Add new recipe",
        thumbnail: "/images/add-new.jpg"
      }
      drinks.unshift(addNew)
    }
    return {
      props: {
        initDrinks: drinks,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

export default function Home({initDrinks}) {

  return (
    <Layout pageTitle={"Drinks"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <Recipes category={RecipeCategory.DRINK} initRecipes={initDrinks}/>
    </Layout>
  );
}
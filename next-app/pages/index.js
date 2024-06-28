import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import Recipes from '../components/recipes';
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/utils/auth.js';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, options)
  const prisma = new PrismaClient();

  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        title: {
          contains: context.query.s,
          mode: 'insensitive'
        }
      },
      orderBy: {
        title: 'asc'
      }
    });
  
    if (session && isAdmin(session.user.email)) {
      const addNew = {
        slug: "add-new",
        title: "Add new recipe",
        thumbnail: "/images/add-new.jpg"
      }
      recipes.unshift(addNew)
    }
    return {
      props: {
        initRecipes: recipes,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

export default function Home({initRecipes}) {

  return (
    <Layout pageTitle={"Recipes"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <Recipes initRecipes={initRecipes}/>
    </Layout>
  );
}
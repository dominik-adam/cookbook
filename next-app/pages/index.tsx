import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import Recipes from '../components/recipes';
import RecipeCategory from '@/enum/recipeCategory';
import { useState } from 'react';

export async function getServerSideProps(context) {
  const searchQuery = context.query.s || '';
  const category = RecipeCategory.FOOD;

  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = context.req.headers.host;
    const res = await fetch(`${protocol}://${host}/api/get-recipes?s=${searchQuery}&c=${category}`);
    const data = await res.json();

    return {
      props: {
        initRecipes: data.recipes ?? [],
      },
    };
  } catch (error) {
    console.error('Failed to fetch recipes for SSR:', error);
    return {
      props: {
        initRecipes: [],
      },
    };
  }
}

export default function Home({ initRecipes }) {
  const [sidebarContent, setSidebarContent] = useState<JSX.Element | null>(null);

  return (
    <Layout pageTitle="Recipes" sidebarContent={sidebarContent}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <Recipes
        initRecipes={initRecipes}
        category={RecipeCategory.FOOD}
        setSidebarContent={setSidebarContent}
      />
    </Layout>
  );
}
import Head from 'next/head';
import Layout from '../components/layout';
import Recipes from '../components/recipes';
import RecipeCategory from '@/enum/recipeCategory';
import { useState } from 'react';

export async function getServerSideProps(context) {
  const searchQuery = context.query.s || '';
  const category = RecipeCategory.DRINK;

  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = context.req.headers.host;
    const res = await fetch(`${protocol}://${host}/api/get-recipes?s=${searchQuery}&c=${category}`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });
    const data = await res.json();

    return {
      props: {
        initDrinks: data.recipes ?? [],
      },
    };
  } catch (error) {
    console.error('Failed to fetch recipes for SSR:', error);
    return {
      props: {
        initDrinks: [],
      },
    };
  }
}

export default function Home({initDrinks}) {
  const siteTitle = 'My Bar Menu';
  const [sidebarContent, setSidebarContent] = useState<JSX.Element | null>(null);

  return (
    <Layout pageTitle={"Drinks"} sidebarContent={sidebarContent}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <Recipes
        category={RecipeCategory.DRINK} 
        initRecipes={initDrinks} 
        setSidebarContent={setSidebarContent}  
      />
    </Layout>
  );
}
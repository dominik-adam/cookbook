import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import Recipes from '../components/recipes';
import { getSortedRecipesData } from '../utils/recipes';

export async function getServerSideProps(context) {
  const recipes = getSortedRecipesData(context.query.s);
  return {
    props: {
      recipes,
    },
  };
}

export default function Home({recipes}) {

  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <Recipes recipes={recipes}/>
    </Layout>
  );
}
import Head from 'next/head';
import Date from '../../components/date';
import Layout from '../../components/layout';
import Ingredients from '../../components/ingredients';
import { getAllRecipeIds, getRecipeData } from '../../utils/recipes';
import utilStyles from '../../styles/utils.module.css';
import styles from '../../styles/recipe.module.css';
import YoutubeVideo from '../../components/youtube';
import RecipeLink from '../../components/link';

export async function getStaticProps({ params }) {
    const recipeData = await getRecipeData(params.id);
  
    return {
      props: {
        recipeData,
      },
    };
  }

export async function getStaticPaths() {
    const paths = getAllRecipeIds();
    return {
      paths,
      fallback: false,
    };
  }

export default function Recipe({ recipeData }) {
    return (
      <Layout>
        <Head>
          <title>{recipeData.title}</title>
        </Head>
        <article>
          <h1 className={utilStyles.headingXl}>{recipeData.title}</h1>
          {/* <div className={utilStyles.lightText}>
            <Date dateString={recipeData.date} />
          </div> */}
          <div className={styles.container}>

            <div className={styles.ingredients}>
              <Ingredients ingredients={recipeData.ingredients}/>
            </div>
            
            <div className={styles.instructions}>

              <div dangerouslySetInnerHTML={{ __html: recipeData.contentHtml }} />

              <div>
                {recipeData.video && <YoutubeVideo videoId={recipeData.video}/>}
              </div>

              <div>
                {recipeData.link && <RecipeLink url={recipeData.link}/>}
              </div>

            </div>

          </div>
        </article>
      </Layout>
    );
}
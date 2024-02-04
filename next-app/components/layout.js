import Head from 'next/head';
import styles from '@/styles/layout.module.css';
import menuStyles from '@/styles/menu.module.css';
import utilStyles from '@/styles/utils.module.css';
import MenuButton from './menuButton';

export const siteTitle = 'My Cookbook';

export default function Layout({ children, pageTitle }) {
  const name = `🍳 ${pageTitle} 🍳`;

  return (
    <div>
      <Head>
        <link rel="icon" href="/food.ico" />
        <meta name="og:title" content={siteTitle} />
      </Head>
      <div className={styles.wrapper}>
        <div className={`${styles.menu} ${menuStyles.menu}`}>
          <MenuButton 
            title={"Profile"} 
            url={"/profile"} 
            image={"/icons/profile.png"}
          />
          <MenuButton 
            title={"Recipes"} 
            url={"/"} 
            image={"/icons/recipes.png"}
          />
          <MenuButton 
            title={"Bag"} 
            url={"/bag"} 
            image={"/icons/shopping-bag.png"}
          />
        </div>
        <div className={styles.notMenu}>
          <div className={styles.container}>
            <header className={styles.header}>
              {pageTitle && (
                <>
                  <h1 className={`${utilStyles.heading2Xl} ${utilStyles.marginBottom30}`}>{name}</h1>
                </>
              )}
            </header>
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
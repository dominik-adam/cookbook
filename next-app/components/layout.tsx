import Head from 'next/head';
import styles from '@/styles/layout.module.css';
import menuStyles from '@/styles/menu.module.css';
import utilStyles from '@/styles/utils.module.css';
import MenuButton from './menuButton';
import { ReactNode, useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
  sidebarContent?: ReactNode;
}

export default function Layout({ children, pageTitle, sidebarContent }: LayoutProps) {
  const name = pageTitle ? `🍳 ${pageTitle} 🍳` : '';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div>
      <Head>
        <link rel="icon" href="/food.ico" />
        <meta name="og:title" content="My Cookbook" />
      </Head>

      <div className={styles.wrapper}>
        {/* Main content */}
      <div className={`${styles.notMenu} ${isSidebarOpen ? styles.shifted : ''}`}>
          <div className={styles.container}>
            <header className={styles.header}>
              {pageTitle && (
                <h1 className={`${utilStyles.heading2Xl} ${utilStyles.marginBottom30}`}>
                  {name}
                </h1>
              )}
            </header>
            <main>{children}</main>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
          <div className={styles.sidebarToggle} onClick={toggleSidebar}>
            {isSidebarOpen ? '▶' : '◀'}
          </div>
          <div className={styles.sidebarContent}>
            {sidebarContent}
          </div>
        </div>

        {/* Menu */}
        <div className={menuStyles.menu}>
          <MenuButton title="Profile" url="/profile" image="/icons/profile.png" />
          <MenuButton title="Recipes" url="/" image="/icons/recipes.png" />
          <MenuButton title="Drinks" url="/drinks" image="/icons/drinks.png" />
          <MenuButton title="Bag" url="/bag" image="/icons/shopping-bag.png" />
        </div>
      </div>
    </div>
  );
}

import Head from 'next/head';
import styles from '@/styles/layout.module.css';
import menuStyles from '@/styles/menu.module.css';
import utilStyles from '@/styles/utils.module.css';
import MenuButton from './menuButton';
import { ReactNode, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isAdmin as checkIsAdmin } from '../utils/auth';
import { MODULE_CONFIG } from '../lib/moduleConfig';

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
  sidebarContent?: ReactNode;
  isAdmin?: boolean;
}

export default function Layout({ children, pageTitle, sidebarContent, isAdmin }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const userIsAdmin = session?.user?.email ? checkIsAdmin(session.user.email) : false;
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
            {pageTitle && (
              <header className={styles.header}>
                <h1 className={`${utilStyles.heading2Xl} ${utilStyles.marginBottom30}`}>
                  🍳 {pageTitle} 🍳
                </h1>
              </header>
            )}
            <main>{children}</main>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
          <div className={styles.sidebarToggle} onClick={toggleSidebar}>
            {isSidebarOpen ? '▶' : '◀'}
          </div>
          <div className={styles.sidebarCloseMobile} onClick={toggleSidebar}>
            ▶
          </div>
          <div className={styles.sidebarContent}>
            {sidebarContent}
          </div>
        </div>

        {/* Menu */}
        <div className={menuStyles.menu}>
          {MODULE_CONFIG
            .filter(m => m.publiclyAvailable || userIsAdmin)
            .map(m => (
              <MenuButton key={m.url} title={m.title} url={m.url} image={m.image} />
            ))
          }
        </div>
      </div>
    </div>
  );
}

import styles from '@/styles/menu.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function MenuButton({ title, url, image }) {

  return (
    <Link className={styles.menuButtonLink} href={url}>
      <div className={styles.menuButton}>
          <Image
              className={styles.menuButtonImage}
              src={image}
              width={60}
              height={60}
              alt={title + " menu icon"}
          />
          {title}
      </div>
    </Link>
  );
}
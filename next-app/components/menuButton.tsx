import styles from '@/styles/menu.module.css';
import Link from 'next/link';
import Image from 'next/image';

type MenuButtonProps = {
  title: string;
  url: string;
  image: string;
};

export default function MenuButton({ title, url, image }: MenuButtonProps) {

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

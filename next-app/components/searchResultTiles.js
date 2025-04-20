import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/recipes.module.css';

export default function SearchResultTiles({items}) {
  return (
    <div className={styles.parent}>
      {items.map(({ slug, title, thumbnail }) => (
        <div className={styles.tile} key={slug}>
          <Link href={`/recipes/${slug}`}>
            <div className={styles.tileTitle}>{title}</div>
            <div className={styles.tileOverlay}></div>
            {thumbnail &&
            <Image
              className={styles.tileImage}
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 600px) 50vw, 20vw"
              style={{objectFit: "cover"}}
              quality={50}
            />}
          </Link>
        </div>
      ))}
    </div>
  );
}
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './recipes.module.css';

export default function RecipeTiles({recipes}) {
  return (
    <div className={styles.parent}>
      {recipes.map(({ id, title, images }) => (
        <div className={styles.tile} key={id}>
          <Link href={`/recipes/${id}`}>
            <div className={styles.tileTitle}>{title}</div>
            <div className={styles.tileOverlay}></div>
            {images[0] && 
            <Image
              className={styles.tileImage}
              src={`/images/${images[0]}`}
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
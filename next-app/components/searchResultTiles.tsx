import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/recipes.module.css';
import { Recipe } from '@/types/recipe';

const SearchResultTiles = function SearchResultTiles({
  items,
  selectMode,
  selected,
  toggleSelect,
}: {
  items: Recipe[];
  selectMode: boolean;
  selected: string[];
  toggleSelect: (slug: string) => void;
}) {
  return (
    <div className={styles.parent}>
      {items.map(({ slug, title, thumbnail }) => {
        const isSelected = selected.includes(slug);

        const content = (
          <>
            <div className={`${styles.checkmarkWrapper} ${isSelected ? styles.checkmarkWrapperVisible : ''}`}>
              <Image
                src="/ingredients/checked.jpg"
                alt="Selected"
                width={40}
                height={40}
                className={styles.checkmarkImage}
              />
            </div>

            <div className={`${styles.tileTitle} ${isSelected ? styles.selectedTitle : ''}`}>
              {title}
            </div>

            <div className={styles.tileOverlay}></div>

            {thumbnail && (
              <Image
                className={styles.tileImage}
                src={thumbnail}
                alt={title}
                fill
                sizes="(max-width: 600px) 50vw, 20vw"
                style={{ objectFit: 'cover' }}
                quality={50}
              />
            )}
          </>
        );

        return (
          <div
            key={slug}
            className={`${styles.tile} ${isSelected ? styles.selectedTile : ''}`}
            onClick={() => selectMode && toggleSelect(slug)}
            style={{ cursor: selectMode ? 'pointer' : 'default' }}
          >
            {selectMode ? content : <Link href={`/recipes/${slug}`}>{content}</Link>}
          </div>
        );
      })}
    </div>
  );
};

export default SearchResultTiles;
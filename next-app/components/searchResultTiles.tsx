import React, { memo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/recipes.module.css';
import { Recipe } from '@/types/recipe';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface TileProps {
  recipe: Recipe;
  selectMode: boolean;
  portions: number;
  onHoldStart: (slug: string) => void;
  onPortionChange: (slug: string, delta: number) => void;
}

const RecipeTile = memo(function RecipeTile({ recipe, selectMode, portions, onHoldStart, onPortionChange }: TileProps) {
  const { slug, title, thumbnail, caloriesPerServing } = recipe;
  const isSelected = portions > 0;

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHoldRef = useRef(false);

  const startHold = (slug: string) => {
    if (slug.startsWith('add-new')) return;
    didHoldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      onHoldStart(slug);
    }, HOLD_TO_RESET_MS);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startHold(slug);
  };

  const handlePointerUp = () => {
    cancelHold();
    // Tap on unselected tile in select mode adds it with default portions
    if (!didHoldRef.current && selectMode && portions === 0) {
      onHoldStart(slug);
    }
  };

  const handlePointerLeave = () => {
    cancelHold();
  };

  const tileContent = (
    <>
      {caloriesPerServing && (
        <div className={styles.nutritionBadge}>
          {caloriesPerServing} cal
        </div>
      )}

      <div className={`${styles.tileTitle} ${isSelected ? styles.selectedTitle : ''}`}>
        {title}
      </div>

      {selectMode && isSelected && (
        <div className={styles.portionControls}>
          <button
            className={styles.portionBtn}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onPortionChange(slug, -1); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            −
          </button>
          <span className={styles.portionCount}>{portions}</span>
          <button
            className={styles.portionBtn}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onPortionChange(slug, 1); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            +
          </button>
        </div>
      )}

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

  const tileClasses = [
    styles.tile,
    selectMode ? styles.tileSelectMode : '',
    selectMode && isSelected ? styles.selectedTile : '',
  ].filter(Boolean).join(' ');

  if (selectMode) {
    return (
      <div
        className={tileClasses}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {tileContent}
      </div>
    );
  }

  return (
    <div
      className={tileClasses}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ userSelect: 'none' }}
    >
      <Link
        href={`/recipes/${slug}`}
        onClick={(e) => { if (didHoldRef.current) e.preventDefault(); }}
      >
        {tileContent}
      </Link>
    </div>
  );
});

const SearchResultTiles = function SearchResultTiles({
  items,
  selectMode,
  mealPlan,
  onHoldStart,
  onPortionChange,
}: {
  items: Recipe[];
  selectMode: boolean;
  mealPlan: Record<string, number>;
  onHoldStart: (slug: string) => void;
  onPortionChange: (slug: string, delta: number) => void;
}) {
  return (
    <div className={styles.parent}>
      {items.map((recipe) => (
        <RecipeTile
          key={recipe.slug}
          recipe={recipe}
          selectMode={selectMode}
          portions={mealPlan[recipe.slug] ?? 0}
          onHoldStart={onHoldStart}
          onPortionChange={onPortionChange}
        />
      ))}
    </div>
  );
};

export default memo(SearchResultTiles);

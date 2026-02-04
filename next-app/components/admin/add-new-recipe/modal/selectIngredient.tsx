import Image from 'next/image';
import { useEffect, useState, useRef, useCallback } from 'react';
import tiles from '@/styles/ingredientTiles.module.css';
import searchBar from '@/styles/search.module.css';
import type { Ingredient } from '@/types/recipe';

type SelectIngredientProps = {
  selectIngredient: (ingredient: Ingredient) => void;
  createNewIngredient: (searchTerm: string) => void;
};

export default function SelectIngredient({
  selectIngredient,
  createNewIngredient
}: SelectIngredientProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchTerm(value);
    fetchIngredients(value);
  };

  const fetchIngredients = useCallback(async (searchTerm: string) => {
    try {
      const response = await fetch(`/api/get-ingredients?s=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      const { ingredients } = await response.json();
      setIngredients(ingredients);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  }, []);

  useEffect(() => {
    fetchIngredients('');
    inputRef.current?.focus();
  }, [fetchIngredients]);

  return (
    <>
      <div
        className={searchBar.searchWrapper}
        style={{marginBottom: "20px"}}
      >
        <div className={searchBar.searchBar}>
          <span>
            <Image
              className={searchBar.searchIcon}
              src={`/images/searchIcon.jpg`}
              alt='search icon'
              width={50}
              height={50}
              quality={100}
            />
          </span>
          <input
            ref={inputRef}
            className={searchBar.searchInput}
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className={tiles.parent}>
        <button
          className={tiles.tile}
          onClick={() => createNewIngredient(searchTerm)}
        >
          <div className={tiles.tileTitle}>Add new ingredient</div>
          <div className={tiles.tileOverlay}></div>
          <Image
            className={tiles.tileImage}
            src={`/images/add-new.jpg`}
            fill
            sizes="(max-width: 600px) 50vw, 20vw"
            style={{objectFit: "cover"}}
            quality={50}
            alt="Add new ingredient"
          />
        </button>
        {ingredients.map((ingredient) => (
          <button
            className={tiles.tile}
            key={ingredient.id}
            onClick={() => selectIngredient(ingredient)}
          >
            <div className={tiles.tileTitle}>{ingredient.name}</div>
            <div className={tiles.tileOverlay}></div>
            {ingredient.image &&
            <Image
              className={tiles.tileImage}
              src={ingredient.image}
              alt={ingredient.name}
              fill
              sizes="(max-width: 600px) 50vw, 20vw"
              style={{objectFit: "cover"}}
              quality={50}
            />}
          </button>
        ))}
      </div>
    </>
  );
}

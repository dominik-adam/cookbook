import React, { useState } from 'react';
import SearchBar from './search.js';
import RecipeTiles from './recipeTiles.js';
import utilStyles from '@/styles/utils.module.css';

export default function Recipes({initRecipes}) {
	const [recipes, setRecipes] = useState(initRecipes ?? []);

  const fetchRecipes = async (searchTerm) => {
		try {
			const response = await fetch(`/api/get-recipes?s=${searchTerm}`);
			if (!response.ok) {
				throw new Error('Failed to fetch recipes');
			}
			const { recipes } = await response.json();
			setRecipes(recipes);
		} catch (error) {
			console.error('Error fetching recipes:', error);
		}
	};

  return (
    <div>
      <section className={`${utilStyles.marginBottom30}`}>
        <SearchBar fetchRecipes={fetchRecipes}/>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <RecipeTiles recipes={recipes}/>
      </section>
    </div>
  );
}
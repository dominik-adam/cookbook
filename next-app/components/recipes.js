import React, { useState } from 'react';
import SearchBar from './search.js';
import SearchResultTiles from './searchResultTiles.js';
import utilStyles from '@/styles/utils.module.css';

export default function Recipes({initRecipes, category}) {
	const [recipes, setRecipes] = useState(initRecipes ?? []);

  const fetchRecipes = async (searchTerm) => {
		try {
			const response = await fetch(`/api/get-recipes?s=${searchTerm}&c=${category}`);
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
        <SearchBar fetchResults={fetchRecipes}/>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <SearchResultTiles items={recipes}/>
      </section>
    </div>
  );
}
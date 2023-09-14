import React, { useCallback, useEffect, useState } from 'react';
import Search from './search.js';
import RecipeTiles from './recipeTiles.js';
import utilStyles from '../styles/utils.module.css';

export function filterRecipes(recipes, recipeFilter) {
  return recipes.filter((recipe) => {
    return recipeFilter.searchTerm ? recipe.title.toLowerCase().includes(recipeFilter.searchTerm.toLowerCase()) : true
  })
}

export default function Recipes({recipes}) {

  return (
    <div>
      <section className={`${utilStyles.marginBottom30}`}>
        <Search/>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <RecipeTiles recipes={recipes}/>
      </section>
    </div>
  );
}
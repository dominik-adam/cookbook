import React, { useState, useEffect } from 'react';
import SearchBar from './search';
import SearchResultTiles from './searchResultTiles';
import utilStyles from '@/styles/utils.module.css';
import recipesStyles from '@/styles/recipes.module.css';
import { aggregateIngredients } from '@/utils/aggregateIngredients';
import { Recipe, RecipesProps } from '@/types/recipe';

export default function Recipes({ initRecipes, category, setSidebarContent }: RecipesProps & { setSidebarContent: (content: JSX.Element) => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>(initRecipes ?? []);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const toggleSelect = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const fetchRecipes = async (searchTerm: string, filterTags: string[] = []) => {
    try {
      const tagsQuery = filterTags.length > 0 ? `&tags=${filterTags.join(',')}` : '';
      const response = await fetch(`/api/get-recipes?s=${searchTerm}&c=${category}${tagsQuery}`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data: { recipes: Recipe[] } = await response.json();
      setRecipes(data.recipes);

      // Extract unique tags from recipes
      const uniqueTags = new Set<string>();
      data.recipes.forEach((recipe) => {
        if (recipe.tags) {
          recipe.tags.forEach((tag: any) => {
            if (typeof tag === 'string') {
              uniqueTags.add(tag);
            } else if (tag.name) {
              uniqueTags.add(tag.name);
            }
          });
        }
      });
      setAvailableTags(Array.from(uniqueTags).sort());
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  useEffect(() => {
    const selectedRecipes = recipes.filter((r) => selected.includes(r.slug));
    const aggregated = aggregateIngredients(selectedRecipes);
    setSidebarContent(
      <div>
        <h3>🛒 Quick Bag</h3>
        <ul>
          {aggregated.length > 0 ? (
            aggregated.map((item) => (
              <li key={item.ingredientId}>
                  {item.amounts.map((amt) => {
                    if (!amt.amount) return '';
                    const unit = amt.amount > 1 && amt.unitPlural ? amt.unitPlural : amt.unit;
                    return unit ? `${amt.amount} ${unit}` : `${amt.amount}`;
                  }).filter(s => s).join(' + ')}
                  {item.amounts.some(amt => amt.amount) ? ' ' : ''}
                  {item.name}
                </li>
              ))
            ) : (
              <li>Empty</li>
            )
          }
        </ul>
      </div>
    )
  }, [selected, recipes]);

  useEffect(() => {
    // Extract tags from initial recipes
    const uniqueTags = new Set<string>();
    initRecipes?.forEach((recipe) => {
      if (recipe.tags) {
        recipe.tags.forEach((tag) => {
          uniqueTags.add(tag.name);
        });
      }
    });
    setAvailableTags(Array.from(uniqueTags).sort());
  }, [initRecipes]);

  useEffect(() => {
    // Refetch recipes when selected tags change
    fetchRecipes('', selectedTags);
  }, [selectedTags]);

  return (
    <div>
      <section className={utilStyles.marginBottom30}>
        <SearchBar fetchResults={(term) => fetchRecipes(term, selectedTags)} />
      </section>

      {availableTags.length > 0 && (
        <section className={recipesStyles.tagFilters}>
          <div className={recipesStyles.tagFilterLabel}>Filter by tags:</div>
          <div className={recipesStyles.tagFilterButtons}>
            {availableTags.map((tag) => (
              <button
                key={tag}
                className={`${recipesStyles.tagFilterButton} ${
                  selectedTags.includes(tag) ? recipesStyles.tagFilterButtonActive : ''
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <SearchResultTiles
          items={recipes}
          selectMode={selectMode}
          selected={selected}
          toggleSelect={toggleSelect}
        />
      </section>

      <div
        className={recipesStyles.floatingToggle}
        onClick={(e) => {
          if (
            e.target instanceof HTMLElement &&
            e.target.tagName !== 'LABEL' &&
            e.target.tagName !== 'INPUT'
          ) {
            setSelectMode(!selectMode);
          }
        }}
      >
        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selectMode}
            onChange={() => setSelectMode(!selectMode)}
          />
          Select Mode
        </label>
      </div>
    </div>
  );
}

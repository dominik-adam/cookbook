import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from './search';
import SearchResultTiles from './searchResultTiles';
import utilStyles from '@/styles/utils.module.css';
import recipesStyles from '@/styles/recipes.module.css';
import { aggregateIngredients } from '@/utils/aggregateIngredients';
import { Recipe, RecipesProps } from '@/types/recipe';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';

export default function Recipes({ initRecipes, category, setSidebarContent }: RecipesProps & { setSidebarContent: (content: JSX.Element) => void }) {
  const { showMessage } = useFlashMessage();
  const [recipes, setRecipes] = useState<Recipe[]>(initRecipes ?? []);
  const [selectMode, setSelectMode] = useState(false);
  const [mealPlan, setMealPlan] = useState<Record<string, number>>({});
  // Full recipe data for all items in meal plan (keyed by slug, for aggregation)
  const [mealPlanRecipes, setMealPlanRecipes] = useState<Record<string, Recipe>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load meal plan from DB on mount
  useEffect(() => {
    fetch('/api/meal-plan')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.items) return;
        const planMap: Record<string, number> = {};
        const recipesMap: Record<string, Recipe> = {};
        for (const item of data.items) {
          planMap[item.recipeSlug] = item.portions;
          if (item.recipe) recipesMap[item.recipeSlug] = item.recipe;
        }
        setMealPlan(planMap);
        setMealPlanRecipes(recipesMap);
      })
      .catch(() => {});
  }, []);

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
  }, []);

  // Adds a recipe to the meal plan with its default portion count (recipe.serves).
  // Used by both hold-to-enter-select-mode and tap-on-unselected-tile.
  const addToMealPlan = useCallback((slug: string) => {
    if (mealPlan[slug]) return; // already in plan
    const recipe = recipes.find(r => r.slug === slug);
    const defaultPortions = recipe?.serves ?? 1;
    if (recipe) setMealPlanRecipes(prev => ({ ...prev, [slug]: recipe }));
    setMealPlan(prev => ({ ...prev, [slug]: defaultPortions }));
    fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeSlug: slug, portions: defaultPortions }),
    }).then(r => { if (!r.ok) showMessage('Failed to save to meal plan', 'error'); })
      .catch(() => showMessage('Failed to save to meal plan', 'error'));
  }, [mealPlan, recipes, showMessage]);

  const handleHoldStart = useCallback((slug: string) => {
    if (selectMode) {
      addToMealPlan(slug);
    } else {
      enterSelectMode();
    }
  }, [selectMode, enterSelectMode, addToMealPlan]);

  const handlePortionChange = useCallback((slug: string, delta: number) => {
    const current = mealPlan[slug] ?? 0;
    const next = current + delta;

    if (next <= 0) {
      setMealPlan(prev => { const { [slug]: _, ...rest } = prev; return rest; });
      fetch(`/api/meal-plan?recipeSlug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
        .then(r => { if (!r.ok) showMessage('Failed to remove from meal plan', 'error'); })
        .catch(() => showMessage('Failed to remove from meal plan', 'error'));
      return;
    }

    setMealPlan(prev => ({ ...prev, [slug]: next }));
    fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeSlug: slug, portions: next }),
    }).then(r => { if (!r.ok) showMessage('Failed to update meal plan', 'error'); })
      .catch(() => showMessage('Failed to update meal plan', 'error'));
  }, [mealPlan, showMessage]);

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
    fetchRecipes('', selectedTags);
  }, [selectedTags]);

  // Rebuild sidebar whenever meal plan or recipes change
  useEffect(() => {
    const planEntries = Object.entries(mealPlan);

    const selectedItems = planEntries
      .map(([slug, portions]) => {
        const recipe = mealPlanRecipes[slug] ?? recipes.find(r => r.slug === slug);
        return recipe ? { recipe, portions } : null;
      })
      .filter((x): x is { recipe: Recipe; portions: number } => x !== null);

    const aggregated = aggregateIngredients(selectedItems);

    setSidebarContent(
      <div>
        <h3>Meal Plan</h3>
        {planEntries.length > 0 ? (
          <>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '16px' }}>
              {planEntries.map(([slug, portions]) => {
                const recipe = mealPlanRecipes[slug] ?? recipes.find(r => r.slug === slug);
                return (
                  <li key={slug} style={{ marginBottom: '6px', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600 }}>{recipe?.title ?? slug}</span>
                    <span style={{ color: '#6ec5c5', marginLeft: '6px' }}>×{portions}</span>
                  </li>
                );
              })}
            </ul>

            {aggregated.length > 0 && (
              <>
                <h4 style={{ marginBottom: '8px', color: '#a0a0a8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ingredients
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {aggregated.map((item) => (
                    <li key={item.ingredientId} style={{ marginBottom: '4px', fontSize: '0.85rem' }}>
                      {item.amounts.map((amt) => {
                        if (!amt.amount) return '';
                        const rounded = Math.round(amt.amount * 100) / 100;
                        const unit = rounded > 1 && amt.unitPlural ? amt.unitPlural : amt.unit;
                        return unit ? `${rounded} ${unit}` : `${rounded}`;
                      }).filter(s => s).join(' + ')}
                      {item.amounts.some(amt => amt.amount) ? ' ' : ''}
                      {item.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <p style={{ color: '#a0a0a8', fontSize: '0.85rem' }}>
            Hold a recipe tile to start planning
          </p>
        )}
      </div>
    );
  }, [mealPlan, mealPlanRecipes, recipes]);

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
          mealPlan={mealPlan}
          onHoldStart={handleHoldStart}
          onPortionChange={handlePortionChange}
        />
      </section>

      {selectMode && (
        <button
          className={recipesStyles.cancelSelectBtn}
          onClick={(e) => { e.stopPropagation(); setSelectMode(false); }}
        >
          Done
        </button>
      )}
    </div>
  );
}

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { getIngredientImages } from './ingredients';

const recipesDirectory = path.join(process.cwd(), 'recipes');

export function getAllRecipeIds() {
  const fileNames = fs.readdirSync(recipesDirectory);

  return fileNames.map((fileName) => {
    return {
      params: {
        slug: fileName.replace(/\.md$/, ''),
      },
    };
  });
}

export async function getRecipeData(id) {
  const fullPath = path.join(recipesDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const ingredientImages = getIngredientImages();

  const ingredients = (matterResult.data.ingredients).map((ingredient) => {
    const parts = ingredient.split(" | ");

    return {
      amount: parts[1] ?? null,
      unit: parts[2] ?? null,
      ingredient: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
      image: ingredientImages[parts[0]] ?? ingredientImages["default"]
    }
  })

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...matterResult.data,
    ingredients,
  };
}
const { PrismaClient } = require('@prisma/client');
const { link } = require('fs');

const prisma = new PrismaClient();

const main = async () => {

  const recipesDirectory = path.join(process.cwd(), 'recipes');

  // Get file names under /recipes
  const fileNames = fs.readdirSync(recipesDirectory);
  const allRecipesData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get slug
    const slug = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(recipesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the recipe metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the slug
    return {
      slug,
      ...matterResult.data,
    };
  });

  try {
    allRecipesData.map(async (recipe) => {
      const newRecipe = await prisma.recipe.create({
        data: {
          slug: recipe.slug,
          title: recipe.title,
          serves: recipe.serves,
          thumbnail: recipe.thumbnail,
          instructions: recipe.contentHtml,
          video: recipe.video,
          link: recipe.link,
          gallery: recipe.gallery,
          tags: recipe.tags,
          ingredients: recipe.ingredients,
        },
      });
  
      console.log('Recipe inserted successfully:', newRecipe);
    });
  } catch (error) {
    console.error('Error inserting recipe:', error);
  } finally {
    await prisma.$disconnect();
  }
};

main();
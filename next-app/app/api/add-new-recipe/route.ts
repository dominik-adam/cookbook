import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth.js';
import { prisma } from "@/utils/prisma";
import cuid from 'cuid';
import { RecipeSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  let id: string | undefined;
  let slug: string | undefined;

  try {
    const session = await getServerSession(options);

    if (!session || !session.user?.email || !isAdmin(session.user.email)) {
      throw new AuthenticationError('Admin access required');
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(RecipeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      id: recipeId,
      slug: recipeSlug,
      title,
      category,
      serves,
      thumbnail,
      instructions,
      video,
      link,
      gallery,
      tags,
      ingredients
    } = validation.data;

    id = recipeId;
    slug = recipeSlug;


    var recipe;

    if (recipeId) {
      // Check if recipe exists before updating
      const existingRecipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
      if (!existingRecipe) {
        throw new NotFoundError(`Recipe with ID ${recipeId} not found`);
      }

      // Handle tags - find or create them
      let tagConnections: { id: string }[] = [];
      if (tags && tags.length > 0) {
        tagConnections = await Promise.all(
          tags.map(async (tagName: string) => {
            let tag = await prisma.tag.findFirst({
              where: { name: tagName }
            });
            if (!tag) {
              tag = await prisma.tag.create({
                data: { name: tagName }
              });
            }
            return { id: tag.id };
          })
        );
      }

      recipe = await prisma.recipe.update({
        where: { id: recipeId },
        data: {
          slug: recipeSlug,
          title: title,
          serves: serves,
          categoryId: category,
          thumbnail: thumbnail,
          instructions: instructions,
          video: video,
          link: link,
          gallery: gallery,
          tags: {
            set: tagConnections
          },
          ingredients: {
            // Delete ingredients that are not in the updated list
            deleteMany: {
              id: { notIn: ingredients.filter(ingredient => ingredient.id).map(ingredient => ingredient.id) }
            },
            upsert: ingredients.map(ingredient => ({
              where: { id: ingredient.id ?? cuid() }, // Try to match existing ingredient by ID
              update: {
                amount: ingredient.amount,
                unit: { connect: { id: ingredient.unit.id }},
                instruction: ingredient.instruction,
                ingredient: { connect: { id: ingredient.ingredient.id }}
              },
              create: { // Prisma will automatically generate a unique ID for the new ingredient
                amount: ingredient.amount,
                unit: { connect: { id: ingredient.unit.id }},
                instruction: ingredient.instruction,
                ingredient: { connect: { id: ingredient.ingredient.id }}
              }
            }))
          }
        }
      });
      
    } else {
      // Handle tags - find or create them
      let tagConnections: { id: string }[] = [];
      if (tags && tags.length > 0) {
        tagConnections = await Promise.all(
          tags.map(async (tagName: string) => {
            let tag = await prisma.tag.findFirst({
              where: { name: tagName }
            });
            if (!tag) {
              tag = await prisma.tag.create({
                data: { name: tagName }
              });
            }
            return { id: tag.id };
          })
        );
      }

      recipe = await prisma.recipe.create({
        data: {
          slug: recipeSlug,
          title: title,
          serves: serves,
          categoryId: category,
          thumbnail: thumbnail,
          instructions: instructions,
          video: video,
          link: link,
          gallery: gallery,
          tags: {
            connect: tagConnections
          },
          ingredients: {
            create: ingredients.map(item => ({
              amount: item.amount,
              unit: {
                connect: { id: item.unit.id }
              },
              instruction: item.instruction,
              ingredient: {
                connect: { id: item.ingredient.id }
              }
            }))
          }
        }
      })
    }

    return NextResponse.json({
      message: recipeId ? 'Recipe updated successfully' : 'Recipe created successfully',
      recipe: recipe
    });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/add-new-recipe',
      recipeId: id,
      slug,
    });
  }
}

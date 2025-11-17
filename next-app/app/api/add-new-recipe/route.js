import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth.js';
import { prisma } from "@/utils/prisma";
import cuid from 'cuid';
import { RecipeSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errorHandler';

export async function POST(req) {
  try {
    const session = await getServerSession(options);

    if (!session || !isAdmin(session.user.email)) {
      throw new AuthenticationError('Admin access required');
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(RecipeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      id,
      slug,
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


    var recipe;
    
    if (id) {
      // Check if recipe exists before updating
      const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
      if (!existingRecipe) {
        throw new NotFoundError(`Recipe with ID ${id} not found`);
      }

      recipe = await prisma.recipe.update({
        where: { id: id },
        data: {
          slug: slug,
          title: title,
          serves: serves,
          categoryId: category,
          thumbnail: thumbnail,
          instructions: instructions,
          video: video,
          link: link,
          gallery: gallery,
          tags: tags,
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
      recipe = await prisma.recipe.create({
        data: {
          slug: slug,
          title: title,
          serves: serves,
          categoryId: category,
          thumbnail: thumbnail,
          instructions: instructions,
          video: video,
          link: link,
          gallery: gallery,
          tags: tags,
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
      message: id ? 'Recipe updated successfully' : 'Recipe created successfully',
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

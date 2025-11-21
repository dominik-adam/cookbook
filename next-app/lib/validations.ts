/**
 * Validation schemas for API routes using Zod
 * Centralized validation to ensure data integrity and security
 */

import { z } from 'zod';
import RecipeCategory from '@/enum/recipeCategory';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * CUID validation - Prisma uses CUIDs for IDs
 */
const cuidSchema = z.string().cuid('Invalid ID format');

/**
 * Positive number validation
 */
const positiveNumber = z.number().positive('Must be a positive number');

/**
 * Optional positive number (can be undefined or null)
 */
const optionalPositiveNumber = z.number().positive('Must be a positive number').optional().nullable();

// ============================================================================
// Bag Ingredient Schemas
// ============================================================================

/**
 * Schema for adding a single ingredient to the bag
 */
export const AddToBagSchema = z.object({
  ingredientId: cuidSchema,
  unitId: cuidSchema,
  amount: optionalPositiveNumber,
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
});

/**
 * Schema for adding multiple ingredients to the bag
 */
export const AddToBagManySchema = z.object({
  ingredients: z.array(
    z.object({
      ingredientId: cuidSchema,
      unitId: cuidSchema,
      amount: optionalPositiveNumber,
    })
  ),
  multiplier: positiveNumber,
});

/**
 * Schema for updating a bag ingredient
 */
export const UpdateBagIngredientSchema = z.object({
  ingredientId: cuidSchema,
  unitId: cuidSchema,
  amount: optionalPositiveNumber,
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
});

/**
 * Schema for removing a bag ingredient (query params)
 */
export const RemoveFromBagSchema = z.object({
  ingredientId: cuidSchema,
  unitId: cuidSchema,
});

// ============================================================================
// Recipe State Schemas
// ============================================================================

/**
 * Schema for updating recipe state
 */
export const UpdateRecipeStateSchema = z.object({
  recipeId: cuidSchema,
  slider: z.number().int().positive('Servings must be a positive integer').optional(),
  ingredient: z.object({
    index: z.number().int().nonnegative('Index must be non-negative'),
    newState: z.string().regex(/^[01]+$/, 'State must be a binary string'),
  }).optional(),
}).refine(
  (data) => data.slider !== undefined || data.ingredient !== undefined,
  { message: 'Either slider or ingredient must be provided' }
);

/**
 * Schema for clearing recipe state
 */
export const ClearRecipeStateSchema = z.object({
  recipeId: cuidSchema,
  clearState: z.string().regex(/^[01]+$/, 'State must be a binary string'),
});

// ============================================================================
// Recipe Schemas
// ============================================================================

/**
 * Schema for recipe ingredient (nested in recipe)
 */
const RecipeIngredientSchema = z.object({
  id: cuidSchema.optional(),
  ingredientId: cuidSchema.optional(),
  unitId: cuidSchema.optional(),
  amount: optionalPositiveNumber,
  instruction: z.string().max(500, 'Instruction must be less than 500 characters').optional().nullable(),
  ingredient: z.object({
    id: cuidSchema,
  }).optional(),
  unit: z.object({
    id: cuidSchema,
  }).optional(),
});

/**
 * Schema for creating/updating a recipe
 */
export const RecipeSchema = z.object({
  id: cuidSchema.optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(200, 'Slug must be less than 200 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  category: z.enum([RecipeCategory.FOOD, RecipeCategory.DRINK] as const, {
    message: 'Category must be either "food" or "drink"',
  }),
  serves: z.number().int().positive('Servings must be a positive integer'),
  thumbnail: z.string().max(500, 'Thumbnail path must be less than 500 characters').optional().nullable(),
  instructions: z.string().optional().nullable(),
  video: z.string().max(200, 'Video ID must be less than 200 characters').optional().nullable(),
  link: z.string().max(500, 'Link must be less than 500 characters').optional().nullable(),
  gallery: z.array(z.string()).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  ingredients: z.array(RecipeIngredientSchema),
});

// ============================================================================
// Ingredient Schemas
// ============================================================================

/**
 * Schema for creating a new ingredient
 */
export const CreateIngredientSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  image: z.string()
    .max(500, 'Image path must be less than 500 characters')
    .optional()
    .nullable()
    .default('/images/ingredients/placeholder.png'),
  caloriesPer100g: z.number().nonnegative('Calories must be non-negative').optional().nullable(),
  proteinPer100g: z.number().nonnegative('Protein must be non-negative').optional().nullable(),
  carbsPer100g: z.number().nonnegative('Carbs must be non-negative').optional().nullable(),
  fatPer100g: z.number().nonnegative('Fat must be non-negative').optional().nullable(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate data against a schema and return formatted error if validation fails
 *
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {{ success: boolean, data?: any, error?: string }}
 */
export function validateData(schema: z.ZodSchema, data: any): { success: true; data: any } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors into a readable message
      const errorMessages = error.issues.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return {
        success: false,
        error: errorMessages.join(', ')
      };
    }
    return {
      success: false,
      error: 'Validation failed'
    };
  }
}

/**
 * Validate query parameters (converts string values to proper types where needed)
 *
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {Object} params - Query parameters (typically URLSearchParams)
 * @returns {{ success: boolean, data?: any, error?: string }}
 */
export function validateQueryParams(schema: z.ZodSchema, params: any) {
  // Query params are always strings, so we pass them as-is
  // The schema should handle type coercion if needed
  return validateData(schema, params);
}

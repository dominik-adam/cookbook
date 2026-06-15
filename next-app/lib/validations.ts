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

// ============================================================================
// Workout Schemas
// ============================================================================

const ExerciseInputSchema = z.object({
  exerciseName: z.string().min(1, 'Exercise name is required').max(200),
  sets: z.number().int().positive().optional().nullable(),
  reps: z.number().int().positive().optional().nullable(),
  weight: z.number().nonnegative().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  distance: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const LogWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().max(1000).optional().nullable(),
  exercises: z.array(ExerciseInputSchema).min(1, 'At least one exercise is required'),
});

export const UpdateWorkoutSchema = z.object({
  sessionId: z.string().cuid('Invalid session ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().max(1000).optional().nullable(),
  exercises: z.array(ExerciseInputSchema).min(1, 'At least one exercise is required'),
});

export const DeleteWorkoutSchema = z.object({
  sessionId: z.string().cuid('Invalid session ID'),
});

// ============================================================================
// Planner Schemas
// ============================================================================

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const PlannerWaterSchema = z.object({
  date: dateStringSchema,
  amount: z.number().nonnegative().max(20),
});

export const PlannerCreatineSchema = z.object({
  date: dateStringSchema,
  done: z.boolean(),
});

export const PlannerWeightSchema = z.object({
  date: dateStringSchema,
  weightKg: z.number().positive().max(500).nullable(),
});

export const PlannerCalorieAddSchema = z.object({
  date: dateStringSchema,
  amount: z.number().int().positive().max(10000),
  label: z.string().max(100).optional(),
});

export const PlannerCalorieRemoveSchema = z.object({
  entryId: z.string().cuid('Invalid entry ID'),
});

export const PlannerExerciseLogSchema = z.object({
  scheduleId: z.string().cuid('Invalid schedule ID'),
  sprintsDone: z.number().int().nonnegative().optional(),
  setResults: z.array(z.number().int().nonnegative()).optional(),
  weightKgUsed: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
  fullyCompleted: z.boolean().default(false),
});

export const PlannerRescheduleSchema = z.object({
  scheduleId: z.string().cuid('Invalid schedule ID'),
  direction: z.enum(['prev', 'next']),
});

export const PlannerSettingsUpdateSchema = z.object({
  waterTargetL: z.number().positive().optional(),
  creatineTargetG: z.number().positive().optional(),
  calorieTarget: z.number().int().positive().optional(),
  sprintCount: z.number().int().positive().optional(),
  sprintFrequencyDays: z.number().int().min(1).max(14).optional(),
  pullupWeightKg: z.number().nonnegative().optional(),
  pullupSets: z.number().int().positive().optional(),
  pullupRepsPerSet: z.number().int().positive().optional(),
  pullupFrequencyDays: z.number().int().min(1).max(14).optional(),
  dipWeightKg: z.number().nonnegative().optional(),
  dipSets: z.number().int().positive().optional(),
  dipRepsPerSet: z.number().int().positive().optional(),
  dipFrequencyDays: z.number().int().min(1).max(14).optional(),
  sprintStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  pullupStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  dipStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

// ============================================================================
// Subscription Schemas
// ============================================================================

export const AddSubscriptionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  price: z.number().positive('Price must be positive'),
  periodicity: z.enum(['weekly', 'monthly', 'quarterly', 'yearly'], {
    message: 'Periodicity must be weekly, monthly, quarterly, or yearly',
  }),
  image: z.string().max(500, 'Image URL must be less than 500 characters').optional().nullable(),
});

export const UpdateSubscriptionSchema = AddSubscriptionSchema.extend({
  id: cuidSchema,
});

export const RemoveSubscriptionSchema = z.object({
  id: cuidSchema,
});

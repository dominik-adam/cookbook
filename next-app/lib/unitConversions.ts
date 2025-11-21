/**
 * Unit conversion utilities for nutritional calculations
 *
 * Converts various measurement units to grams/milliliters for calorie calculations.
 * All conversions are approximate and based on standard cooking measurements.
 */

/**
 * Standard conversion rates to grams/milliliters
 *
 * For volume measurements:
 * - Assumes liquid density of ~1 g/ml (like water)
 * - For solid ingredients, actual weight varies significantly
 *
 * For count-based measurements (piece, whole, etc.):
 * - Returns null to indicate ingredient-specific weight is needed
 */
export const UNIT_TO_GRAMS: Record<string, number | null> = {
  // Volume - US Customary
  'cup': 240,
  'cups': 240,
  'tablespoon': 15,
  'tablespoons': 15,
  'tbsp': 15,
  'teaspoon': 5,
  'teaspoons': 5,
  'tsp': 5,
  'fluid ounce': 30,
  'fluid ounces': 30,
  'fl oz': 30,
  'pint': 473,
  'pints': 473,
  'quart': 946,
  'quarts': 946,
  'gallon': 3785,
  'gallons': 3785,

  // Volume - Metric
  'milliliter': 1,
  'milliliters': 1,
  'ml': 1,
  'liter': 1000,
  'liters': 1000,
  'l': 1000,
  'deciliter': 100,
  'deciliters': 100,
  'dl': 100,
  'centiliter': 10,
  'centiliters': 10,
  'cl': 10,

  // Weight - Metric
  'gram': 1,
  'grams': 1,
  'g': 1,
  'kilogram': 1000,
  'kilograms': 1000,
  'kg': 1000,
  'milligram': 0.001,
  'milligrams': 0.001,
  'mg': 0.001,

  // Weight - Imperial
  'ounce': 28.35,
  'ounces': 28.35,
  'oz': 28.35,
  'pound': 453.59,
  'pounds': 453.59,
  'lb': 453.59,
  'lbs': 453.59,

  // Count-based (require ingredient-specific data)
  'piece': null,
  'pieces': null,
  'whole': null,
  'clove': null,
  'cloves': null,
  'slice': null,
  'slices': null,
  'leaf': null,
  'leaves': null,
  'sprig': null,
  'sprigs': null,
  'stalk': null,
  'stalks': null,
  'head': null,
  'heads': null,
  'bunch': null,
  'bunches': null,
  'package': null,
  'packages': null,
  'can': null,
  'cans': null,
  'jar': null,
  'jars': null,

  // Approximate/imprecise measures (return null)
  'pinch': null,
  'pinches': null,
  'dash': null,
  'dashes': null,
  'handful': null,
  'handfuls': null,
  'to taste': null,
  'as needed': null,
};

/**
 * Get conversion factor from unit name to grams
 *
 * @param unitName - The unit name (e.g., "cup", "tablespoon", "g")
 * @returns Number of grams per unit, or null if conversion not available
 */
export function getGramsPerUnit(unitName: string): number | null {
  const normalizedUnit = unitName.toLowerCase().trim();

  if (normalizedUnit in UNIT_TO_GRAMS) {
    return UNIT_TO_GRAMS[normalizedUnit];
  }

  // Try to match partial strings (e.g., "Cup" or "CUPS")
  const matchingKey = Object.keys(UNIT_TO_GRAMS).find(
    key => key.toLowerCase() === normalizedUnit
  );

  return matchingKey ? UNIT_TO_GRAMS[matchingKey] : null;
}

/**
 * Check if a unit can be converted to grams
 *
 * @param unitName - The unit name to check
 * @returns true if the unit can be converted, false otherwise
 */
export function isConvertibleUnit(unitName: string): boolean {
  const gramsPerUnit = getGramsPerUnit(unitName);
  return gramsPerUnit !== null && gramsPerUnit > 0;
}

/**
 * Convert an amount in a specific unit to grams
 *
 * @param amount - The quantity
 * @param unitName - The unit of measurement
 * @returns Total grams, or null if conversion not possible
 */
export function convertToGrams(amount: number, unitName: string): number | null {
  const gramsPerUnit = getGramsPerUnit(unitName);

  if (gramsPerUnit === null || amount <= 0) {
    return null;
  }

  return amount * gramsPerUnit;
}

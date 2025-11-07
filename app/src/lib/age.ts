/**
 * Calculate age from a date of birth string
 * @param birthdate ISO date string (YYYY-MM-DD)
 * @returns age in years, or null if invalid
 */
export function calculateAge(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null;

  const today = new Date();
  const birth = new Date(birthdate);

  if (isNaN(birth.getTime())) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if a birthdate meets the minimum age requirement
 * @param birthdate ISO date string (YYYY-MM-DD)
 * @param minAge minimum age required (default 18)
 * @returns true if age meets requirement
 */
export function meetsMinimumAge(birthdate: string | null | undefined, minAge = 18): boolean {
  const age = calculateAge(birthdate);
  return age !== null && age >= minAge;
}

/**
 * Validate age is within acceptable range
 * @param age computed age
 * @returns true if age is between 18 and 120
 */
export function isValidAge(age: number | null): boolean {
  return age !== null && age >= 18 && age <= 120;
}


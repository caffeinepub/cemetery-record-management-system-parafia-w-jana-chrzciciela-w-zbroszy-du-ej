import type { GraveRecord, PublicGraveShape } from '../backend';

/**
 * Normalizes text for case-insensitive comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Performs in-memory full-text search on grave records (admin mode)
 * Searches across: deceased names, owner names, owner address, alley, plot number
 */
export function searchGravesInMemory(
  graves: GraveRecord[],
  query: string
): GraveRecord[] {
  if (!query || query.trim() === '') {
    return graves;
  }

  const normalizedQuery = normalizeText(query);

  return graves.filter((grave) => {
    // Search in alley
    if (normalizeText(grave.alley).includes(normalizedQuery)) {
      return true;
    }

    // Search in plot number
    if (grave.plotNumber.toString().includes(normalizedQuery)) {
      return true;
    }

    // Search in deceased persons (first name, last name, place of death)
    for (const person of grave.deceasedPersons) {
      if (
        normalizeText(person.firstName).includes(normalizedQuery) ||
        normalizeText(person.lastName).includes(normalizedQuery) ||
        normalizeText(person.placeOfDeath).includes(normalizedQuery)
      ) {
        return true;
      }
    }

    // Search in owner information
    if (grave.owner) {
      if (
        normalizeText(grave.owner.firstName).includes(normalizedQuery) ||
        normalizeText(grave.owner.lastName).includes(normalizedQuery) ||
        normalizeText(grave.owner.address).includes(normalizedQuery)
      ) {
        return true;
      }

      // Search in phone if present
      if (grave.owner.phone && normalizeText(grave.owner.phone).includes(normalizedQuery)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Performs in-memory full-text search on public grave shapes (public mode)
 * Only searches: deceased first name, deceased last name, year of death
 * Does NOT search owner, address, phone, or other restricted fields
 */
export function searchPublicGravesInMemory(
  graves: PublicGraveShape[],
  query: string
): PublicGraveShape[] {
  if (!query || query.trim() === '') {
    return graves;
  }

  const normalizedQuery = normalizeText(query);

  return graves.filter((grave) => {
    // Search in deceased first name
    if (normalizeText(grave.firstName).includes(normalizedQuery)) {
      return true;
    }

    // Search in deceased last name
    if (normalizeText(grave.lastName).includes(normalizedQuery)) {
      return true;
    }

    // Search in year of death if present
    if (grave.yearOfDeath && grave.yearOfDeath.toString().includes(normalizedQuery)) {
      return true;
    }

    return false;
  });
}

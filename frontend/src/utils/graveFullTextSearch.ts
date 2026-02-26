import type { GraveRecord, PublicGraveShape, PublicGraveResult } from '../backend';

/**
 * Normalizes text for case-insensitive comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Builds a normalized search index for a grave record (admin mode)
 * Concatenates all searchable fields into a single lowercase string
 */
export function buildGraveSearchIndex(grave: GraveRecord): string {
  const parts: string[] = [
    grave.alley,
    grave.plotNumber.toString(),
  ];

  // Add deceased persons data
  for (const person of grave.deceasedPersons) {
    parts.push(person.firstName, person.lastName, person.placeOfDeath);
  }

  // Add owner data if present
  if (grave.owner) {
    parts.push(
      grave.owner.firstName,
      grave.owner.lastName,
      grave.owner.address
    );
    if (grave.owner.phone) {
      parts.push(grave.owner.phone);
    }
  }

  return normalizeText(parts.join(' '));
}

/**
 * Builds a normalized search index for a public grave shape (public mode)
 * Only includes deceased name and year of death
 */
export function buildPublicGraveSearchIndex(grave: PublicGraveShape): string {
  const parts: string[] = [
    grave.firstName,
    grave.lastName,
  ];

  if (grave.yearOfDeath) {
    parts.push(grave.yearOfDeath.toString());
  }

  return normalizeText(parts.join(' '));
}

/**
 * Builds a normalized search index for a public grave result (public mode with location)
 * Includes deceased name, year of death, alley, and plot number
 */
export function buildPublicGraveResultSearchIndex(grave: PublicGraveResult): string {
  const parts: string[] = [
    grave.firstName,
    grave.lastName,
    grave.alley,
    grave.plotNumber.toString(),
  ];

  if (grave.yearOfDeath) {
    parts.push(grave.yearOfDeath.toString());
  }

  return normalizeText(parts.join(' '));
}

/**
 * Performs in-memory full-text search on grave records (admin mode)
 * Searches across: deceased names, owner names, owner address, alley, plot number
 * Supports early exit when maxResults is specified
 */
export function searchGravesInMemory(
  graves: GraveRecord[],
  query: string,
  maxResults?: number
): GraveRecord[] {
  if (!query || query.trim() === '') {
    return maxResults ? graves.slice(0, maxResults) : graves;
  }

  const normalizedQuery = normalizeText(query);
  const results: GraveRecord[] = [];

  for (const grave of graves) {
    const searchIndex = buildGraveSearchIndex(grave);
    
    if (searchIndex.includes(normalizedQuery)) {
      results.push(grave);
      
      // Early exit if we've reached maxResults
      if (maxResults && results.length >= maxResults) {
        break;
      }
    }
  }

  return results;
}

/**
 * Performs in-memory full-text search on public grave shapes (public mode)
 * Only searches: deceased first name, deceased last name, year of death
 * Does NOT search owner, address, phone, or other restricted fields
 * Supports early exit when maxResults is specified
 */
export function searchPublicGravesInMemory(
  graves: PublicGraveShape[],
  query: string,
  maxResults?: number
): PublicGraveShape[] {
  if (!query || query.trim() === '') {
    return maxResults ? graves.slice(0, maxResults) : graves;
  }

  const normalizedQuery = normalizeText(query);
  const results: PublicGraveShape[] = [];

  for (const grave of graves) {
    const searchIndex = buildPublicGraveSearchIndex(grave);
    
    if (searchIndex.includes(normalizedQuery)) {
      results.push(grave);
      
      // Early exit if we've reached maxResults
      if (maxResults && results.length >= maxResults) {
        break;
      }
    }
  }

  return results;
}

/**
 * Performs in-memory full-text search on public grave results (public mode with location)
 * Searches: deceased first name, deceased last name, year of death, alley, plot number
 * Supports early exit when maxResults is specified
 */
export function searchPublicGraveResultsInMemory(
  graves: PublicGraveResult[],
  query: string,
  maxResults?: number
): PublicGraveResult[] {
  if (!query || query.trim() === '') {
    return maxResults ? graves.slice(0, maxResults) : graves;
  }

  const normalizedQuery = normalizeText(query);
  const results: PublicGraveResult[] = [];

  for (const grave of graves) {
    const searchIndex = buildPublicGraveResultSearchIndex(grave);
    
    if (searchIndex.includes(normalizedQuery)) {
      results.push(grave);
      
      // Early exit if we've reached maxResults
      if (maxResults && results.length >= maxResults) {
        break;
      }
    }
  }

  return results;
}

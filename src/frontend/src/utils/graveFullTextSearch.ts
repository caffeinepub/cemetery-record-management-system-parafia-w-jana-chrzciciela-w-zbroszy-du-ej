import type { GraveRecord, PublicGraveShape } from '../backend';

/**
 * Normalizes text for case-insensitive comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

// Cache for normalized searchable strings
interface GraveSearchIndex {
  id: string; // Unique identifier for the grave
  searchableText: string; // Pre-normalized concatenated searchable fields
}

interface PublicGraveSearchIndex {
  id: string; // Unique identifier (firstName + lastName + yearOfDeath)
  searchableText: string; // Pre-normalized concatenated searchable fields
}

// Cache storage
let adminGraveIndexCache: Map<string, GraveSearchIndex> | null = null;
let adminGraveIndexVersion: number = 0;

let publicGraveIndexCache: Map<string, PublicGraveSearchIndex> | null = null;
let publicGraveIndexVersion: number = 0;

/**
 * Creates a unique identifier for a grave record
 */
function getGraveId(grave: GraveRecord): string {
  return `${grave.id}`;
}

/**
 * Creates a unique identifier for a public grave shape
 */
function getPublicGraveId(grave: PublicGraveShape): string {
  return `${grave.firstName}_${grave.lastName}_${grave.yearOfDeath ?? 'null'}`;
}

/**
 * Builds searchable text index for admin graves
 */
function buildAdminGraveIndex(grave: GraveRecord): string {
  const parts: string[] = [];

  // Add alley and plot number
  parts.push(normalizeText(grave.alley));
  parts.push(grave.plotNumber.toString());

  // Add deceased persons info
  for (const person of grave.deceasedPersons) {
    parts.push(normalizeText(person.firstName));
    parts.push(normalizeText(person.lastName));
    parts.push(normalizeText(person.placeOfDeath));
  }

  // Add owner info if present
  if (grave.owner) {
    parts.push(normalizeText(grave.owner.firstName));
    parts.push(normalizeText(grave.owner.lastName));
    parts.push(normalizeText(grave.owner.address));
    if (grave.owner.phone) {
      parts.push(normalizeText(grave.owner.phone));
    }
  }

  return parts.join(' ');
}

/**
 * Builds searchable text index for public graves
 */
function buildPublicGraveIndex(grave: PublicGraveShape): string {
  const parts: string[] = [];

  parts.push(normalizeText(grave.firstName));
  parts.push(normalizeText(grave.lastName));
  if (grave.yearOfDeath) {
    parts.push(grave.yearOfDeath.toString());
  }

  return parts.join(' ');
}

/**
 * Gets or creates the admin grave search index
 */
function getAdminGraveSearchIndex(graves: GraveRecord[]): Map<string, GraveSearchIndex> {
  // Create a version identifier based on array length and first/last IDs
  const currentVersion = graves.length > 0 
    ? graves.length * 1000 + Number(graves[0].id) + Number(graves[graves.length - 1].id)
    : 0;

  // If cache exists and version matches, return cached index
  if (adminGraveIndexCache && adminGraveIndexVersion === currentVersion) {
    return adminGraveIndexCache;
  }

  // Build new index
  const newIndex = new Map<string, GraveSearchIndex>();
  
  for (const grave of graves) {
    const id = getGraveId(grave);
    newIndex.set(id, {
      id,
      searchableText: buildAdminGraveIndex(grave),
    });
  }

  // Update cache
  adminGraveIndexCache = newIndex;
  adminGraveIndexVersion = currentVersion;

  return newIndex;
}

/**
 * Gets or creates the public grave search index
 */
function getPublicGraveSearchIndex(graves: PublicGraveShape[]): Map<string, PublicGraveSearchIndex> {
  // Create a version identifier based on array length
  const currentVersion = graves.length;

  // If cache exists and version matches, return cached index
  if (publicGraveIndexCache && publicGraveIndexVersion === currentVersion) {
    return publicGraveIndexCache;
  }

  // Build new index
  const newIndex = new Map<string, PublicGraveSearchIndex>();
  
  for (const grave of graves) {
    const id = getPublicGraveId(grave);
    newIndex.set(id, {
      id,
      searchableText: buildPublicGraveIndex(grave),
    });
  }

  // Update cache
  publicGraveIndexCache = newIndex;
  publicGraveIndexVersion = currentVersion;

  return newIndex;
}

/**
 * Performs in-memory full-text search on grave records (admin mode)
 * Searches across: deceased names, owner names, owner address, alley, plot number
 * Uses cached normalized searchable strings for performance
 */
export function searchGravesInMemory(
  graves: GraveRecord[],
  query: string
): GraveRecord[] {
  if (!query || query.trim() === '') {
    return graves;
  }

  const normalizedQuery = normalizeText(query);
  const searchIndex = getAdminGraveSearchIndex(graves);

  return graves.filter((grave) => {
    const graveId = getGraveId(grave);
    const indexEntry = searchIndex.get(graveId);
    
    if (!indexEntry) {
      // Fallback: build index on the fly if not found
      const searchableText = buildAdminGraveIndex(grave);
      return searchableText.includes(normalizedQuery);
    }

    return indexEntry.searchableText.includes(normalizedQuery);
  });
}

/**
 * Performs in-memory full-text search on public grave shapes (public mode)
 * Only searches: deceased first name, deceased last name, year of death
 * Does NOT search owner, address, phone, or other restricted fields
 * Uses cached normalized searchable strings for performance
 */
export function searchPublicGravesInMemory(
  graves: PublicGraveShape[],
  query: string
): PublicGraveShape[] {
  if (!query || query.trim() === '') {
    return graves;
  }

  const normalizedQuery = normalizeText(query);
  const searchIndex = getPublicGraveSearchIndex(graves);

  return graves.filter((grave) => {
    const graveId = getPublicGraveId(grave);
    const indexEntry = searchIndex.get(graveId);
    
    if (!indexEntry) {
      // Fallback: build index on the fly if not found
      const searchableText = buildPublicGraveIndex(grave);
      return searchableText.includes(normalizedQuery);
    }

    return indexEntry.searchableText.includes(normalizedQuery);
  });
}

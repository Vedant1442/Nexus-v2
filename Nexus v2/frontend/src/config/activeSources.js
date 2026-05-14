/**
 * Platforms the UI tracks and searches. Add entries (e.g. 'zepto') when scrapers/APIs are enabled again.
 * Order is used for result sections and tabs.
 */
export const ACTIVE_SOURCES = ['blinkit'];

function capitalizeSource(id) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/** Empty product buckets keyed only by active sources */
export function emptyProductBuckets() {
  return Object.fromEntries(ACTIVE_SOURCES.map((s) => [s, []]));
}

/** Initial or reset `serviceStatus` for active sources */
export function buildInitialServiceStatus(value = 'idle') {
  return Object.fromEntries(ACTIVE_SOURCES.map((s) => [s, value]));
}

/** User-facing search status when starting a new query */
export function searchStartingMessage() {
  if (ACTIVE_SOURCES.length === 1) {
    return `Searching ${capitalizeSource(ACTIVE_SOURCES[0])}…`;
  }
  return `Searching ${ACTIVE_SOURCES.map(capitalizeSource).join(', ')}…`;
}

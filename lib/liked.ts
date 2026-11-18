// Client-side record of which use cases the current browser has liked, so the
// heart stays filled and we don't double-count. No DB; localStorage only.
const KEY = "portal_liked_slugs";

export function getLikedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setLiked(slug: string, liked: boolean) {
  if (typeof window === "undefined") return;
  const set = getLikedSet();
  if (liked) set.add(slug);
  else set.delete(slug);
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

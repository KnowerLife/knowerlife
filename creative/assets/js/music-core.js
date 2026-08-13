export function parseDuration(value) {
  if (typeof value !== 'string') return 0;
  const parts = value.trim().split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part) || part < 0)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function normalizeTracks(payload) {
  const input = Array.isArray(payload?.tracks) ? payload.tracks : [];
  const ids = new Set();
  return input.filter((track) => {
    if (!track || track.enabled === false) return false;
    const id = String(track.id || '').trim();
    if (!id || ids.has(id) || !track.title || !track.audio) return false;
    ids.add(id);
    return true;
  }).map((track) => ({
    ...track,
    id: String(track.id).trim(),
    title: String(track.title).trim(),
    artist: String(track.artist || payload.artist || 'KnowerLife').trim(),
    cover: String(track.cover || 'assets/covers/default-cover.jpg'),
    genre: String(track.genre || 'Other'),
    mood: Array.isArray(track.mood) ? track.mood.map(String) : [],
    tags: Array.isArray(track.tags) ? track.tags.map(String) : [],
    featured: Boolean(track.featured),
    downloadable: Boolean(track.downloadable)
  }));
}

export function filterTracks(tracks, { query = '', genre = 'all', favorites = null } = {}) {
  const needle = query.trim().toLocaleLowerCase('ru');
  return tracks.filter((track) => {
    if (genre !== 'all' && track.genre !== genre) return false;
    if (favorites && !favorites.has(track.id)) return false;
    if (!needle) return true;
    const haystack = [
      track.title, track.artist, track.genre, track.description,
      ...(track.mood || []), ...(track.tags || [])
    ].filter(Boolean).join(' ').toLocaleLowerCase('ru');
    return haystack.includes(needle);
  });
}

export function sortTracks(tracks, mode = 'newest') {
  const copy = [...tracks];
  if (mode === 'title') return copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  if (mode === 'featured') return copy.sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.releaseDate || '').localeCompare(String(a.releaseDate || '')));
  return copy.sort((a, b) => String(b.releaseDate || '').localeCompare(String(a.releaseDate || '')));
}

export function nextIndex(length, current, { shuffle = false, random = Math.random } = {}) {
  if (length <= 0) return -1;
  if (shuffle && length > 1) {
    let candidate = current;
    for (let i = 0; i < 8 && candidate === current; i += 1) {
      candidate = Math.floor(random() * length);
    }
    return candidate === current ? (current + 1) % length : candidate;
  }
  return (current + 1) % length;
}

export function previousIndex(length, current) {
  if (length <= 0) return -1;
  return (current - 1 + length) % length;
}

import {
  filterTracks,
  formatTime,
  nextIndex,
  normalizeTracks,
  parseDuration,
  previousIndex,
  sortTracks
} from '../../creative/assets/js/music-core.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

const state = {
  tracks: [],
  visible: [],
  current: -1,
  query: '',
  genre: 'all',
  sort: 'newest',
  onlyFavorites: false,
  favorites: new Set(storage.get('kl-music-favorites', [])),
  plays: storage.get('kl-music-plays', {}),
  shuffle: false,
  repeat: false,
  installPrompt: null,
  visualizerStarted: false,
  visualizerBlocked: false
};

const els = {
  audio: $('#audio'),
  grid: $('#trackGrid'),
  featured: $('#featuredTracks'),
  featuredSection: $('#featuredSection'),
  empty: $('#emptyState'),
  search: $('#trackSearch'),
  sort: $('#trackSort'),
  genreFilters: $('#genreFilters'),
  favoriteFilter: $('#favoriteFilter'),
  resultCount: $('#resultCount'),
  trackCount: $('[data-track-count]'),
  genreCount: $('[data-genre-count]'),
  totalDuration: $('[data-total-duration]'),
  player: $('#player'),
  playerCover: $('#playerCover'),
  playerTitle: $('#playerTitle'),
  playerArtist: $('#playerArtist'),
  playerPlay: $('#playerPlay'),
  playerPrev: $('#playerPrev'),
  playerNext: $('#playerNext'),
  playerProgress: $('#playerProgress'),
  playerCurrent: $('#playerCurrent'),
  playerDuration: $('#playerDuration'),
  playerVolume: $('#playerVolume'),
  playerMute: $('#playerMute'),
  playerFavorite: $('#playerFavorite'),
  playerShare: $('#playerShare'),
  shuffle: $('#shuffleBtn'),
  repeat: $('#repeatBtn'),
  visualizer: $('#visualizer'),
  dialog: $('#trackDialog'),
  dialogClose: $('#dialogClose'),
  dialogCover: $('#dialogCover'),
  dialogTitle: $('#dialogTitle'),
  dialogMeta: $('#dialogMeta'),
  dialogDescription: $('#dialogDescription'),
  dialogStory: $('#dialogStory'),
  dialogLyrics: $('#dialogLyrics'),
  dialogTags: $('#dialogTags'),
  dialogSuno: $('#dialogSuno'),
  dialogAudio: $('#dialogAudio'),
  dialogDownload: $('#dialogDownload'),
  dialogCredits: $('#dialogCredits'),
  toast: $('#toast'),
  installBtn: $('#installBtn'),
  themeToggle: $('#themeToggle'),
  accessibilityToggle: $('#accessibilityToggle'),
  menuButton: $('#menuButton'),
  mobileNav: $('#mobileNav'),
  mobileClose: $('#mobileClose')
};

function toast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { els.toast.hidden = true; }, 2200);
}

function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, document.baseURI);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.href;
  } catch {
    return '';
  }
}

function button(label, className, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}

function tag(text) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = text;
  return span;
}

function makeTrackCard(track, index, featured = false) {
  const article = document.createElement('article');
  article.className = featured ? 'track-card track-card--featured' : 'track-card';
  article.dataset.trackId = track.id;

  const media = document.createElement('div');
  media.className = 'track-card__media';

  const img = document.createElement('img');
  img.src = track.cover;
  img.alt = `Cover art for “${track.title}”`;
  img.loading = featured ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => { img.src = '../../creative/assets/covers/default-cover.jpg'; });

  const play = button('▶', 'track-card__play', () => playTrack(index));
  play.setAttribute('aria-label', `Play “${track.title}”`);
  media.append(img, play);

  const content = document.createElement('div');
  content.className = 'track-card__content';

  const top = document.createElement('div');
  top.className = 'track-card__top';
  const meta = document.createElement('p');
  meta.className = 'track-card__meta';
  meta.textContent = [track.genre, track.duration, track.releaseDate?.slice(0, 4)].filter(Boolean).join(' · ');
  const fav = button(state.favorites.has(track.id) ? '♥' : '♡', 'track-card__favorite', () => toggleFavorite(track.id));
  fav.setAttribute('aria-label', state.favorites.has(track.id) ? 'Remove from favorites' : 'Add to favorites');
  top.append(meta, fav);

  const title = document.createElement('h3');
  title.textContent = track.title;

  const desc = document.createElement('p');
  desc.className = 'track-card__description';
  desc.textContent = track.description || 'A KnowerLife music work.';

  const tags = document.createElement('div');
  tags.className = 'tags';
  [track.genre, ...(track.mood || []).slice(0, 2)].filter(Boolean).forEach((item) => tags.append(tag(item)));

  const actions = document.createElement('div');
  actions.className = 'track-card__actions';
  actions.append(
    button('Listen', 'btn btn--primary btn--small', () => playTrack(index)),
    button('Details', 'btn btn--secondary btn--small', () => openTrackDialog(index))
  );

  content.append(top, title, desc, tags, actions);
  article.append(media, content);
  return article;
}

function renderFeatured() {
  els.featured.replaceChildren();
  const featured = state.tracks.filter((track) => track.featured).slice(0, 3);
  els.featuredSection.hidden = featured.length === 0;
  featured.forEach((track) => {
    const index = state.tracks.findIndex((item) => item.id === track.id);
    els.featured.append(makeTrackCard(track, index, true));
  });
}

function renderGenres() {
  const genres = [...new Set(state.tracks.map((track) => track.genre))].sort((a, b) => a.localeCompare(b, 'ru'));
  els.genreFilters.replaceChildren();
  const all = button('All', 'filter-chip', () => setGenre('all'));
  all.setAttribute('aria-pressed', String(state.genre === 'all'));
  els.genreFilters.append(all);
  genres.forEach((genre) => {
    const item = button(genre, 'filter-chip', () => setGenre(genre));
    item.setAttribute('aria-pressed', String(state.genre === genre));
    els.genreFilters.append(item);
  });
}

function setGenre(genre) {
  state.genre = genre;
  renderGenres();
  renderCatalog();
}

function renderCatalog() {
  const filtered = filterTracks(state.tracks, {
    query: state.query,
    genre: state.genre,
    favorites: state.onlyFavorites ? state.favorites : null
  });
  state.visible = sortTracks(filtered, state.sort);

  els.grid.replaceChildren();
  state.visible.forEach((track) => {
    const index = state.tracks.findIndex((item) => item.id === track.id);
    els.grid.append(makeTrackCard(track, index));
  });

  els.empty.hidden = state.visible.length !== 0;
  els.resultCount.textContent = `${state.visible.length} ${pluralTracks(state.visible.length)}`;
}

function pluralTracks(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'track';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'tracks';
  return 'tracks';
}

function updateStats() {
  const genres = new Set(state.tracks.map((track) => track.genre));
  const seconds = state.tracks.reduce((sum, track) => sum + parseDuration(track.duration), 0);
  els.trackCount.textContent = state.tracks.length;
  els.genreCount.textContent = genres.size;
  els.totalDuration.textContent = seconds ? `${Math.max(1, Math.round(seconds / 60))} min` : '—';
}

function updateHash(track) {
  const url = new URL(location.href);
  url.hash = `track=${encodeURIComponent(track.id)}`;
  history.replaceState(null, '', url);
}

function loadTrack(index, autoplay = false) {
  const track = state.tracks[index];
  if (!track) return;
  state.current = index;
  els.audio.src = track.audio;
  els.audio.dataset.counted = '';
  els.audio.load();

  els.player.hidden = false;
  els.playerCover.src = track.cover;
  els.playerCover.alt = `Cover art for “${track.title}”`;
  els.playerTitle.textContent = track.title;
  els.playerArtist.textContent = track.artist;
  els.playerDuration.textContent = track.duration || '0:00';
  els.playerProgress.value = 0;
  updateFavoriteControls(track.id);
  updateHash(track);
  updateMediaSession(track);

  storage.set('kl-music-last-track', track.id);
  if (autoplay) playCurrent();
}

async function playCurrent() {
  if (state.current < 0 && state.tracks.length) loadTrack(0);
  try {
    await setupAudioGraph();
    await els.audio.play();
  } catch {
    toast('The browser blocked autoplay.');
  }
}

function playTrack(index) {
  if (state.current !== index) loadTrack(index);
  playCurrent();
}

function pauseCurrent() {
  els.audio.pause();
}

function goNext() {
  if (!state.tracks.length) return;
  const next = nextIndex(state.tracks.length, Math.max(0, state.current), { shuffle: state.shuffle });
  loadTrack(next, true);
}

function goPrevious() {
  if (!state.tracks.length) return;
  if (els.audio.currentTime > 5) {
    els.audio.currentTime = 0;
    return;
  }
  const prev = previousIndex(state.tracks.length, Math.max(0, state.current));
  loadTrack(prev, true);
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  storage.set('kl-music-favorites', [...state.favorites]);
  updateFavoriteControls(id);
  renderFeatured();
  renderCatalog();
}

function updateFavoriteControls(id) {
  const active = state.favorites.has(id);
  if (state.current >= 0 && state.tracks[state.current]?.id === id) {
    els.playerFavorite.textContent = active ? '♥' : '♡';
    els.playerFavorite.setAttribute('aria-pressed', String(active));
  }
}

async function shareTrack() {
  const track = state.tracks[state.current];
  if (!track) return;
  const url = location.href;
  const data = { title: `${track.title} — ${track.artist}`, text: track.description || 'Listen in KnowerLife Creative Corner', url };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch {}
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Track link copied');
  } catch {
    toast('Copy the page address from your browser');
  }
}

function openTrackDialog(index) {
  const track = state.tracks[index];
  if (!track) return;
  els.dialogCover.src = track.cover;
  els.dialogCover.alt = `Cover art for “${track.title}”`;
  els.dialogTitle.textContent = track.title;
  els.dialogMeta.textContent = [track.artist, track.genre, track.duration, track.releaseDate].filter(Boolean).join(' · ');
  els.dialogDescription.textContent = track.description || '';
  els.dialogStory.textContent = track.story || 'Story not added yet.';
  els.dialogLyrics.textContent = track.lyrics || 'Lyrics not added yet.';
  els.dialogTags.replaceChildren();
  [...(track.tags || []), ...(track.mood || [])].forEach((item) => els.dialogTags.append(tag(item)));

  els.dialogSuno.hidden = !safeUrl(track.sunoUrl);
  if (!els.dialogSuno.hidden) els.dialogSuno.href = safeUrl(track.sunoUrl);
  els.dialogAudio.href = safeUrl(track.audio);
  els.dialogDownload.hidden = !track.downloadable;
  if (!els.dialogDownload.hidden) {
    els.dialogDownload.href = safeUrl(track.audio);
    els.dialogDownload.download = '';
  }

  els.dialogCredits.replaceChildren();
  Object.entries(track.credits || {}).forEach(([key, value]) => {
    const div = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = key;
    const strong = document.createElement('strong');
    strong.textContent = String(value);
    div.append(label, strong);
    els.dialogCredits.append(div);
  });

  $('#dialogPlay').onclick = () => {
    els.dialog.close();
    playTrack(index);
  };
  els.dialog.showModal();
}

function updateMediaSession(track) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'KnowerLife Creative Corner',
      artwork: [
        { src: new URL(track.cover, document.baseURI).href, sizes: '512x512' }
      ]
    });
    navigator.mediaSession.setActionHandler('play', playCurrent);
    navigator.mediaSession.setActionHandler('pause', pauseCurrent);
    navigator.mediaSession.setActionHandler('previoustrack', goPrevious);
    navigator.mediaSession.setActionHandler('nexttrack', goNext);
    navigator.mediaSession.setActionHandler('seekbackward', () => { els.audio.currentTime = Math.max(0, els.audio.currentTime - 10); });
    navigator.mediaSession.setActionHandler('seekforward', () => { els.audio.currentTime = Math.min(els.audio.duration || Infinity, els.audio.currentTime + 10); });
  } catch {}
}

let audioContext;
let analyser;
let sourceNode;
async function setupAudioGraph() {
  if (state.visualizerStarted || state.visualizerBlocked) {
    if (audioContext?.state === 'suspended') await audioContext.resume();
    return;
  }
  const track = state.tracks[state.current];
  if (!track) return;
  try {
    const audioUrl = new URL(track.audio, document.baseURI);
    if (audioUrl.origin !== location.origin) {
      state.visualizerBlocked = true;
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    sourceNode = audioContext.createMediaElementSource(els.audio);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    state.visualizerStarted = true;
    drawVisualizer();
  } catch {
    state.visualizerBlocked = true;
  }
}

function drawVisualizer() {
  if (!analyser || !els.visualizer) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = els.visualizer;
  const ctx = canvas.getContext('2d');
  const buffer = new Uint8Array(analyser.frequencyBinCount);

  const draw = () => {
    const rect = canvas.getBoundingClientRect();
    const scale = devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * scale));
    const height = Math.max(1, Math.floor(rect.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    analyser.getByteFrequencyData(buffer);
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#5cc8ff');
    gradient.addColorStop(.5, '#6757f5');
    gradient.addColorStop(1, '#ff7dda');
    ctx.fillStyle = gradient;
    const bars = Math.min(48, buffer.length);
    const gap = Math.max(1, width * .004);
    const barWidth = (width - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i += 1) {
      const value = buffer[Math.floor(i * buffer.length / bars)] / 255;
      const barHeight = Math.max(2, value * height * .92);
      ctx.fillRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight);
    }
    if (!reduced) requestAnimationFrame(draw);
  };
  draw();
}

function onAudioPlay() {
  els.playerPlay.textContent = '❚❚';
  els.playerPlay.setAttribute('aria-label', 'Pause');
  document.body.classList.add('is-playing');
  const track = state.tracks[state.current];
  if (track && !els.audio.dataset.counted) {
    state.plays[track.id] = (state.plays[track.id] || 0) + 1;
    storage.set('kl-music-plays', state.plays);
    els.audio.dataset.counted = '1';
  }
}

function onAudioPause() {
  els.playerPlay.textContent = '▶';
  els.playerPlay.setAttribute('aria-label', 'Play');
  document.body.classList.remove('is-playing');
}

function restoreDeepLink() {
  const match = location.hash.match(/^#track=(.+)$/);
  const id = match ? decodeURIComponent(match[1]) : storage.get('kl-music-last-track', '');
  const index = state.tracks.findIndex((track) => track.id === id);
  if (index >= 0) loadTrack(index, false);
}

function setupTheme() {
  let saved = null; try { saved = localStorage.getItem('knowerlife-theme'); } catch {}
  const preferred = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = (saved === 'light' || saved === 'dark') ? saved : preferred;
  els.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('knowerlife-theme', next); } catch {}
  });
}

function setupAccessibility() {
  let enabled = false; try { enabled = localStorage.getItem('knowerlife-accessibility') === 'enhanced'; } catch {}
  const apply = () => {
    if (enabled) document.documentElement.dataset.accessibility = 'enhanced'; else delete document.documentElement.dataset.accessibility;
    if (els.accessibilityToggle) { els.accessibilityToggle.setAttribute('aria-pressed', String(enabled)); els.accessibilityToggle.textContent = enabled ? 'A' : 'A+'; const label = enabled ? 'Standard accessibility' : 'Enhanced accessibility'; els.accessibilityToggle.setAttribute('aria-label', label); els.accessibilityToggle.title = label; }
  };
  els.accessibilityToggle?.addEventListener('click', () => { enabled = !enabled; try { localStorage.setItem('knowerlife-accessibility', enabled ? 'enhanced' : 'standard'); } catch {} apply(); });
  apply();
}

function setupPwa() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const register = () => navigator.serviceWorker.register('../../service-worker.js', { scope: '../../' }).catch(() => {});
      if ('requestIdleCallback' in window) requestIdleCallback(register, { timeout: 3000 });
      else setTimeout(register, 1200);
    });
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.installPrompt = event;
    els.installBtn.hidden = false;
  });
  els.installBtn.addEventListener('click', async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    els.installBtn.hidden = true;
  });
}

function setupNavigation() {
  els.menuButton.addEventListener('click', () => els.mobileNav.showModal());
  els.mobileClose.addEventListener('click', () => els.mobileNav.close());
  $$('a', els.mobileNav).forEach((link) => link.addEventListener('click', () => els.mobileNav.close()));
}

function setupControls() {
  els.dialogClose.addEventListener('click', () => els.dialog.close());
  els.search.addEventListener('input', () => {
    state.query = els.search.value;
    renderCatalog();
  });
  els.sort.addEventListener('change', () => {
    state.sort = els.sort.value;
    renderCatalog();
  });
  els.favoriteFilter.addEventListener('click', () => {
    state.onlyFavorites = !state.onlyFavorites;
    els.favoriteFilter.setAttribute('aria-pressed', String(state.onlyFavorites));
    renderCatalog();
  });

  els.playerPlay.addEventListener('click', () => els.audio.paused ? playCurrent() : pauseCurrent());
  els.playerPrev.addEventListener('click', goPrevious);
  els.playerNext.addEventListener('click', goNext);
  els.playerFavorite.addEventListener('click', () => {
    const track = state.tracks[state.current];
    if (track) toggleFavorite(track.id);
  });
  els.playerShare.addEventListener('click', shareTrack);
  els.shuffle.addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    els.shuffle.setAttribute('aria-pressed', String(state.shuffle));
  });
  els.repeat.addEventListener('click', () => {
    state.repeat = !state.repeat;
    els.repeat.setAttribute('aria-pressed', String(state.repeat));
  });

  els.playerProgress.addEventListener('input', () => {
    if (!Number.isFinite(els.audio.duration)) return;
    els.audio.currentTime = (Number(els.playerProgress.value) / 1000) * els.audio.duration;
  });
  els.playerVolume.addEventListener('input', () => {
    els.audio.volume = Number(els.playerVolume.value);
    els.audio.muted = false;
  });
  els.playerMute.addEventListener('click', () => {
    els.audio.muted = !els.audio.muted;
    els.playerMute.textContent = els.audio.muted ? '🔇' : '🔊';
  });

  els.audio.addEventListener('play', onAudioPlay);
  els.audio.addEventListener('pause', onAudioPause);
  els.audio.addEventListener('loadedmetadata', () => {
    els.playerDuration.textContent = formatTime(els.audio.duration);
  });
  els.audio.addEventListener('timeupdate', () => {
    els.playerCurrent.textContent = formatTime(els.audio.currentTime);
    if (Number.isFinite(els.audio.duration) && els.audio.duration > 0) {
      els.playerProgress.value = Math.round((els.audio.currentTime / els.audio.duration) * 1000);
    }
  });
  els.audio.addEventListener('ended', () => {
    els.audio.dataset.counted = '';
    if (state.repeat) {
      els.audio.currentTime = 0;
      playCurrent();
    } else goNext();
  });
  els.audio.addEventListener('error', () => {
    toast('Unable to load the audio file. Check the track path.');
    onAudioPause();
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      els.search.focus();
      els.search.select();
      return;
    }
    if (typing) return;
    if (event.key === '/') {
      event.preventDefault();
      els.search.focus();
    } else if (event.code === 'Space' && state.current >= 0) {
      event.preventDefault();
      els.audio.paused ? playCurrent() : pauseCurrent();
    } else if (event.key === 'ArrowRight' && state.current >= 0) {
      els.audio.currentTime = Math.min(els.audio.duration || Infinity, els.audio.currentTime + 5);
    } else if (event.key === 'ArrowLeft' && state.current >= 0) {
      els.audio.currentTime = Math.max(0, els.audio.currentTime - 5);
    } else if (event.key.toLowerCase() === 'm') {
      els.playerMute.click();
    }
  });
}

async function init() {
  setupTheme();
  setupAccessibility();
  setupPwa();
  setupNavigation();
  setupControls();

  try {
    const response = await fetch('../../creative/data/tracks.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.tracks = normalizeTracks(payload).map(track => ({ ...track, audio: `../../creative/${track.audio}`, cover: `../../creative/${track.cover}`, description: track.description ? 'Original KnowerLife music created with Suno and AI-assisted tools.' : '' }));
  } catch {
    state.tracks = [];
    toast('The music catalog is currently unavailable.');
  }

  updateStats();
  renderGenres();
  renderFeatured();
  renderCatalog();
  restoreDeepLink();
  document.documentElement.dataset.ready = 'true';
}

init();

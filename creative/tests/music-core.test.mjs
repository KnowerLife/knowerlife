import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterTracks,
  formatTime,
  nextIndex,
  normalizeTracks,
  parseDuration,
  previousIndex,
  sortTracks
} from '../assets/js/music-core.js';

const payload = {
  artist: 'KnowerLife',
  tracks: [
    { id: 'a', title: 'Alpha', audio: 'a.mp3', genre: 'AI Music', featured: true, releaseDate: '2026-01-02' },
    { id: 'b', title: 'Beta', audio: 'b.mp3', genre: 'Ambient', releaseDate: '2026-03-04' },
    { id: 'a', title: 'Duplicate', audio: 'x.mp3' },
    { id: 'c', title: 'Disabled', audio: 'c.mp3', enabled: false },
    { id: '', title: 'No id', audio: 'd.mp3' }
  ]
};

test('parseDuration parses m:ss and h:mm:ss', () => {
  assert.equal(parseDuration('3:55'), 235);
  assert.equal(parseDuration('1:02:03'), 3723);
  assert.equal(parseDuration('bad'), 0);
  assert.equal(parseDuration(null), 0);
});

test('formatTime formats seconds', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(234.92), '3:55');
  assert.equal(formatTime(59.9), '1:00');
  assert.equal(formatTime(-2), '0:00');
  assert.equal(formatTime(NaN), '0:00');
});

test('normalizeTracks drops disabled, duplicate and incomplete entries', () => {
  const tracks = normalizeTracks(payload);
  assert.deepEqual(tracks.map((track) => track.id), ['a', 'b']);
  assert.equal(tracks[0].artist, 'KnowerLife');
  assert.equal(tracks[0].cover, 'assets/covers/default-cover.jpg');
  assert.equal(tracks[0].genre, 'AI Music');
});

test('filterTracks searches title, tags and genre', () => {
  const tracks = normalizeTracks(payload);
  assert.equal(filterTracks(tracks, { query: 'beta' }).length, 1);
  assert.equal(filterTracks(tracks, { genre: 'Ambient' }).length, 1);
  assert.equal(filterTracks(tracks, { query: 'missing' }).length, 0);
  assert.equal(filterTracks(tracks, { favorites: new Set(['a']) }).length, 1);
});

test('sortTracks supports newest, title and featured', () => {
  const tracks = normalizeTracks(payload);
  assert.equal(sortTracks(tracks, 'newest')[0].id, 'b');
  assert.equal(sortTracks(tracks, 'title')[0].title, 'Alpha');
  assert.equal(sortTracks(tracks, 'featured')[0].id, 'a');
});

test('nextIndex and previousIndex wrap around', () => {
  assert.equal(nextIndex(3, 2), 0);
  assert.equal(previousIndex(3, 0), 2);
  assert.equal(nextIndex(0, 0), -1);
  assert.equal(previousIndex(0, 0), -1);
  assert.equal(nextIndex(3, 1, { shuffle: true, random: () => 0.99 }), 2);
});

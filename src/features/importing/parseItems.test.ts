import { describe, expect, it } from 'vitest';
import { dedupeDrafts, normalizeName, parseEntry, parseItems, splitEntries } from './parseItems';

describe('splitEntries', () => {
  it('splits pasted lines and trims whitespace', () => {
    const text = "  Capital Pizza \nOne Guy\n\nPapa V's\r\nDomino's\nPizza Hut\nLittle Caesars\n";
    expect(splitEntries(text)).toEqual([
      'Capital Pizza',
      'One Guy',
      "Papa V's",
      "Domino's",
      'Pizza Hut',
      'Little Caesars',
    ]);
  });

  it('splits a single comma-separated line', () => {
    expect(splitEntries("Capital Pizza, One Guy, Papa V's, Domino's")).toEqual([
      'Capital Pizza',
      'One Guy',
      "Papa V's",
      "Domino's",
    ]);
  });

  it('keeps commas inside multi-line entries', () => {
    expect(splitEntries('Pizza, Inc.\nOne Guy')).toEqual(['Pizza, Inc.', 'One Guy']);
  });

  it('strips list markers, checkboxes and quotes', () => {
    expect(
      splitEntries('1. Capital\n2) One Guy\n- Papa V\'s\n• Domino\'s\n"Pizza Hut"\n[ ] Sauce'),
    ).toEqual(['Capital', 'One Guy', "Papa V's", "Domino's", 'Pizza Hut', 'Sauce']);
  });

  it('takes the first cell of spreadsheet (tab-separated) pastes', () => {
    expect(splitEntries('Capital\t4.5\nOne Guy\t4.0')).toEqual(['Capital', 'One Guy']);
  });
});

describe('parseEntry', () => {
  it('pulls a leading emoji into the emoji field', () => {
    expect(parseEntry('🍕 Capital Pizza')).toEqual({ emoji: '🍕', name: 'Capital Pizza' });
    expect(parseEntry('👩🏽‍🍳 Chef Special')).toEqual({ emoji: '👩🏽‍🍳', name: 'Chef Special' });
  });

  it('treats a lone emoji as the name', () => {
    expect(parseEntry('🍕')).toEqual({ name: '🍕' });
  });

  it('supports "name | subtitle" and a trailing image URL', () => {
    expect(parseEntry('One Guy | Downtown https://example.com/logo.png')).toEqual({
      name: 'One Guy',
      subtitle: 'Downtown',
      image: 'https://example.com/logo.png',
    });
  });

  it('returns null for empty input', () => {
    expect(parseEntry('   ')).toBeNull();
  });
});

describe('duplicates', () => {
  it('normalizes case, spacing and punctuation', () => {
    expect(normalizeName("Papa V's")).toBe(normalizeName('papa vs'));
    expect(normalizeName('Café Rio')).toBe(normalizeName('cafe rio'));
  });

  it('flags duplicates against the board and within the batch', () => {
    const drafts = parseItems("Capital Pizza\nOne Guy\none guy\nDomino's");
    const { unique, duplicates } = dedupeDrafts(drafts, ['DOMINOS']);
    expect(unique.map((d) => d.name)).toEqual(['Capital Pizza', 'One Guy']);
    expect(duplicates.map((d) => d.name)).toEqual(['one guy', "Domino's"]);
  });
});

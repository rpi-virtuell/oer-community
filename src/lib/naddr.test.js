import { describe, expect, it } from 'vitest';
import { naddrDekodieren } from './naddr.js';

const REFERENZ =
  'naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7nttklqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wgkkwetdv45kuumrdpskvaqntfdpj';

describe('naddrDekodieren', () => {
  it('liest den Referenzfall', () => {
    const a = naddrDekodieren(REFERENZ);
    expect(a.kind).toBe(30023);
    expect(a.author).toBe(
      '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf'
    );
    expect(a.d).toBe('die-kraft-der-gemeinschaft');
    expect(a.relays).toContain('wss://relay.edufeed.org/');
  });

  it('bricht bei Unsinn ab', () => {
    expect(() => naddrDekodieren('kein-naddr')).toThrow(/naddr/i);
  });

  it('bricht bei einem npub ab', () => {
    expect(() =>
      naddrDekodieren('npub1f7jar3qnu269uyx5p0e4v24hqxjnxysxudvujza2ur5ehltvdeqsly2fx9')
    ).toThrow(/naddr/i);
  });

  it('bricht bei leerer Eingabe ab', () => {
    expect(() => naddrDekodieren('')).toThrow(/naddr/i);
  });
});

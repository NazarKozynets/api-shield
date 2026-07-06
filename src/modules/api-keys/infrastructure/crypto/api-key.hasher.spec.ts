import { hashApiKey } from './api-key.hasher';

describe('hashApiKey', () => {
  it('hashes raw API keys with SHA-256 hex encoding', () => {
    expect(hashApiKey('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

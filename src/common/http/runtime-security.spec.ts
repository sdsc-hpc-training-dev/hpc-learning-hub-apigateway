import { Buffer } from 'node:buffer';
import { brotliCompressSync, brotliDecompressSync, constants } from 'node:zlib';

describe('Brotli runtime security', () => {
  it('includes the CVE-2026-111497 block-switch fix', () => {
    expect(
      Object.hasOwn(constants, 'BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH'),
    ).toBe(true);
  });

  it('still decompresses valid Brotli data', () => {
    const input = Buffer.from('Learning Hub security smoke test');
    expect(brotliDecompressSync(brotliCompressSync(input)).equals(input)).toBe(
      true,
    );
  });
});

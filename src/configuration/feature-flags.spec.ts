import { privateFeaturesEnabled } from './feature-flags';

describe('private feature configuration', () => {
  it.each([undefined, '', 'false', 'FALSE', '0'])(
    'keeps private routes disabled for %p',
    (value) => {
      expect(privateFeaturesEnabled(value)).toBe(false);
    },
  );

  it.each(['true', 'TRUE', ' true '])(
    'enables private routes only for an explicit true value: %p',
    (value) => {
      expect(privateFeaturesEnabled(value)).toBe(true);
    },
  );
});

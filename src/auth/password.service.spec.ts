import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('creates a salted scrypt hash and verifies the original password', async () => {
    const hash = await passwords.hash('a-secure-password');

    expect(hash).toMatch(/^scrypt\$[^$]+\$[^$]+$/);
    await expect(passwords.verify('a-secure-password', hash)).resolves.toBe(
      true,
    );
  });

  it('creates a different hash for the same password because each hash has a salt', async () => {
    const [first, second] = await Promise.all([
      passwords.hash('a-secure-password'),
      passwords.hash('a-secure-password'),
    ]);

    expect(first).not.toEqual(second);
  });

  it.each(['not-a-hash', 'bcrypt$salt$key', 'scrypt$$key', 'scrypt$salt$'])(
    'rejects malformed or unsupported stored hashes',
    async (hash) => {
      await expect(passwords.verify('a-secure-password', hash)).resolves.toBe(
        false,
      );
    },
  );

  it('rejects an incorrect password', async () => {
    const hash = await passwords.hash('a-secure-password');

    await expect(passwords.verify('another-password', hash)).resolves.toBe(
      false,
    );
  });
});

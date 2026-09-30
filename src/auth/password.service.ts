import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

    return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, encodedSalt, encodedKey] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || !encodedSalt || !encodedKey) return false;

    const salt = Buffer.from(encodedSalt, 'base64url');
    const expected = Buffer.from(encodedKey, 'base64url');
    const actual = (await scrypt(password, salt, keyLength)) as Buffer;

    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}

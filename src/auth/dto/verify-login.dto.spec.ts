import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { VerifyLoginDto } from './verify-login.dto';

const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const metadata = { type: 'body' as const, metatype: VerifyLoginDto };
const valid = {
  challengeId: '6cb66713-88ce-4ad9-8d0f-43937ca96553',
  code: '012345',
};

it('accepts a UUID and a six-digit string, preserving leading zeros', async () => {
  const result = (await pipe.transform(valid, metadata)) as VerifyLoginDto;
  expect(result).toBeInstanceOf(VerifyLoginDto);
  expect(result.code).toBe('012345');
});

it.each([
  { ...valid, challengeId: 'not-a-uuid' },
  { ...valid, code: '12345' },
  { ...valid, code: '1234567' },
  { ...valid, code: 'abcdef' },
  { ...valid, code: 123456 },
  { challengeId: valid.challengeId },
  { code: valid.code },
  { ...valid, userId: 'untrusted-user-id' },
])('rejects invalid verification input: %j', async (input) => {
  await expect(pipe.transform(input, metadata)).rejects.toBeInstanceOf(
    BadRequestException,
  );
});

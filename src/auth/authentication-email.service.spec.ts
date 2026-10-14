import { ServiceUnavailableException } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { AuthenticationEmailService } from './authentication-email.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('AuthenticationEmailService', () => {
  const service = new AuthenticationEmailService();
  const originalHost = process.env.SMTP_HOST;
  const originalPort = process.env.SMTP_PORT;
  const originalFrom = process.env.AUTH_EMAIL_FROM;
  const sendMail = jest.fn();
  const createTransportMock = jest.mocked(createTransport);

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.AUTH_EMAIL_FROM;
    createTransportMock.mockReturnValue({ sendMail } as never);
  });

  afterAll(() => {
    if (originalHost === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = originalHost;
    if (originalPort === undefined) delete process.env.SMTP_PORT;
    else process.env.SMTP_PORT = originalPort;
    if (originalFrom === undefined) delete process.env.AUTH_EMAIL_FROM;
    else process.env.AUTH_EMAIL_FROM = originalFrom;
  });

  it('uses Mailpit defaults and sends the login code', async () => {
    sendMail.mockResolvedValue({});
    const expiresAt = new Date('2026-10-05T12:10:00.000Z');

    await service.sendLoginCode('learner@example.com', '123456', expiresAt);

    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'auth@localhost',
      to: 'learner@example.com',
      subject: 'Your HPC Learning Hub login code',
      text: 'Your login code is 123456. It expires at 2026-10-05T12:10:00.000Z.',
    });
  });

  it('uses configured SMTP settings and sender address', async () => {
    process.env.SMTP_HOST = 'smtp.example.org';
    process.env.SMTP_PORT = '587';
    process.env.AUTH_EMAIL_FROM = 'HPC Hub <auth@example.org>';
    sendMail.mockResolvedValue({});

    await service.sendLoginCode('learner@example.com', '123456', new Date());

    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.example.org',
      port: 587,
      secure: false,
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'HPC Hub <auth@example.org>' }),
    );
  });

  it('returns a service error when the SMTP server rejects the message', async () => {
    sendMail.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(
      service.sendLoginCode('learner@example.com', '123456', new Date()),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createTransport } from 'nodemailer';

@Injectable()
export class AuthenticationEmailService {
  async sendLoginCode(
    email: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    const transporter = createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: false,
    });

    try {
      await transporter.sendMail({
        from: process.env.AUTH_EMAIL_FROM ?? 'auth@localhost',
        to: email,
        subject: 'Your HPC Learning Hub login code',
        text: `Your login code is ${code}. It expires at ${expiresAt.toISOString()}.`,
      });
    } catch {
      throw new ServiceUnavailableException('Unable to send login code');
    }
  }
}

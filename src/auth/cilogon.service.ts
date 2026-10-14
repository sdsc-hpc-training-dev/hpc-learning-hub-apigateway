import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type * as oidc from 'openid-client';

interface LoginParameters {
  state: string;
  nonce: string;
  pkceVerifier: string;
}

@Injectable()
export class CilogonClientService {
  constructor(private readonly settings: ConfigService) {}

  private configurationPromise: Promise<oidc.Configuration> | undefined;

  getConfiguration(): Promise<oidc.Configuration> {
    if (!this.configurationPromise) {
      this.configurationPromise = this.discover().catch((error: unknown) => {
        this.configurationPromise = undefined;
        throw error;
      });
    }

    return this.configurationPromise;
  }

  private async discover(): Promise<oidc.Configuration> {
    const client = await import('openid-client');
    const clientId = this.settings.getOrThrow<string>('CILOGON_CLIENT_ID');
    const clientSecret = this.settings.getOrThrow<string>(
      'CILOGON_CLIENT_SECRET',
    );

    const configuration = await client.discovery(
      new URL('https://cilogon.org'),
      clientId,
      clientSecret,
    );

    configuration.timeout = 10;
    client.enableNonRepudiationChecks(configuration);

    return configuration;
  }

  async buildLoginUrl(input: LoginParameters): Promise<URL> {
    const client = await import('openid-client');
    const configuration = await this.getConfiguration();

    const redirectUri = this.settings.getOrThrow<string>(
      'CILOGON_REDIRECT_URI',
    );

    const codeChallenge = await client.calculatePKCECodeChallenge(
      input.pkceVerifier,
    );

    return client.buildAuthorizationUrl(configuration, {
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      state: input.state,
      nonce: input.nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
  }

  async exchangeCode(
    callbackUrl: URL,
    input: LoginParameters,
  ): Promise<oidc.IDToken> {
    const client = await import('openid-client');
    const configuration = await this.getConfiguration();

    const tokens = await client.authorizationCodeGrant(
      configuration,
      callbackUrl,
      {
        expectedState: input.state,
        expectedNonce: input.nonce,
        pkceCodeVerifier: input.pkceVerifier,
        idTokenExpected: true,
      },
    );

    const claims = tokens.claims();

    if (!claims) {
      throw new Error('CILogon did not return identity claims');
    }

    return claims;
  }
}

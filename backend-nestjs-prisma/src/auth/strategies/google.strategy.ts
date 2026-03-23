import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface OAuthProfile {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  provider: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get<string>('oauth2.google.clientId') || 'DISABLED';
    const clientSecret = config.get<string>('oauth2.google.clientSecret') || 'DISABLED';
    const callbackURL =
      config.get<string>('oauth2.google.callbackUrl') ||
      'http://localhost:4000/api/v1/auth/oauth2/google/callback';

    if (clientID === 'DISABLED') {
      GoogleStrategy.logger.warn('Google OAuth is disabled - GOOGLE_CLIENT_ID not set');
    }

    super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const oauthProfile: OAuthProfile = {
      providerId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      provider: 'GOOGLE',
    };
    done(null, oauthProfile);
  }
}

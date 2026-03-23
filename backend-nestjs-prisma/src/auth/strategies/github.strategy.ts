import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from './google.strategy';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private static readonly logger = new Logger(GithubStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get<string>('oauth2.github.clientId') || 'DISABLED';
    const clientSecret = config.get<string>('oauth2.github.clientSecret') || 'DISABLED';
    const callbackURL = config.get<string>('oauth2.github.callbackUrl') || 'http://localhost:4000/api/v1/auth/oauth2/github/callback';

    if (clientID === 'DISABLED') {
      GithubStrategy.logger.warn('GitHub OAuth is disabled — GITHUB_CLIENT_ID not set');
    }

    super({ clientID, clientSecret, callbackURL, scope: ['user:email'] });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    const email =
      profile.emails?.[0]?.value ?? `${profile.username}@github.local`;
    const oauthProfile: OAuthProfile = {
      providerId: profile.id.toString(),
      email,
      firstName: profile.displayName?.split(' ')[0] ?? profile.username,
      lastName: profile.displayName?.split(' ').slice(1).join(' ') ?? '',
      avatarUrl: profile.photos?.[0]?.value ?? null,
      provider: 'GITHUB',
    };
    done(null, oauthProfile);
  }
}

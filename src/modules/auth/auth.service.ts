import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { Role, User } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { validateHash } from '../../common/utils';
import { TokenType } from '../../constants';
import { UserNotFoundException } from '../../exceptions';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import { UserDto } from '../user/dtos/user.dto';
import { UserService } from '../user/user.service';
import { TokenPayloadDto } from './dto/token-payload.dto';
import type { UserLoginDto } from './dto/user-login.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private userService: UserService,
    private emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.authConfig.googleClientId,
      this.configService.authConfig.googleClientSecret,
    );
  }

  async createAccessToken(data: {
    role: Role;
    userId: string;
  }): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({
        userId: data.userId,
        type: TokenType.ACCESS_TOKEN,
        role: data.role,
      }),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<User> {
    const user = await this.userService.findOne({
      email: userLoginDto.email,
    });

    const isAdminPasswordValid = await validateHash(
      userLoginDto.password,
      this.configService.authConfig.adminPassword,
    );

    if (isAdminPasswordValid) {
      return user!;
    }

    const isPasswordValid = await validateHash(
      userLoginDto.password,
      user?.password,
    );

    if (!isPasswordValid) {
      throw new UserNotFoundException();
    }

    return user!;
  }

  async sendMagicLink(email: string): Promise<void> {
    const payload = {
      email,
      type: TokenType.MAGIC_LINK_TOKEN,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m', // 15 minutes
      secret: this.configService.authConfig.magicLinkSecret,
      algorithm: 'HS256',
    });

    const magicLink = `${this.configService.appConfig.frontendUrl}/auth/verify-magic-link?token=${token}`;

    // Send the magic link via email
    await this.emailService.sendEmail(
      email,
      'Magic Link',
      `<a href="${magicLink}">Click here to login</a>`,
    );
  }

  async verifyMagicLink(token: string): Promise<UserDto> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.authConfig.magicLinkSecret,
        algorithms: ['HS256'],
      });

      if (payload.type !== TokenType.MAGIC_LINK_TOKEN) {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userService.findOne({ email: payload.email });
      const userDto: UserDto = user
        ? new UserDto(user)
        : await this.userService.createUserByMagicLink(payload.email as string);

      return userDto;
    } catch (error) {
      console.error(error);

      throw new UnauthorizedException('Invalid or expired magic link');
    }
  }

  getGoogleAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      redirect_uri: this.configService.authConfig.googleCallbackUrl,
    });
  }

  async handleGoogleAuthCallback(code: string): Promise<UserDto> {
    const { tokens } = await this.googleClient.getToken({
      code,
      redirect_uri: this.configService.authConfig.googleCallbackUrl,
    });

    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: this.configService.authConfig.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid Google token');
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { email, picture, given_name } = payload;

    return this.validateGoogleUser({
      email: email!,
      picture: picture!,
      username: given_name!,
    });
  }

  async validateGoogleUser(profile: {
    email: string;
    picture: string;
    username: string;
  }): Promise<UserDto> {
    const { email, picture, username } = profile;
    const user = await this.userService.findOne({ email });

    return user
      ? new UserDto(user)
      : this.userService.createUserByGoogle({
          email,
          picture,
          username,
        });
  }
}

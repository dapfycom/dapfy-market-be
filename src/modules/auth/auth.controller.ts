import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { User } from '@prisma/client';
import { RoleType } from '../../constants';
import { ApiFile, Auth, AuthUser } from '../../decorators';
import { IFile } from '../../interfaces';
import { UserDto } from '../user/dtos/user.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginPayloadDto } from './dto/login-payload.dto';
import { MagicLinkDto, UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.validateUser(userLoginDto);

    const token = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    return new LoginPayloadDto(new UserDto(userEntity), token);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
  @ApiFile({ name: 'avatar' })
  async userRegister(
    @Body() userRegisterDto: UserRegisterDto,
    @UploadedFile() file?: IFile,
  ): Promise<UserDto> {
    const user = await this.userService.createUser(userRegisterDto, file);

    return new UserDto(user);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.USER, RoleType.ADMIN])
  @ApiOkResponse({ type: UserDto, description: 'current user info' })
  getCurrentUser(@AuthUser() user: User): UserDto {
    return new UserDto(user);
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Magic link sent successfully' })
  async sendMagicLink(@Body() magicLinkDto: MagicLinkDto): Promise<void> {
    await this.authService.sendMagicLink(magicLinkDto.email);
  }

  @Get('verify-magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async verifyMagicLink(
    @Query('token') token: string,
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.verifyMagicLink(token);

    const accessToken = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    return new LoginPayloadDto(new UserDto(userEntity), accessToken);
  }

  @Get('google')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Google OAuth URL' })
  googleAuth(): string {
    return this.authService.getGoogleAuthUrl();
  }

  @Get('google/callback')
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async googleAuthCallback(
    @Query('code') code: string,
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.handleGoogleAuthCallback(code);

    const token = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    return new LoginPayloadDto(new UserDto(userEntity), token);
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import type { UserSettings } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { randomUUID } from 'node:crypto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { PageDto } from '../../common/dto/page.dto';
import { generateHash } from '../../common/utils';
import { RoleType } from '../../constants';
import { FileNotImageException, UserNotFoundException } from '../../exceptions';
import type { IFile } from '../../interfaces';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { ValidatorService } from '../../shared/services/validator.service';
import type { UserRegisterDto } from '../auth/dto/user-register.dto';
import type { CreateSettingsDto } from './dtos/create-settings.dto';
import { UserDto } from './dtos/user.dto';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto';
import type { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private validatorService: ValidatorService,
    private awsS3Service: AwsS3Service,
  ) {}

  /**
   * Find single user
   */
  async findOne(findData: {
    id?: string;
    email?: string;
    username?: string;
    role?: RoleType;
  }): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        ...findData,
      },
    });
  }

  async findByUsernameOrEmail(
    options: Partial<{ username: string; email: string }>,
  ) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          {
            username: options.username,
          },
          {
            email: options.email,
          },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        settings: {
          select: {
            id: true,
            isEmailVerified: true,
            isPhoneVerified: true,
          },
        },
      },
    });
  }

  async createUser(
    userRegisterDto: UserRegisterDto,
    file?: IFile,
    avatar?: string,
  ): Promise<UserDto> {
    if (file && !this.validatorService.isImage(file.mimetype)) {
      throw new FileNotImageException();
    }

    const hashedPassword = generateHash(userRegisterDto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...userRegisterDto,
          password: hashedPassword,
          username: userRegisterDto.email,
          avatar:
            avatar ??
            (file ? await this.awsS3Service.uploadImage(file) : undefined),
          settings: {
            create: {
              isEmailVerified: false,
              isPhoneVerified: false,
            },
          },
        },
      });

      return new UserDto(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('UserEntity already exists');
      }

      throw error;
    }
  }

  async createUserByMagicLink(email: string): Promise<UserDto> {
    const user = await this.prisma.user.create({
      data: {
        email,
        username: email,
        password: generateHash(randomUUID().toString()),
        settings: {
          create: {
            isEmailVerified: false,
            isPhoneVerified: false,
          },
        },
      },
    });

    return new UserDto(user);
  }

  async createUserByGoogle(profile: {
    email: string;
    picture: string;
  }): Promise<UserDto> {
    const { email, picture } = profile;
    const user = await this.prisma.user.create({
      data: {
        email,
        username: email,
        password: generateHash(randomUUID().toString()),
        avatar: picture,
      },
    });

    return new UserDto(user);
  }

  async getUsers(
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<Partial<UserEntity>>> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: pageOptionsDto.skip,
        take: pageOptionsDto.take,
        orderBy: pageOptionsDto.q
          ? {
              [pageOptionsDto.q]: pageOptionsDto.order,
            }
          : undefined,

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
        },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto,
      itemCount: users.length,
      totalItems: total,
    });

    return new PageDto(users, pageMetaDto);
  }

  async getUser(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    return new UserDto(user);
  }

  async createSettings(
    userId: string,
    createSettingsDto: CreateSettingsDto,
  ): Promise<UserSettings> {
    return this.prisma.userSettings.create({
      data: {
        ...createSettingsDto,
        userId,
      },
    });
  }

  async getAdmins(): Promise<Array<Partial<UserEntity>>> {
    return this.prisma.user.findMany({
      where: {
        role: RoleType.ADMIN,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });
  }
}

import { ApiProperty } from '@nestjs/swagger';
import type {
  $Enums,
  BusinessInfo,
  NotificationPreferences,
  PersonalInfo,
  User,
  UserInterest,
} from '@prisma/client';
import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { RoleType } from '../../../constants';

// TODO, remove this class and use constructor's second argument's type
export type UserDtoOptions = Partial<{ isActive: boolean }>;

export type UserDtoType = Omit<User, 'password' | 'createdAt' | 'updatedAt'>;
export class UserDto implements UserDtoType {
  constructor(user: Partial<User>) {
    this.id = user.id!;

    this.name = user.name!;
    this.role = user.role!;
    this.email = user.email!;
    this.avatar = user.avatar!;
    this.isActive = user.isActive!;
  }

  id: string;

  name: string;

  role: $Enums.Role;

  email: string;

  avatar: string | null;

  isActive: boolean;
}

export class PersonalInfoDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User avatar URL' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ description: 'User active status' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'User role' })
  @IsEnum(RoleType)
  role: Role;

  @ApiProperty({ description: 'User Telegram handle' })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiProperty({ description: 'User WhatsApp number' })
  @IsOptional()
  @IsString()
  whatsApp?: string;

  @ApiProperty({ description: 'User Twitter handle' })
  @IsOptional()
  @IsString()
  twitter?: string;

  constructor(user: User & { personalInfo: PersonalInfo | null }) {
    this.id = user.id;
    this.name = user.name ?? '';
    this.email = user.email;
    this.avatar = user.avatar ?? '';
    this.isActive = user.isActive;
    this.role = user.role;
    this.telegram = user.personalInfo?.telegram ?? '';
    this.whatsApp = user.personalInfo?.whatsApp ?? '';
    this.twitter = user.personalInfo?.twitter ?? '';
  }
}

export class BusinessInfoDto implements BusinessInfo {
  @ApiProperty({ description: 'Business info ID' })
  id!: string;

  @ApiProperty({ description: 'User ID associated with the business info' })
  userId!: string;

  @ApiProperty({ description: 'Business name', nullable: true })
  businessName!: string | null;

  @ApiProperty({ description: 'Company email', nullable: true })
  companyEmail!: string | null;

  @ApiProperty({ description: 'Business description', nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Business website', nullable: true })
  website!: string | null;
}

export class InterestsDto implements UserInterest {
  @ApiProperty({ description: 'Interest ID' })
  id!: string;

  @ApiProperty({ description: 'User ID associated with the interest' })
  userId!: string;

  @ApiProperty({ description: 'Category ID of the interest' })
  categoryId!: string;
}

export class NotificationPreferencesDto implements NotificationPreferences {
  @ApiProperty({
    description: 'User ID associated with the notification preferences',
  })
  userId!: string;

  @ApiProperty({ description: 'Preference for new sales notifications' })
  newSales!: boolean;

  @ApiProperty({ description: 'Preference for product update notifications' })
  productUpdates!: boolean;

  @ApiProperty({
    description: 'Preference for community activity notifications',
  })
  communityActivity!: boolean;

  @ApiProperty({ description: 'Preference for marketing email notifications' })
  marketingEmails!: boolean;

  @ApiProperty({ description: 'Notification preferences ID' })
  id!: string;
}

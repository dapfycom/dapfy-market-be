import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../common/dto/page.dto';
import { RoleType } from '../../constants';
import { ApiFile, ApiPageResponse, Auth, AuthUser } from '../../decorators';
import { IFile } from '../../interfaces';
import { UpdateBusinessInfoDto } from './dtos/update-business-info.dto';
import { UpdateInterestsDto } from './dtos/update-interests.dto';
import { UpdateNotificationPreferencesDto } from './dtos/update-notification-preferences.dto';
import { UpdatePersonalInfoDto } from './dtos/update-personal-info.dto';
import {
  BusinessInfoDto,
  InterestsDto,
  NotificationPreferencesDto,
  PersonalInfoDto,
  UserDto,
} from './dtos/user.dto';
import { UsersPageOptionsDto } from './dtos/users-page-options.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('admin')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  admin() {
    return this.userService.getAdmins();
  }

  @Get('personal-info')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get user personal info',
    type: PersonalInfoDto,
  })
  getPersonalInfo(@AuthUser() user: UserEntity): Promise<PersonalInfoDto> {
    return this.userService.getPersonalInfo(user.id);
  }

  @Get('business-info')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get user business info',
    type: BusinessInfoDto,
  })
  getBusinessInfo(@AuthUser() user: UserEntity): Promise<BusinessInfoDto> {
    return this.userService.getBusinessInfo(user.id);
  }

  @Get('interests')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get user interests',
    type: [InterestsDto],
  })
  getInterests(@AuthUser() user: UserEntity): Promise<InterestsDto[]> {
    return this.userService.getInterests(user.id);
  }

  @Get('notification-preferences')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get user notification preferences',
    type: NotificationPreferencesDto,
  })
  getNotificationPreferences(
    @AuthUser() user: UserEntity,
  ): Promise<NotificationPreferencesDto> {
    return this.userService.getNotificationPreferences(user.id);
  }

  @Get()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({
    description: 'Get users list',
    type: PageDto,
  })
  getUsers(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<Partial<UserEntity>>> {
    return this.userService.getUsers(pageOptionsDto);
  }

  @Get(':id')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get users list',
    type: UserDto,
  })
  getUser(@Param('id') userId: string): Promise<UserDto> {
    return this.userService.getUser(userId);
  }

  @Put('personal-info')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiFile({ name: 'avatar' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user personal info and basic user data',
    type: UserDto,
  })
  async updatePersonalInfo(
    @Body() updatePersonalInfoDto: UpdatePersonalInfoDto,
    @AuthUser() user: UserEntity,
    @UploadedFile() avatar?: IFile,
  ): Promise<PersonalInfoDto> {
    return this.userService.updatePersonalInfo(
      user.id,
      updatePersonalInfoDto,
      avatar,
    );
  }

  @Put('business-info')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user business info',
    type: BusinessInfoDto,
  })
  updateBusinessInfo(
    @Body() updateBusinessInfoDto: UpdateBusinessInfoDto,
    @AuthUser() user: UserEntity,
  ): Promise<BusinessInfoDto> {
    return this.userService.updateBusinessInfo(user.id, updateBusinessInfoDto);
  }

  @Put('interests')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user interests',
  })
  updateInterests(
    @Body() updateInterestsDto: UpdateInterestsDto,
    @AuthUser() user: UserEntity,
  ): Promise<void> {
    return this.userService.updateInterests(user.id, updateInterestsDto);
  }

  @Put('notification-preferences')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user notification preferences',
    type: NotificationPreferencesDto,
  })
  updateNotificationPreferences(
    @Body() updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
    @AuthUser() user: UserEntity,
  ): Promise<NotificationPreferencesDto> {
    return this.userService.updateNotificationPreferences(
      user.id,
      updateNotificationPreferencesDto,
    );
  }
}

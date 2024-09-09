import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { RoleType } from '../../constants';
import { Auth, AuthUser } from '../../decorators';
import { UserEntity } from '../user/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { StoresService } from './stores.service';

@Controller('stores')
@ApiTags('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Store created successfully',
    type: Store,
  })
  create(@Body() createStoreDto: CreateStoreDto, @AuthUser() user: UserEntity) {
    return this.storesService.create(createStoreDto, user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all stores' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stores fetched successfully',
    type: [Store],
  })
  findAll() {
    return this.storesService.findAll();
  }

  @Get('paginated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated stores' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated stores fetched successfully',
    type: [PageDto],
  })
  findPaginated(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: PageOptionsDto,
  ) {
    return this.storesService.findStores(pageOptionsDto);
  }

  @Get('paginated/user')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated stores' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated stores fetched successfully',
    type: [PageDto],
  })
  findPaginatedByUser(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: PageOptionsDto,
    @AuthUser() user: UserEntity,
  ) {
    return this.storesService.findStoresByUser(pageOptionsDto, user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a store by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Store fetched successfully',
    type: Store,
  })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a store' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Store updated successfully',
    type: Store,
  })
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @AuthUser() user: UserEntity,
  ) {
    return this.storesService.update(id, updateStoreDto, user.id);
  }

  @Delete(':id')
  @Auth([RoleType.USER, RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a store' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Store deleted successfully',
  })
  remove(@Param('id') id: string, @AuthUser() user: UserEntity) {
    return this.storesService.remove(id, user.id);
  }
}

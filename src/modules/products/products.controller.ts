import {
  BadRequestException,
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
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { RoleType } from '../../constants';
import { Auth, AuthUser } from '../../decorators';
import { FileNotImageException } from '../../exceptions';
import type { IFile } from '../../interfaces';
import { UserEntity } from '../../modules/user/user.entity';
import { ValidatorService } from '../../shared/services/validator.service';
import { CreateReviewDto } from './dto/create-product-review.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductReview } from './entities/product-review.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@Controller('products')
@ApiTags('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private validatorService: ValidatorService,
  ) {}

  @Post(':storeId')
  @Auth([RoleType.SELLER, RoleType.ADMIN])
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: Product,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'digitalFiles' },
    ]),
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @Param('storeId') storeId: string,
    @AuthUser() user: UserEntity,
    @UploadedFiles()
    files: {
      images?: IFile[];
      digitalFiles?: IFile[];
    },
  ) {
    let totalSize = 0;

    for (const file of files.digitalFiles ?? []) {
      totalSize += file.size;
    }

    if (totalSize > 5 * 1024 * 1024 * 1024) {
      // 5GB in bytes
      throw new BadRequestException(
        'Total size of digital files exceeds the 5GB limit',
      );
    }

    for (const file of files.images ?? []) {
      if (!this.validatorService.isImage(file.mimetype)) {
        throw new FileNotImageException();
      }
    }

    return this.productsService.create(
      createProductDto,
      storeId,
      user.id,
      files.images,
      files.digitalFiles,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.ADMIN])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products fetched successfully',
    type: [Product],
  })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('paginated')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated products fetched successfully',
    type: [Product],
  })
  findPaginated(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: PageOptionsDto,
  ) {
    return this.productsService.findProducts(pageOptionsDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product fetched successfully',
    type: Product,
  })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Auth([RoleType.SELLER, RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: Product,
  })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @AuthUser() user: UserEntity,
  ) {
    return this.productsService.update(id, updateProductDto, user.id);
  }

  @Delete(':id')
  @Auth([RoleType.SELLER, RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product deleted successfully',
  })
  remove(@Param('id') id: string, @AuthUser() user: UserEntity) {
    return this.productsService.remove(id, user.id);
  }

  @Post(':id/reviews')
  @Auth([RoleType.USER, RoleType.SELLER, RoleType.ADMIN])
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review added successfully',
    type: ProductReview,
  })
  addReview(
    @Param('id') productId: string,
    @Body() createReviewDto: CreateReviewDto,
    @AuthUser() user: UserEntity,
  ) {
    return this.productsService.addReview(productId, createReviewDto, user.id);
  }
}

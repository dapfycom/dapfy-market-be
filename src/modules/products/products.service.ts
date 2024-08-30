import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { RoleType } from '../../constants';
import type { IFile } from '../../interfaces';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { PrismaService } from '../../shared/services/prisma.service';
import type { CreateReviewDto } from './dto/create-product-review.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,

    private awsS3Service: AwsS3Service,
  ) {}

  async verifyStoreOwnership(
    storeId: string,
    userId: string,
  ): Promise<boolean> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: true },
    });

    return store?.ownerId === userId || store?.owner.role === RoleType.ADMIN;
  }

  async verifyProductOwnership(
    productId: string,
    userId: string,
  ): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: { include: { owner: true } } },
    });

    return (
      product?.store.ownerId === userId ||
      product?.store.owner.role === RoleType.ADMIN
    );
  }

  async create(
    createProductDto: CreateProductDto,
    storeId: string,
    userId: string,
    images?: IFile[],
    digitalFiles?: IFile[],
  ) {
    const canCreate = await this.verifyStoreOwnership(storeId, userId);

    if (!canCreate) {
      throw new ForbiddenException(
        'You do not have permission to create a product in this store',
      );
    }

    let imageUrls: string[] = [];
    let digitalFileData: Array<{
      fileName: string;
      fileSize: number;
      fileUrl: string;
    }> = [];

    if (images) {
      try {
        // Upload images to S3
        imageUrls = await this.awsS3Service.uploadImages(images);
      } catch {
        throw new InternalServerErrorException('Failed to upload images to S3');
      }
    }

    if (digitalFiles) {
      try {
        // Upload digital files to S3
        const uploadPromises = digitalFiles.map((file) =>
          this.awsS3Service.uploadPrivatedFile(file).then((uploadedFile) => ({
            fileName: file.fieldname,
            fileSize: file.size,
            fileUrl: uploadedFile,
          })),
        );
        digitalFileData = await Promise.all(uploadPromises);
      } catch {
        throw new InternalServerErrorException(
          'Failed to upload digital files to S3',
        );
      }
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        storeId,

        images:
          imageUrls.length > 0
            ? {
                create: imageUrls.map((url) => ({ url })),
              }
            : undefined,
        digitalFiles:
          digitalFileData.length > 0
            ? {
                create: digitalFileData.map((file) => ({
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  fileUrl: file.fileUrl,
                })),
              }
            : undefined,
      },
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
    });
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id, isActive: true },
    });
  }

  async findProducts(
    paginationDto: PageOptionsDto,
  ): Promise<PageDto<Partial<Product>>> {
    const { page, take, q = 'createdAt', order } = paginationDto;
    const skip = (page - 1) * take;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        skip,
        take,
        orderBy: { [q]: order },
      }),
      this.prisma.product.count({ where: { isActive: true } }),
    ]);

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: paginationDto,
      itemCount: products.length,
      totalItems: total,
    });

    return new PageDto(products, pageMetaDto);
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const canUpdate = await this.verifyProductOwnership(id, userId);

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    const { ...data } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const canDelete = await this.verifyProductOwnership(id, userId);

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async addReview(
    productId: string,
    createReviewDto: CreateReviewDto,
    userId: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const review = await this.prisma.review.create({
      data: {
        ...createReviewDto,
        productId,
        userId,
      },
    });

    // Update the product's average rating
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating =
      reviews.reduce((sum, productReview) => sum + productReview.rating, 0) /
      reviews.length;

    await this.prisma.product.update({
      where: { id: productId },
      data: { averageRating },
    });

    return review;
  }
}

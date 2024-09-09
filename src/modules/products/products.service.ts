import {
  BadRequestException,
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
import { GroqService } from '../../shared/services/groq.service';
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
    private groqService: GroqService,
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async create(
    createProductDto: CreateProductDto,
    storeId: string,
    userId: string,
    images?: IFile[],
    digitalFiles?: IFile[],
  ) {
    try {
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
          imageUrls = await this.awsS3Service.uploadImages(images);
        } catch (error) {
          throw new InternalServerErrorException(
            'Failed to upload images to S3',
            error?.message as string,
          );
        }
      }

      if (digitalFiles) {
        try {
          const uploadPromises = digitalFiles.map((file) =>
            this.awsS3Service.uploadPrivatedFile(file).then((uploadedFile) => ({
              fileName: file.fieldname,
              fileSize: file.size,
              fileUrl: uploadedFile,
            })),
          );
          digitalFileData = await Promise.all(uploadPromises);
        } catch (error) {
          throw new InternalServerErrorException(
            'Failed to upload digital files to S3',
            error?.message as string,
          );
        }
      }

      const categories = await this.prisma.category.findMany();

      const categoryPrompt = `Analyze the product title "${createProductDto.title}" 
      and description "${createProductDto.description}". 
      Select the most suitable category from this list: ${categories.map((category) => category.name).join(', ')}. 
      If no existing category fits well, propose a new one. 
      Respond with either "Existing: [category name]" for an existing category, 
      or "New: [suggested category name]" for a new category.`;

      const systemPrompt = `You are an AI assistant specializing in product categorization. 
      Your task is to categorize products based on their title and description. 
      Respond only with one of these two formats:
      1. "Existing: [category name]" if the category already exists in the list.
      2. "New: [suggested category name]" if you're proposing a new category.
      Available categories: [${categories.map((category) => category.name).join(', ')}].
      Ensure your response is concise and follows the specified format.`;

      let categoryResponse;

      try {
        categoryResponse = await this.groqService.chatCompletion(
          categoryPrompt,
          systemPrompt,
        );
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to get AI category suggestion',
          error?.message as string,
        );
      }

      let categoryId: string;

      if (categoryResponse.startsWith('Existing:')) {
        const categoryName = categoryResponse.split('Existing:')[1]?.trim();
        const existingCategory = categories.find(
          (c) => c.name.toLowerCase() === categoryName?.toLowerCase(),
        );

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          throw new BadRequestException(
            'AI suggested an existing category that was not found',
          );
        }
      } else if (categoryResponse.startsWith('New:')) {
        const newCategoryName = categoryResponse.split('New:')[1]?.trim();

        try {
          const newCategory = await this.prisma.category.create({
            data: { name: newCategoryName ?? '' },
          });
          categoryId = newCategory.id;
        } catch (error) {
          throw new InternalServerErrorException(
            'Failed to create new category',
            error?.message as string,
          );
        }
      } else {
        throw new BadRequestException('Unexpected AI response format');
      }

      return this.prisma.product.create({
        data: {
          ...createProductDto,
          categoryId,
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
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create product',
        error?.message as string,
      );
    }
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

  async findProductsByUser(
    paginationDto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<Partial<Product>>> {
    const { page, take, q = 'createdAt', order } = paginationDto;
    const skip = (page - 1) * take;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true, store: { ownerId: userId } },
        skip,
        take,
        orderBy: { [q]: order },
        include: {
          category: true,
          store: true,
        },
      }),
      this.prisma.product.count({
        where: { isActive: true, store: { ownerId: userId } },
      }),
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

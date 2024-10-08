import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ProductStatus } from '@prisma/client';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { RoleType } from '../../constants';
import type { IFile } from '../../interfaces';
import { AlgoliaService } from '../../shared/services/algolia.service';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { GroqService } from '../../shared/services/groq.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { formatPrice } from '../../shared/utils/price.utils';
import type { CreateReviewDto } from './dto/create-product-review.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductStatusDto } from './dto/update-product-status.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { ProductReview } from './entities/product-review.entity';
import type { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,

    private awsS3Service: AwsS3Service,
    private groqService: GroqService,
    private algoliaService: AlgoliaService,
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

      const categoryPrompt = `Analyze the digital product title "${createProductDto.title}" 
      and description "${createProductDto.description}". 
      Select the most suitable category for this digital product from this list: 
      ${categories.map((category) => category.name).join(', ')}. 
      If no existing category fits or a new one is needed, propose a new one that's 
      specific to digital products and suggest an appropriate emoji for it. 
      Respond with either "Existing: [category name]" for an existing category, 
      or "New: [suggested category name] | [emoji]" for a new digital product category.`;

      const systemPrompt = `You are an AI assistant specializing in digital product categorization. 
      Your task is to categorize digital products based on their title and description. 
      Remember that ALL products are digital, so avoid generic categories like "Digital Media" or "Digital Products".
      Instead, focus on specific types of digital products such as "E-books", "Online Courses", "Software Tools", "Digital Art", etc.
      Respond only with one of these two formats:
      1. "Existing: [category name]" if the category already exists in the list.
      2. "New: [suggested category name] | [emoji]" if you're proposing a new category specific to digital products.
      Available categories: [${categories.map((category) => category.name).join(', ')}].
      Ensure your response is concise, follows the specified format, and is relevant to digital products only.
      For new categories, the emoji should be a single Unicode character that best represents the category.`;

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
        const [newCategoryName, emoji] = (
          categoryResponse.split('New:')[1] ?? ''
        )
          .trim()
          .split('|')
          .map((s) => s.trim());

        try {
          const newCategory = await this.prisma.category.create({
            data: {
              name: newCategoryName ?? '',
              emoji: emoji ?? '',
            },
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

      const imagesData = imageUrls.map((url) => ({
        url: this.awsS3Service.getFullUrl(url),
      }));

      const createdProduct = await this.prisma.product.create({
        data: {
          ...createProductDto,
          categoryId,
          storeId,

          images:
            imageUrls.length > 0
              ? {
                  create: imagesData,
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
        include: {
          category: true,
        },
      });

      // Add product to Algolia index
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-floating-promises
      this.algoliaService.addProduct({
        objectID: createdProduct.id,
        title: createdProduct.title,
        description: createdProduct.description,
        price: Number.parseFloat(formatPrice(createdProduct.price)),
        images: imagesData.map((image) => image.url),
        category: createdProduct.category.name,
        slug: createdProduct.slug,
      });

      return createdProduct;
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
      where: { isActive: true, status: ProductStatus.PUBLISHED },
    });
  }

  async findOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
        status: ProductStatus.PUBLISHED,
      },
      include: {
        images: true,
        category: true,
        store: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findProducts(
    paginationDto: PageOptionsDto,
    category?: string,
    search?: string,
  ): Promise<PageDto<Partial<Product>>> {
    const { page, take, q = 'createdAt', order } = paginationDto;
    const skip = (page - 1) * take;

    const whereClause = {
      isActive: true,
      status: ProductStatus.PUBLISHED,
      ...(category && category !== 'All' && { category: { name: category } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    } as Prisma.ProductWhereInput;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { [q]: order },
        include: {
          images: true,
          category: true,
          store: true,
        },
      }),
      this.prisma.product.count({ where: whereClause }),
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
          images: true,
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    images?: IFile[],
    digitalFiles?: IFile[],
  ) {
    const canUpdate = await this.verifyProductOwnership(id, userId);

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
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

    const { removeImages, ...data } = updateProductDto;

    const imagesData = imageUrls.map((url) => ({
      url: this.awsS3Service.getFullUrl(url),
    }));

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        images:
          imageUrls.length > 0
            ? {
                create: imagesData,
                deleteMany: { id: { in: removeImages ?? [] } },
              }
            : {
                deleteMany: { id: { in: removeImages ?? [] } },
              },
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
      include: {
        category: true,
      },
    });

    // Update product in Algolia index
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-floating-promises
    this.algoliaService.updateProduct({
      objectID: updatedProduct.id,
      title: updatedProduct.title,
      description: updatedProduct.description,
      price: Number.parseFloat(formatPrice(updatedProduct.price)),
      images: imagesData.map((image) => image.url),
      category: updatedProduct.category.name,
      slug: updatedProduct.slug,
    });

    return updatedProduct;
  }

  async remove(id: string, userId: string) {
    const canDelete = await this.verifyProductOwnership(id, userId);

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    // Fetch the product with its related data
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        digitalFiles: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete related files from S3
    const deletePromises = [
      ...product.images.map((image) =>
        this.awsS3Service.deleteFile(image.url.split('/').pop() ?? ''),
      ),
      ...product.digitalFiles.map((file) =>
        this.awsS3Service.deleteFile(file.fileUrl),
      ),
    ];

    await Promise.all(deletePromises);

    // Before deleting the product
    await this.prisma.$transaction([
      this.prisma.productImage.deleteMany({ where: { productId: id } }),
      this.prisma.digitalFile.deleteMany({ where: { productId: id } }),
      this.prisma.cartItem.deleteMany({ where: { productId: id } }),
      this.prisma.orderItem.deleteMany({ where: { productId: id } }),
      this.prisma.subscription.deleteMany({ where: { productId: id } }),
      this.prisma.review.deleteMany({ where: { productId: id } }),
    ]);

    // Now delete the product
    const deletedProduct = await this.prisma.product.delete({
      where: { id },
      include: { category: true },
    });

    // Check if the category is now empty and delete if so
    const remainingProductsInCategory = await this.prisma.product.count({
      where: { categoryId: deletedProduct.categoryId },
    });

    if (remainingProductsInCategory === 0) {
      await this.prisma.category.delete({
        where: { id: deletedProduct.categoryId },
      });
    }

    // Remove product from Algolia index
    await this.algoliaService.deleteProduct(id);

    return deletedProduct;
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
    await this.updateAverageRating(productId);

    return review;
  }

  async deleteReview(productId: string, reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId, productId, userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({
      where: { id: reviewId, productId, userId },
    });

    await this.updateAverageRating(productId);
  }

  private async updateAverageRating(productId: string) {
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
  }

  async isSlugAvailable(
    slug: string,
  ): Promise<{ available: boolean; id: string | null }> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    return { available: !existingProduct, id: existingProduct?.id ?? null };
  }

  reviewsByProduct(productId: string): Promise<ProductReview[]> {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    updateProductStatusDto: UpdateProductStatusDto,
    userId: string,
  ) {
    const canUpdate = await this.verifyProductOwnership(id, userId);

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status === updateProductStatusDto.status) {
      return { message: 'Product status is already up to date' };
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: updateProductStatusDto.status,
      },
      include: {
        category: true,
        images: true,
      },
    });

    // Update Algolia index only if status changed
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-floating-promises
    updatedProduct.status === ProductStatus.PUBLISHED
      ? this.algoliaService.addProduct({
          objectID: updatedProduct.id,
          title: updatedProduct.title,
          description: updatedProduct.description,
          price: Number.parseFloat(formatPrice(updatedProduct.price)),
          images: updatedProduct.images.map((image) => image.url),
          category: updatedProduct.category.name,
          slug: updatedProduct.slug,
        })
      : this.algoliaService.deleteProduct(id);

    return updatedProduct;
  }
}

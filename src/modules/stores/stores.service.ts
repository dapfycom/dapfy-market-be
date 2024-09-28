import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { RoleType } from '../../constants';
import { FileNotImageException } from '../../exceptions';
import type { IFile } from '../../interfaces';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { ValidatorService } from '../../shared/services/validator.service';
import type {
  CreateStoreDto,
  CreateStoreSocialDto,
} from './dto/create-store.dto';
import type { UpdateStoreDto } from './dto/update-store.dto';
import type { Store } from './entities/store.entity';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
    private validatorService: ValidatorService,
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

  async create(
    createStoreDto: Omit<CreateStoreDto, 'socials'> & {
      socials: CreateStoreSocialDto[];
    },
    userId: string,
    file: IFile,
  ) {
    if (!this.validatorService.isImage(file.mimetype)) {
      throw new FileNotImageException();
    }

    const logoKey = await this.awsS3Service.uploadImage(file);

    return this.prisma.store.create({
      data: {
        ...createStoreDto,
        ownerId: userId,
        logo: this.awsS3Service.getFullUrl(logoKey),
        socials: {
          createMany: {
            data: createStoreDto.socials,
          },
        },
      },
      include: {
        socials: true,
      },
    });
  }

  async findAll(): Promise<Store[]> {
    return this.prisma.store.findMany();
  }

  async findOneByIdOrSlug(idOrSlug: string) {
    const store = await this.prisma.store.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        socials: true,
        products: {
          include: {
            images: true,
          },
        },
        owner: true,
      },
    });

    if (!store) {
      throw new NotFoundException(
        `Store with ID or slug "${idOrSlug}" not found`,
      );
    }

    return {
      ...store,
      owner: {
        id: store.owner.id,
        name: store.owner.name,
        email: store.owner.email,
        avatar: store.owner.avatar,
      },
    };
  }

  async findStores(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Partial<Store>>> {
    const { page, take, q = 'createdAt', order } = pageOptionsDto;
    const skip = (page - 1) * take;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take,
        orderBy: { [q]: order },
      }),
      this.prisma.store.count(),
    ]);

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto,
      itemCount: stores.length,
      totalItems: total,
    });

    return new PageDto(stores, pageMetaDto);
  }

  async findStoresByUser(
    pageOptionsDto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<Partial<Store>>> {
    const { page, take, q = 'createdAt', order } = pageOptionsDto;
    const skip = (page - 1) * take;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where: { ownerId: userId },
        skip,
        take,
        orderBy: { [q]: order },
      }),
      this.prisma.store.count({ where: { ownerId: userId } }),
    ]);

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto,
      itemCount: stores.length,
      totalItems: total,
    });

    return new PageDto(stores, pageMetaDto);
  }

  async update(
    id: string,
    updateStoreDto: Omit<UpdateStoreDto, 'socials'> & {
      socials: CreateStoreSocialDto[];
    },
    userId: string,
  ) {
    const canUpdate = await this.verifyStoreOwnership(id, userId);

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this store',
      );
    }

    return this.prisma.store.update({
      where: { id },
      data: {
        ...updateStoreDto,
        socials: {
          updateMany: updateStoreDto.socials.map((social) => ({
            where: { platform: social.platform, storeId: id },
            data: social,
          })),
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const canDelete = await this.verifyStoreOwnership(id, userId);

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this store',
      );
    }

    return this.prisma.store.delete({
      where: { id },
    });
  }
}

import { BooleanField, NumberField } from '../../decorators';
import type { PageOptionsDto } from './page-options.dto';

interface IPageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  itemCount: number;
  totalItems: number;
}

export class PageMetaDto {
  @NumberField()
  readonly total: number;

  @NumberField()
  readonly page: number;

  @NumberField()
  readonly take: number;

  @NumberField()
  readonly itemCount: number;

  @NumberField()
  readonly totalPages: number;

  @NumberField()
  readonly pageCount: number;

  @BooleanField()
  readonly hasPreviousPage: boolean;

  @BooleanField()
  readonly hasNextPage: boolean;

  constructor({
    pageOptionsDto,
    itemCount,
    totalItems,
  }: IPageMetaDtoParameters) {
    this.total = totalItems;
    this.page = pageOptionsDto.page;
    this.take = pageOptionsDto.take;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
    this.totalPages = Math.ceil(this.total / this.take);
  }
}

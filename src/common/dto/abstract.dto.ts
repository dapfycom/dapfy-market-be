import { DateField, StringField } from '../../decorators';

class AbstractEntity {
  id!: string;

  createdAt!: Date;

  updatedAt!: Date;
}

export class AbstractDto {
  @StringField()
  id!: string;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;

  constructor(entity: AbstractEntity, options?: { excludeFields?: boolean }) {
    if (!options?.excludeFields) {
      this.id = entity.id;
      this.createdAt = entity.createdAt;
      this.updatedAt = entity.updatedAt;
    }
  }
}

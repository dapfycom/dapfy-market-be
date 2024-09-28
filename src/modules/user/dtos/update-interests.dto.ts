import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray } from 'class-validator';

export class UpdateInterestsDto {
  @ApiProperty({
    description: 'An array of category IDs representing user interests',
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  categoryIds!: string[];
}

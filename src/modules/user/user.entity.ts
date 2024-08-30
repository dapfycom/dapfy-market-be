import { ApiProperty } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';

export class UserEntity implements User {
  @ApiProperty({ description: 'The date when the user was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'The date when the user was last updated' })
  updatedAt!: Date;

  @ApiProperty({ description: "The user's first name", nullable: true })
  firstName!: string | null;

  @ApiProperty({ description: "The user's last name", nullable: true })
  lastName!: string | null;

  @ApiProperty({ description: "The user's username" })
  username!: string;

  @ApiProperty({ description: "The user's role", enum: Role })
  role!: Role;

  @ApiProperty({
    description: "The user's password",
    nullable: true,
    writeOnly: true,
  })
  password!: string;

  @ApiProperty({ description: "The user's avatar URL", nullable: true })
  avatar!: string | null;

  @ApiProperty({ description: 'Whether the user is active' })
  isActive!: boolean;

  @ApiProperty({ description: "The user's unique identifier" })
  id!: string;

  @ApiProperty({ description: "The user's email address" })
  email!: string;
}

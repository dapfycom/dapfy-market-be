import type { $Enums, User } from '@prisma/client';

// TODO, remove this class and use constructor's second argument's type
export type UserDtoOptions = Partial<{ isActive: boolean }>;

export type UserDtoType = Omit<User, 'password' | 'createdAt' | 'updatedAt'>;
export class UserDto implements UserDtoType {
  constructor(user: Partial<User>) {
    this.id = user.id!;
    this.firstName = user.firstName!;
    this.lastName = user.lastName!;
    this.username = user.username!;
    this.role = user.role!;
    this.email = user.email!;
    this.avatar = user.avatar!;
    this.isActive = user.isActive!;
  }

  id: string;

  firstName: string | null;

  lastName: string | null;

  username: string;

  role: $Enums.Role;

  email: string;

  avatar: string | null;

  isActive: boolean;
}

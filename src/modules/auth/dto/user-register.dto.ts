import { EmailField, PasswordField, StringField } from '../../../decorators';

export class UserRegisterDto {
  @StringField()
  readonly firstName!: string | null;

  @StringField()
  readonly lastName!: string | null;

  @EmailField()
  readonly email!: string;

  @PasswordField({ minLength: 6 })
  readonly password!: string;
}

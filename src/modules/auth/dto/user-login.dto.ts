import { EmailField, StringField } from '../../../decorators';

export class UserLoginDto {
  @EmailField()
  readonly email!: string;

  @StringField()
  readonly password!: string;
}

export class MagicLinkDto {
  @EmailField()
  readonly email!: string;
}

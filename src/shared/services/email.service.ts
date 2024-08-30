import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(public configService: ApiConfigService) {
    this.resend = new Resend(this.configService.emailConfig.apiKey);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: 'Your NestJS App <noreply@dapfy.com>',
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Error sending email:', error);

        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);

      return false;
    }
  }
}

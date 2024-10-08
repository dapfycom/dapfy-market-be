import { S3 } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import mime from 'mime-types';

import type { IFile } from '../../interfaces';
import { ApiConfigService } from './api-config.service';
import { GeneratorService } from './generator.service';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3;

  constructor(
    public configService: ApiConfigService,
    public generatorService: GeneratorService,
  ) {
    const awsS3Config = configService.awsS3Config;

    this.s3 = new S3({
      region: awsS3Config.bucketRegion,
      credentials: {
        accessKeyId: awsS3Config.accessKeyId,
        secretAccessKey: awsS3Config.secretAccessKey,
      },
    });
  }

  async uploadImage(file: IFile, bucket?: string): Promise<string> {
    try {
      const fileName = this.generatorService.fileName(
        mime.extension(file.mimetype) as string,
      );
      const key = 'images/' + fileName;

      const bucketName = bucket ?? this.configService.awsS3Config.bucketName;

      await this.s3.putObject({
        Bucket: bucketName,
        Body: file.buffer,
        Key: key,
      });

      return key;
    } catch (error) {
      console.error('error', error);

      throw new InternalServerErrorException('Failed to upload image to S3');
    }
  }

  async uploadImages(files: IFile[], bucket?: string): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, bucket));

    return Promise.all(uploadPromises);
  }

  async uploadPrivatedFile(file: IFile, bucket?: string): Promise<string> {
    const fileName = this.generatorService.fileName(
      mime.extension(file.mimetype) as string,
    );
    const key = 'files/' + fileName;

    const bucketName = bucket ?? this.configService.awsS3Config.bucketName;
    await this.s3.putObject({
      Bucket: bucketName,
      Body: file.buffer,
      ACL: 'private',
      Key: key,
    });

    return key;
  }

  async uploadPrivatedFiles(
    files: IFile[],
    bucket?: string,
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadPrivatedFile(file, bucket),
    );

    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      const bucketName = bucket ?? this.configService.awsS3Config.bucketName;

      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: key,
      });
    } catch (error) {
      console.error('Error deleting file from S3:', error);

      throw new InternalServerErrorException('Failed to delete file from S3');
    }
  }

  getFullUrl(key: string): string {
    return `https://${this.configService.awsS3Config.bucketName}.s3.${this.configService.awsS3Config.bucketRegion}.amazonaws.com/${key}`;
  }
}

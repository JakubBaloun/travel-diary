import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.R2_ENDPOINT!,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.R2_BUCKET_NAME!;
  }

  async uploadPhoto(file: Express.Multer.File): Promise<string> {
    const resized = await sharp(file.buffer)
      .resize({ width: 1800, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: resized,
        ContentType: 'image/jpeg',
      }),
    );

    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }

  async deletePhoto(url: string): Promise<void> {
    const key = url.replace(`${process.env.R2_PUBLIC_URL}/`, '');

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

export type UploadedFileBuffer = {
  buffer?: Buffer;
  originalname?: string;
  filename?: string;
  mimetype?: string;
  path?: string;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private driver: 'local' | 'cloudinary';

  constructor(private config: ConfigService) {
    const driverConfig = this.config.get<string>('STORAGE_DRIVER', 'local').toLowerCase();
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (driverConfig === 'cloudinary' && cloudName && apiKey && apiSecret) {
      this.driver = 'cloudinary';
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.logger.log(`☁️ File storage initialized: Cloudinary (${cloudName})`);
    } else {
      this.driver = 'local';
      this.logger.log('📁 File storage initialized: Local Disk Storage (/uploads)');
    }
  }

  getDriver(): 'local' | 'cloudinary' {
    return this.driver;
  }

  async uploadFile(file: UploadedFileBuffer, subFolder: string = 'documents'): Promise<string> {
    if (!file) return '';

    if (this.driver === 'cloudinary') {
      try {
        const folder = this.config.get<string>('CLOUDINARY_FOLDER', 'emp_management') + '/' + subFolder;
        
        return new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) {
                this.logger.error(`Cloudinary upload failed: ${error.message}`);
                return reject(error);
              }
              this.logger.log(`Uploaded file to Cloudinary: ${result?.secure_url}`);
              resolve(result?.secure_url || '');
            },
          );

          if (file.buffer) {
            uploadStream.end(file.buffer);
          } else if (file.path) {
            cloudinary.uploader.upload(file.path, { folder }).then((res) => resolve(res.secure_url)).catch(reject);
          } else {
            reject(new Error('No file buffer or path provided for Cloudinary upload'));
          }
        });
      } catch (err) {
        this.logger.warn(`Cloudinary upload error, falling back to local storage: ${err}`);
      }
    }

    // Default / Local Storage Fallback
    const uploadDir = join(process.cwd(), 'uploads', subFolder);
    mkdirSync(uploadDir, { recursive: true });

    const filename = `${subFolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname || '.bin')}`;
    const targetPath = join(uploadDir, filename);

    if (file.buffer) {
      writeFileSync(targetPath, file.buffer);
    }

    const publicUrl = `/uploads/${subFolder}/${file.filename || filename}`;
    this.logger.log(`Saved file locally: ${publicUrl}`);
    return publicUrl;
  }
}

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { FileUpload } from '../../types/graphql-upload';
import {
  uploadConfig,
  getAllowedTypesMessage,
} from '../../config/upload.config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  async transform(value: Promise<FileUpload>): Promise<FileUpload> {
    const file = await value;

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed types: ${getAllowedTypesMessage()}`,
      );
    }

    const extension = file.filename
      .substring(file.filename.lastIndexOf('.'))
      .toLowerCase();
    if (!uploadConfig.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `Invalid file extension "${extension}". Allowed extensions: ${uploadConfig.allowedExtensions.join(', ')}`,
      );
    }

    return file;
  }
}

import {
  Controller,
  Post,
  Delete,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileStorageService } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private fileStorageService: FileStorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const result = await this.fileStorageService.uploadFile(file);
    return result.fileUrl;
  }

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.fileStorageService.uploadFile(file);
    return result.fileUrl;
  }

  @Post('upload/multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    const urls: string[] = [];
    for (const file of files) {
      const result = await this.fileStorageService.uploadFile(file);
      urls.push(result.fileUrl);
    }
    return urls;
  }

  @Post('upload/avatar')
  @ApiOperation({ summary: 'Upload an avatar image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const result = await this.fileStorageService.uploadAvatar(file);
    return result.fileUrl;
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a file' })
  deleteFile(@Query('fileName') fileName: string, @Query('fileUrl') fileUrl?: string) {
    return this.fileStorageService.deleteFile(fileName || fileUrl || '');
  }
}

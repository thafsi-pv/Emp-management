import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { StorageService } from '../../common/services/storage.service';
import { UploadDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private service: DocumentsService,
    private storageService: StorageService,
  ) {}

  @Get(':employeeId')
  findAllForEmployee(@Param('employeeId') employeeId: string, @CurrentUser() user: any) {
    return this.service.findAllForEmployee(employeeId, user);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const fileUrl = await this.storageService.uploadFile(file, 'documents');
    const fileType = file.mimetype || 'application/octet-stream';
    return this.service.create(dto.employeeId, dto.name, fileUrl, fileType, dto.category);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

const photoStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'photos'),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `photo-${unique}${extname(file.originalname)}`);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  @Get()
  findAll(@Query() query: QueryEmployeeDto, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/service-history')
  getServiceHistory(@Param('id') id: string) {
    return this.service.getServiceHistory(id);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post()
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage }))
  create(@Body() dto: CreateEmployeeDto, @UploadedFile() file?: Express.Multer.File) {
    const photoPath = file ? `/uploads/photos/${file.filename}` : undefined;
    return this.service.create(dto, photoPath);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage }))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const photoPath = file ? `/uploads/photos/${file.filename}` : undefined;
    return this.service.update(id, dto, user, photoPath);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

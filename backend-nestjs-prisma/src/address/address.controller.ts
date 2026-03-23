import { Controller, Get, Post, Put, Delete, Param, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('addresses')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  getAll(@CurrentUser() user: any) {
    return this.addressService.getAll(user.id);
  }

  @Get('default')
  getDefault(@CurrentUser() user: any) {
    return this.addressService.getDefault(user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressService.getById(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.addressService.create(user.id, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.addressService.update(id, user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressService.delete(id, user.id);
  }

  @Put(':id/default')
  setDefaultPut(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressService.setDefault(id, user.id);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressService.setDefault(id, user.id);
  }
}

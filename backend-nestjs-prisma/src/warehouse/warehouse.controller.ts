import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  getAll() {
    return this.warehouseService.getAll();
  }

  @Get('summary')
  async getSummary() {
    const warehouses = await this.warehouseService.getAll();
    return { total: warehouses.length, warehouses };
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.warehouseService.getById(+id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.warehouseService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.warehouseService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.warehouseService.delete(+id);
  }

  @Get(':id/stocks')
  getStocks(@Param('id') id: string) {
    return this.warehouseService.getStocks(+id);
  }

  @Post(':id/stocks')
  updateStock(@Param('id') id: string, @Body() dto: { productId: string; quantity: number }) {
    return this.warehouseService.updateStock(+id, dto.productId, dto.quantity);
  }
}

import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'CONFIRMED', description: 'New order status' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Order confirmed by admin' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

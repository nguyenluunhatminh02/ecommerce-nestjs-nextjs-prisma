import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  COD = 'COD',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  WALLET = 'WALLET',
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Full name for shipping address' })
  @IsString()
  shippingFullName: string;

  @ApiProperty()
  @IsString()
  shippingPhone: string;

  @ApiProperty()
  @IsString()
  shippingAddressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddressLine2?: string;

  @ApiProperty()
  @IsString()
  shippingCity: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @ApiProperty()
  @IsString()
  shippingCountry: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

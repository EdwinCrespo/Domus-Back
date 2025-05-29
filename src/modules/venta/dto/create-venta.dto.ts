import { IsArray, IsInt, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetalleVentaDto {
  @IsInt()
  productoId: number;

  @IsInt()
  cantidad: number;

  @IsNumber()
  precioUnitario: number;

  @IsNumber()
  subtotal: number;
}

export class CreatePagoDto {
  @IsInt()
  metodoPagoId: number;

  @IsNumber()
  monto: number;
}

export class CreateVentaDto {
  @IsString()
  usuarioId: string;

  @IsInt()
  clienteId: number;

  @IsNumber()
  total: number;

  @IsString()
  estado: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles: CreateDetalleVentaDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePagoDto)
  pagos: CreatePagoDto[];
}
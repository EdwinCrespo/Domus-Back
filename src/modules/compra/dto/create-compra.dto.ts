import { IsArray, IsNumber, IsString, ValidateNested, Min, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { Compra, DetalleCompra } from "@prisma/client";

export class DetalleCompraDto {
  @IsNumber()
  productoId: number;

  @IsNumber()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  costoUnitario: number;

  @IsString()
  @IsNotEmpty()
  codigoLote: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

export type CreateCompraDto = Required<Omit<Compra, 'id' | 'fecha'>> & {
  detalles: (Required<Omit<DetalleCompra, 'id' | 'compraId'>> & { 
    codigoLote: string;
    fechaVencimiento?: string;
  })[];
};
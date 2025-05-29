export class InventarioResumenDto {
  productoId: number;
  nombreProducto: string;
  stockTotal: number;
  numeroLotes: number;
  costoPromedio: number;
  ultimaEntrada: Date | null;
  proximoVencimiento: Date | null;
  precioVenta: number | null;
}

export type InventarioSalidaDto = {
  inventarioLoteId: number;
  cantidad: number;
  tipo: string;
  descripcion: string;
} 
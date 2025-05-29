import { Compra, DetalleCompra } from "@prisma/client";

export type UpdateCompraDto = Partial<Omit<Compra, 'id' | 'fecha'>> & {
  detalles?: Partial<Omit<DetalleCompra, 'id' | 'compraId'>>[];
};
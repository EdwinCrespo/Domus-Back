import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';

@Injectable()
export class CompraService {
  constructor(private prisma: PrismaService) {}

  async create(createCompraDto: CreateCompraDto) {
    const { usuarioId, proveedorId, detalles, total } = createCompraDto;

    // Realizamos la transacción
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Crear la compra
      const compra = await prisma.compra.create({
        data: {
          usuarioId,
          proveedorId,
          total,
          detalles: {
            create: detalles.map(detalle => ({
              productoId: detalle.productoId,
              cantidad: detalle.cantidad,
              costoUnitario: detalle.costoUnitario
            }))
          }
        },
        include: {
          detalles: true
        }
      });

      // 2. Actualizar el inventario para cada producto
      for (const detalle of detalles) {
        // Verificar si el código de lote ya existe
        const loteExistente = await prisma.inventarioLote.findFirst({
          where: { codigoLote: detalle.codigoLote }
        });

        if (loteExistente) {
          throw new ConflictException(`El código de lote ${detalle.codigoLote} ya existe`);
        }

        // Crear nuevo lote de inventario
        const lote = await prisma.inventarioLote.create({
          data: {
            productoId: detalle.productoId,
            codigoLote: detalle.codigoLote,
            cantidad: detalle.cantidad,
            costoUnitario: detalle.costoUnitario,
            fechaEntrada: new Date(),
            fechaVencimiento: detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento) : null
          }
        });

        // Registrar el movimiento
        await prisma.movimiento.create({
          data: {
            productoId: detalle.productoId,
            usuarioId,
            tipo: 'entrada',
            cantidad: detalle.cantidad,
            descripcion: `Entrada por compra #${compra.id}`
          }
        });

        // Actualizar el precio de venta del producto
        const producto = await prisma.producto.findUnique({
          where: { id: detalle.productoId },
          include: {
            inventarios: {
              where: {
                cantidad: { gt: 0 }
              }
            }
          }
        });

        if (producto && producto.margenGanancia !== null) {
          // Calcular el costo promedio solo de lotes con stock > 0
          const lotesConStock = producto.inventarios;
          const stockTotal = lotesConStock.reduce((sum, lote) => sum + lote.cantidad, 0);
          
          const costoPromedio = lotesConStock.length > 0
            ? lotesConStock.reduce((sum, lote) => sum + (lote.costoUnitario * lote.cantidad), 0) / stockTotal
            : 0;

          // Calcular el nuevo precio de venta aplicando el margen de ganancia
          const nuevoPrecioVenta = Number((costoPromedio * (1 + (producto.margenGanancia / 100))).toFixed(2));

          // Actualizar el precio de venta del producto
          await prisma.producto.updateMany({
            where: { id: producto.id },
            data: {
              precioVenta: nuevoPrecioVenta,
              fechaActualizacion: new Date()
            }
          });
        }
      }

      return compra;
    });
  }

  async findAll(usuarioId: string) {
    return await this.prisma.compra.findMany({
      where: { usuarioId },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });
  }

  async findOne(id: number, usuarioId: string) {
    const compra = await this.prisma.compra.findFirst({
      where: { 
        id,
        usuarioId 
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    return compra;
  }

  async update(id: number, updateCompraDto: UpdateCompraDto, usuarioId: string) {
    // Verificar si la compra existe y pertenece al usuario
    const compraExistente = await this.prisma.compra.findFirst({
      where: { 
        id,
        usuarioId 
      },
      include: {
        detalles: true
      }
    });

    if (!compraExistente) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    // Por seguridad, no permitimos actualizar compras ya registradas
    throw new Error('No se permite actualizar compras ya registradas');
  }

  async remove(id: number, usuarioId: string) {
    // Verificar si la compra existe y pertenece al usuario
    const compraExistente = await this.prisma.compra.findFirst({
      where: { 
        id,
        usuarioId 
      },
      include: {
        detalles: true
      }
    });

    if (!compraExistente) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    // Por seguridad, no permitimos eliminar compras ya registradas
    throw new Error('No se permite eliminar compras ya registradas');
  }
}

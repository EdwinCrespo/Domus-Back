import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';

@Injectable()
export class VentaService {
  constructor(private prisma: PrismaService) {}

  async create(createVentaDto: CreateVentaDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // 1. Verificar el stock total disponible para cada producto
        for (const detalle of createVentaDto.detalles) {
          const stockTotal = await prisma.inventarioLote.aggregate({
            where: {
              productoId: detalle.productoId,
            },
            _sum: {
              cantidad: true
            }
          });

          if (!stockTotal._sum.cantidad || stockTotal._sum.cantidad < detalle.cantidad) {
            throw new BadRequestException(
              `No hay suficiente stock para el producto ID: ${detalle.productoId}`
            );
          }
        }

        // 2. Crear la venta
        const venta = await prisma.venta.create({
          data: {
            usuarioId: createVentaDto.usuarioId,
            clienteId: createVentaDto.clienteId,
            total: createVentaDto.total,
            estado: createVentaDto.estado,
            detalles: {
              create: createVentaDto.detalles
            },
            pagos: {
              create: createVentaDto.pagos
            }
          },
          include: {
            detalles: true,
            pagos: {
              include: {
                metodoPago: true
              }
            }
          }
        });

        // 3. Actualizar el inventario y registrar movimientos
        for (const detalle of createVentaDto.detalles) {
          let cantidadRestante = detalle.cantidad;

          // Obtener todos los lotes ordenados por fecha de entrada (más antiguos primero)
          const lotes = await prisma.inventarioLote.findMany({
            where: {
              productoId: detalle.productoId,
              cantidad: {
                gt: 0
              }
            },
            orderBy: {
              fechaEntrada: 'asc'
            }
          });

          // Procesar cada lote hasta cubrir la cantidad necesaria
          for (const lote of lotes) {
            if (cantidadRestante <= 0) break;

            const cantidadADescontar = Math.min(lote.cantidad, cantidadRestante);

            // Actualizar la cantidad del lote
            await prisma.inventarioLote.update({
              where: { id: lote.id },
              data: {
                cantidad: lote.cantidad - cantidadADescontar
              }
            });

            // Registrar el movimiento
            await prisma.movimiento.create({
              data: {
                productoId: detalle.productoId,
                inventarioLoteId: lote.id,
                usuarioId: createVentaDto.usuarioId,
                tipo: 'salida',
                cantidad: -cantidadADescontar,
                descripcion: `Venta #${venta.id}`
              }
            });

            cantidadRestante -= cantidadADescontar;
          }

          if (cantidadRestante > 0) {
            throw new BadRequestException(
              `Error al procesar el inventario para el producto ID: ${detalle.productoId}`
            );
          }
        }

        return venta;
      });
    } catch (error) {
      throw new BadRequestException(`Error al crear la venta: ${error.message}`);
    }
  }

  async findAll() {
    return await this.prisma.venta.findMany({
      include: {
        detalles: {
          include: {
            producto: true
          }
        },
        cliente: true,
        usuario: true
      }
    });
  }

  async findMetodoPagoAll() {
    return await this.prisma.metodoPago.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            producto: true
          }
        },
        cliente: true,
        usuario: true
      }
    });
  }

  async update(id: number, updateVentaDto: UpdateVentaDto) {
    return await this.prisma.venta.update({
      where: { id },
      data: updateVentaDto
    });
  }

  async remove(id: number) {
    return await this.prisma.venta.delete({
      where: { id }
    });
  }
}

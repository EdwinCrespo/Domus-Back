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

  // Método específico para el Dashboard con filtros de fecha
  async findVentasForDashboard(fechaInicio?: string, fechaFin?: string, pagina: number = 1, limite: number = 10) {
    try {
      const whereCondition: any = {};

      // Si se proporcionan fechas, agregar filtros
      if (fechaInicio && fechaFin) {
        whereCondition.fecha = {
          gte: new Date(fechaInicio + 'T00:00:00.000Z'),
          lte: new Date(fechaFin + 'T23:59:59.999Z')
        };
      }

      // Calcular el offset para la paginación
      const skip = (pagina - 1) * limite;

      // Obtener el total de registros para la paginación
      const totalVentas = await this.prisma.venta.count({
        where: whereCondition
      });

      // Obtener las ventas con paginación
      const ventas = await this.prisma.venta.findMany({
        where: whereCondition,
        include: {
          detalles: {
            include: {
              producto: {
                include: {
                  categoria: {
                    select: {
                      id: true,
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              razonSocial: true
            }
          },
          usuario: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        },
        skip,
        take: limite
      });

      // Formatear los datos para el Dashboard
      const ventasFormateadas = ventas.map(venta => ({
        id: venta.id.toString(),
        fecha: venta.fecha.toISOString().split('T')[0],
        monto: venta.total,
        cliente: venta.cliente.razonSocial || venta.cliente.nombre,
        productos: venta.detalles.map(detalle => detalle.producto.nombre).join(', '),
        cantidadProductos: venta.detalles.length,
        estado: venta.estado
      }));

      // Calcular estadísticas
      const totalVentasFiltradas = ventas.reduce((sum, venta) => sum + venta.total, 0);
      const cantidadVentas = ventas.length;

      // Estadísticas por categoría (si hay productos)
      const ventasPorCategoria: { [key: string]: number } = {};
      ventas.forEach(venta => {
        venta.detalles.forEach(detalle => {
          const categoria = detalle.producto.categoria?.nombre || 'Sin categoría';
          ventasPorCategoria[categoria] = (ventasPorCategoria[categoria] || 0) + detalle.cantidad;
        });
      });

      // Calcular el total de páginas
      const totalPaginas = Math.ceil(totalVentas / limite);

      return {
        ventas: ventasFormateadas,
        estadisticas: {
          totalVentas: totalVentasFiltradas,
          cantidadVentas,
          promedioVenta: cantidadVentas > 0 ? totalVentasFiltradas / cantidadVentas : 0,
          ventasPorCategoria
        },
        paginacion: {
          pagina,
          limite,
          total: totalVentas,
          totalPaginas
        },
        fechaInicio,
        fechaFin
      };
    } catch (error) {
      console.error('Error en findVentasForDashboard:', error);
      throw new BadRequestException(`Error al obtener ventas para el dashboard: ${error.message}`);
    }
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

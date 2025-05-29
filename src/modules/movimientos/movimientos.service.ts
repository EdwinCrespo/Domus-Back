import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  create(createMovimientoDto: CreateMovimientoDto) {
    return 'This action adds a new movimiento';
  }

  async findAll(usuarioId: string, fechaInicio: string, fechaFin: string) {
    try {
      // Validar que las fechas sean válidas
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Las fechas proporcionadas no son válidas');
      }

      if (startDate > endDate) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      // Buscar los movimientos
      const movimientos = await this.prisma.movimiento.findMany({
        where: {
          usuarioId: usuarioId,
          fecha: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          fecha: 'asc'
        }
      });

      return movimientos;
    } catch (error) {
      console.error('Error en findAll movimientos:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.code === 'P2025') {
        throw new BadRequestException('No se encontraron movimientos para el usuario especificado');
      }

      throw new InternalServerErrorException('Error al obtener los movimientos');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} movimiento`;
  }

  update(id: number, updateMovimientoDto: UpdateMovimientoDto) {
    return `This action updates a #${id} movimiento`;
  }

  remove(id: number) {
    return `This action removes a #${id} movimiento`;
  }

  // Método específico para el Dashboard con datos agregados de movimientos
  async findMovimientosForDashboard(usuarioId: string, fechaInicio?: string, fechaFin?: string) {
    try {
      const whereCondition: any = {
        usuarioId: usuarioId
      };

      // Si se proporcionan fechas, agregar filtros
      if (fechaInicio && fechaFin) {
        whereCondition.fecha = {
          gte: new Date(fechaInicio + 'T00:00:00.000Z'),
          lte: new Date(fechaFin + 'T23:59:59.999Z')
        };
      }

      // Obtener movimientos con información de productos
      const movimientos = await this.prisma.movimiento.findMany({
        where: whereCondition,
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              sku: true,
              categoria: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          },
          inventarioLote: {
            select: {
              id: true,
              codigoLote: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      });

      // Agrupar por tipo de movimiento
      const movimientosPorTipo: { [key: string]: number } = {};
      movimientos.forEach(mov => {
        movimientosPorTipo[mov.tipo] = (movimientosPorTipo[mov.tipo] || 0) + Math.abs(mov.cantidad);
      });

      // Agrupar por fecha (últimos 30 días)
      const movimientosPorFecha: { [key: string]: { entradas: number, salidas: number, ajustes: number } } = {};
      movimientos.forEach(mov => {
        const fecha = mov.fecha.toISOString().split('T')[0];
        if (!movimientosPorFecha[fecha]) {
          movimientosPorFecha[fecha] = { entradas: 0, salidas: 0, ajustes: 0 };
        }
        
        const cantidad = Math.abs(mov.cantidad);
        if (mov.tipo === 'entrada') {
          movimientosPorFecha[fecha].entradas += cantidad;
        } else if (mov.tipo === 'salida') {
          movimientosPorFecha[fecha].salidas += cantidad;
        } else if (mov.tipo === 'ajuste') {
          movimientosPorFecha[fecha].ajustes += cantidad;
        }
      });

      // Productos con más movimientos
      const productoMovimientos: { [key: string]: { nombre: string, cantidad: number, categoria: string } } = {};
      movimientos.forEach(mov => {
        const productoId = mov.productoId.toString();
        if (!productoMovimientos[productoId]) {
          productoMovimientos[productoId] = {
            nombre: mov.producto.nombre,
            cantidad: 0,
            categoria: mov.producto.categoria?.nombre || 'Sin categoría'
          };
        }
        productoMovimientos[productoId].cantidad += Math.abs(mov.cantidad);
      });

      // Convertir a arrays y ordenar
      const topProductos = Object.entries(productoMovimientos)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);

      // Calcular estadísticas generales
      const totalMovimientos = movimientos.length;
      const totalEntradas = movimientos.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + Math.abs(m.cantidad), 0);
      const totalSalidas = movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + Math.abs(m.cantidad), 0);
      const totalAjustes = movimientos.filter(m => m.tipo === 'ajuste').reduce((sum, m) => sum + Math.abs(m.cantidad), 0);

      // Formatear datos para el gráfico de líneas por fecha
      const fechasOrdenadas = Object.keys(movimientosPorFecha).sort();
      const datosGraficoLineas = fechasOrdenadas.map(fecha => ({
        fecha,
        entradas: movimientosPorFecha[fecha].entradas,
        salidas: movimientosPorFecha[fecha].salidas,
        ajustes: movimientosPorFecha[fecha].ajustes
      }));

      return {
        estadisticas: {
          totalMovimientos,
          totalEntradas,
          totalSalidas,
          totalAjustes,
          movimientosPorTipo
        },
        datosGraficos: {
          movimientosPorTipo: Object.entries(movimientosPorTipo).map(([tipo, cantidad]) => ({
            tipo,
            cantidad
          })),
          movimientosPorFecha: datosGraficoLineas,
          topProductos
        },
        fechaInicio,
        fechaFin
      };

    } catch (error) {
      console.error('Error en findMovimientosForDashboard:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al obtener movimientos para el dashboard');
    }
  }
}

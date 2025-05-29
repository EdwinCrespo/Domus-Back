import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateInventarioLoteDto } from './dto/create-inventario-lote.dto';
import { UpdateInventarioLoteDto } from './dto/update-inventario-lote.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { InventarioResumenDto, InventarioSalidaDto } from './dto/inventario-resumen.dto';
import { Prisma, Producto } from '@prisma/client';

export interface ErrorSalida {
  inventarioLoteId: number;
  error: string;
}

export interface ResultadoSalida {
  inventarioLoteId: number;
  cantidadProcesada: number;
  loteActualizado: Prisma.InventarioLoteGetPayload<{}>;
}

export interface SalidaResponse {
  message: string;
  resultados: ResultadoSalida[];
  errores?: ErrorSalida[];
}

@Injectable()
export class InventarioLoteService {
  constructor(private readonly prisma: PrismaService) {}

  async createManual(createInventarioLoteDto: CreateInventarioLoteDto, usuarioId: string) {
    return await this.prisma.$transaction(async (prisma) => {
      // Verificar si ya existe un lote con el mismo código para este usuario
      const loteExistente = await prisma.inventarioLote.findFirst({
        where: {
          codigoLote: createInventarioLoteDto.codigoLote,
          producto: {
            usuarioId: usuarioId
          }
        }
      });

      if (loteExistente) {
        throw new ConflictException(`Ya existe un lote con el código ${createInventarioLoteDto.codigoLote} para este usuario`);
      }

      // 1. Crear el registro de InventarioLote
      createInventarioLoteDto.fechaEntrada = new Date();
      const lote = await prisma.inventarioLote.create({
        data: createInventarioLoteDto,
      });

      // 2. Crear el registro de Movimiento
      const movimiento = await prisma.movimiento.create({
        data: {
          productoId: createInventarioLoteDto.productoId,
          inventarioLoteId: lote.id,
          usuarioId,
          tipo: 'ENTRADA',
          cantidad: createInventarioLoteDto.cantidad,
          descripcion: `Registro manual de lote - Costo unitario: ${createInventarioLoteDto.costoUnitario}`,
          fecha: new Date(),
        },
      });

      // 3. Obtener el producto con sus lotes y margen de ganancia
      const producto = await prisma.producto.findUnique({
        where: { id: createInventarioLoteDto.productoId },
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

        // Calcular el nuevo precio de venta aplicando el margen de ganancia y redondear a 2 decimales
        const nuevoPrecioVenta = parseFloat((costoPromedio * (1 + (producto.margenGanancia / 100))).toFixed(2));

        // Actualizar el precio de venta del producto
        await prisma.producto.updateMany({
          where: { id: producto.id },
          data: {
            precioVenta: nuevoPrecioVenta,
            fechaActualizacion: new Date()
          }
        });
      }

      return {
        lote,
        movimiento,
      };
    });
  }

  findAll() {
    return `This action returns all inventarioLote`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventarioLote`;
  }

  update(id: number, updateInventarioLoteDto: UpdateInventarioLoteDto) {
    return `This action updates a #${id} inventarioLote`;
  }

  remove(id: number) {
    return `This action removes a #${id} inventarioLote`;
  }

  async obtenerResumenInventario(usuarioId: string): Promise<InventarioResumenDto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        usuarioId,
        estado: 1, // Asumiendo que 1 es el estado activo
        inventarios: {
          some: {} // Esto asegura que el producto tenga al menos un lote
        }
      },
      include: {
        inventarios: {
          orderBy: {
            fechaEntrada: 'desc',
          },
        },
      },
    });

    return productos.map(producto => {
      const lotes = producto.inventarios;
      const stockTotal = lotes.reduce((sum, lote) => sum + lote.cantidad, 0);
      const numeroLotes = lotes.length;
      
      // Calcular costo promedio ponderado
      const costoPromedio = lotes.length > 0
        ? lotes.reduce((sum, lote) => sum + (lote.costoUnitario * lote.cantidad), 0) / stockTotal
        : 0;

      // Obtener la última entrada
      const ultimaEntrada = lotes.length > 0 ? lotes[0].fechaEntrada : null;

      // Obtener la próxima fecha de vencimiento (la más cercana)
      const lotesConVencimiento = lotes.filter(lote => lote.fechaVencimiento !== null);
      const proximoVencimiento = lotesConVencimiento.length > 0
        ? lotesConVencimiento.sort((a, b) => {
            const fechaA = a.fechaVencimiento as Date;
            const fechaB = b.fechaVencimiento as Date;
            return fechaA.getTime() - fechaB.getTime();
          })[0].fechaVencimiento
        : null;

      return {
        productoId: producto.id,
        nombreProducto: producto.nombre,
        stockTotal,
        numeroLotes,
        costoPromedio,
        ultimaEntrada,
        proximoVencimiento,
        precioVenta:producto.precioVenta,
      };
    });
  }

  async procesarSalidasInventario(params: { salidas: InventarioSalidaDto[]; usuarioId: string }) {
    return await this.prisma.$transaction(async (prisma) => {
      const resultados: ResultadoSalida[] = [];
      const errores: ErrorSalida[] = [];

      for (const salida of params.salidas) {
        try {
          // 1. Obtener el lote específico
          const lote = await prisma.inventarioLote.findFirst({
            where: {
              id: salida.inventarioLoteId,
              producto: {
                usuarioId: params.usuarioId
              }
            }
          });

          if (!lote) {
            errores.push({
              inventarioLoteId: salida.inventarioLoteId,
              error: 'Lote no encontrado'
            });
            continue;
          }

          // 2. Verificar stock disponible
          if (lote.cantidad < salida.cantidad) {
            errores.push({
              inventarioLoteId: salida.inventarioLoteId,
              error: `Stock insuficiente. Disponible: ${lote.cantidad}, Solicitado: ${salida.cantidad}`
            });
            continue;
          }

          // 3. Actualizar el lote
          const loteActualizado = await prisma.inventarioLote.update({
            where: { id: salida.inventarioLoteId },
            data: {
              cantidad: lote.cantidad - salida.cantidad
            }
          });

          // 4. Crear el movimiento
          await prisma.movimiento.create({
            data: {
              productoId: lote.productoId,
              inventarioLoteId: salida.inventarioLoteId,
              usuarioId: params.usuarioId,
              tipo: salida.tipo,
              cantidad: -salida.cantidad, // Negativo porque es una salida
              descripcion: salida.descripcion,
              fecha: new Date()
            }
          });

          resultados.push({
            inventarioLoteId: salida.inventarioLoteId,
            cantidadProcesada: salida.cantidad,
            loteActualizado
          });

        } catch (error) {
          errores.push({
            inventarioLoteId: salida.inventarioLoteId,
            error: error.message
          });
        }
      }

      if (errores.length > 0) {
        throw new BadRequestException({
          message: 'Algunas salidas no pudieron ser procesadas',
          errores,
          resultados
        });
      }

      return {
        message: 'Todas las salidas fueron procesadas exitosamente',
        resultados
      };
    });
  }

  async findLotesByProducto(idProducto: number) {
    try {
      // Primero verificar si el producto existe
      const producto = await this.prisma.producto.findUnique({
        where: { id: idProducto }
      });

      if (!producto) {
        throw new BadRequestException(`No se encontró el producto con ID ${idProducto}`);
      }

      const lotes = await this.prisma.inventarioLote.findMany({
        where: {
          productoId: idProducto,
          cantidad: { gt: 0 } // Solo lotes con stock
        },
        orderBy: {
          fechaEntrada: 'asc' // FIFO - First In First Out
        },
        select: {
          id: true,
          codigoLote: true,
          cantidad: true,
          fechaEntrada: true,
          fechaVencimiento: true,
          productoId: true,
          costoUnitario: true
        }
      });

      return lotes;
    } catch (error) {
      console.error('Error en findLotesByProducto:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener los lotes: ${error.message}`);
    }
  }
}

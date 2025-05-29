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
}

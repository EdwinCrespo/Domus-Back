import { Injectable } from '@nestjs/common';
import { CreateProveedoreDto } from './dto/create-proveedore.dto';
import { UpdateProveedoreDto } from './dto/update-proveedore.dto';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}
  create(createProveedoreDto: CreateProveedoreDto) {
    try {
      createProveedoreDto.estado = 1;
      return this.prisma.proveedor.create({
        data: createProveedoreDto,
      });
    } catch (error) {
      throw new Error('Error al crear la proveedor');
    }
  }

  findAll(id: string) {
    try {
      // cuando el estado sea 1, es decir, activo
      return this.prisma.proveedor.findMany({
        where: {
          estado: 1,
          usuarioId:id,
        },
      });
    } 
    catch (error) {
      throw new Error('Error al obtener las proveedor');
    }
  }

 async findOne(id: number) {
    try {
      const proveedor = await this.prisma.proveedor.findUnique({
        where: { id },
      });

      if (!proveedor) {
        throw new Error(`Proveedor con ID ${id} no encontrado`);
      }

      return proveedor;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al obtener Proveedor: ${error.message}`);
    }
  }

 async update(id: number, updateProveedoreDto: UpdateProveedoreDto) {
    try {
      updateProveedoreDto.fechaActualizacion=new Date();
      const proveedor = await this.prisma.proveedor.update({
        where: { id },
        data: updateProveedoreDto,
      });

      if (!proveedor) {
        throw new Error(`Proveedor con ID ${id} no encontrado`);
      }

      return proveedor;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al actualizar proveedor: ${error.message}`);
    }
  }
 async remove(id: number) {
    try {
      // actualizar estado a 0 (inactivo)
      const proveedor = await this.prisma.proveedor.update({
        where: { id },
        data: { estado: 0 },
      });

      if (!proveedor) {
        throw new Error(`Proveedor con ID ${id} no encontrado`);
      }

      return proveedor;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al actualizar proveedor: ${error.message}`);
    }
  }
}

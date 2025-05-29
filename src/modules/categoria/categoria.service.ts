import { Injectable } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class CategoriaService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCategoriaDto: CreateCategoriaDto) {
    try {
      createCategoriaDto.estado = 1;
      return this.prisma.categoria.create({
        data: createCategoriaDto,
      });
    } catch (error) {
      throw new Error('Error al crear la categoría');
    }
  }

  findAll(id: string) {
    try {
      // cuando el estado sea 1, es decir, activo
      return this.prisma.categoria.findMany({
        where: {
          estado: 1,
          usuarioId:id,
        },
      });
    } 
    catch (error) {
      throw new Error('Error al obtener las categorías');
    }
  }

  async findOne(id: number) {
    try {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id },
      });

      if (!categoria) {
        throw new Error(`Categoria con ID ${id} no encontrado`);
      }

      return categoria;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al obtener Categoria: ${error.message}`);
    }
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto) {
    try {
      updateCategoriaDto.fechaActualizacion=new Date();
      const categoria = await this.prisma.categoria.update({
        where: { id },
        data: updateCategoriaDto,
      });

      if (!categoria) {
        throw new Error(`Categoria con ID ${id} no encontrado`);
      }

      return categoria;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al actualizar categoria: ${error.message}`);
    }
  }

 async remove(id: number) {
    try {
      // actualizar estado a 0 (inactivo)
      const categoria = await this.prisma.categoria.update({
        where: { id },
        data: { estado: 0 },
      });

      if (!categoria) {
        throw new Error(`Categoria con ID ${id} no encontrado`);
      }

      return categoria;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al actualizar categoria: ${error.message}`);
    }
  }
}

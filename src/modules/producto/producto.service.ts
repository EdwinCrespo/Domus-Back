import { Injectable, ConflictException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto) {
    try {
      // Validar SKU único por usuario
      const productoExistente = await this.prisma.producto.findFirst({
        where: {
          sku: createProductoDto.sku,
          usuarioId: createProductoDto.usuarioId
        }
      });

      if (productoExistente) {
        throw new ConflictException('Ya existe un producto con este SKU para este usuario');
      }

      createProductoDto.estado = 1;
      return this.prisma.producto.create({
        data: createProductoDto,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Error al crear el producto');
    }
  }

  findAll(id:string) {
    try {
      // cuando el estado sea 1, es decir, activo
      return this.prisma.producto.findMany({
        where: {
          estado: 1,
          usuarioId:id,
        },
      });
    } 
    catch (error) {
      throw new Error('Error al obtener las producto');
    }
  }


  async findOne(id: number) {
    try {
      const producto = await this.prisma.producto.findUnique({
        where: { id },
      });

      if (!producto) {
        throw new Error(`Producto con ID ${id} no encontrado`);
      }

      return producto;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al obtener Categoria: ${error.message}`);
    }
  }

 async update(id: number, updateProductoDto: UpdateProductoDto) {
  try {
    updateProductoDto.fechaActualizacion=new Date();
    const producto = await this.prisma.producto.update({
      where: { id },
      data: updateProductoDto,
    });

    if (!producto) {
      throw new Error(`Categoria con ID ${id} no encontrado`);
    }

    return producto;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al actualizar producto: ${error.message}`);
  }
  }

 async remove(id: number) {
    try {
      // actualizar estado a 0 (inactivo)
      const producto = await this.prisma.producto.update({
        where: { id },
        data: { estado: 0 },
      });

      if (!producto) {
        throw new Error(`Producto con ID ${id} no encontrado`);
      }

      return producto;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class ClienteService {
  constructor(private readonly prisma: PrismaService) {}

  create(createClienteDto: CreateClienteDto) {
    try {
      createClienteDto.estado = 1;
      return this.prisma.cliente.create({
        data: createClienteDto,
      });
    } catch (error) {
      throw new Error('Error al crear la cliente');
    }
  }

  findAll(id: string) {
    try {
      // cuando el estado sea 1, es decir, activo
      return this.prisma.cliente.findMany({
        where: {
          estado: 1,
          usuarioId:id,
        },
      });
    } 
    catch (error) {
      throw new Error('Error al obtener las cliente');
    }
  }

  async findOne(id: number) {
    try {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id },
      });

      if (!cliente) {
        throw new Error(`Cleinte con ID ${id} no encontrado`);
      }

      return cliente;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al obtener Cliente: ${error.message}`);
    }
  }

  async update(id: number, UpdateClienteDto: UpdateClienteDto) {
    try {
      UpdateClienteDto.fechaActualizacion=new Date();
      const cliente = await this.prisma.cliente.update({
        where: { id },
        data: UpdateClienteDto,
      });

      if (!cliente) {
        throw new Error(`Cliente con ID ${id} no encontrado`);
      }

      return cliente;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }

 async remove(id: number) {
    try {
      // actualizar estado a 0 (inactivo)
      const cliente = await this.prisma.cliente.update({
        where: { id },
        data: { estado: 0 },
      });

      if (!cliente) {
        throw new Error(`Cliente con ID ${id} no encontrado`);
      }

      return cliente;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }
}

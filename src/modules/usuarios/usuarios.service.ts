import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateUsuarioWithIdDto extends CreateUsuarioDto {
  id: string; // ID de Supabase Auth
}

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(data: CreateUsuarioWithIdDto) {
    if (!data.id) {
      throw new BadRequestException('Se requiere el ID de Supabase Auth');
    }

    const existingUser = await this.prisma.usuario.findUnique({
      where: { id: data.id },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.create(data);
  }

  async create(createUsuarioDto: CreateUsuarioWithIdDto) {
    try {
      if (!createUsuarioDto.id) {
        throw new BadRequestException('Se requiere el ID de Supabase Auth');
      }

      // Verificar si el ID ya existe
      const existingUserById = await this.prisma.usuario.findUnique({
        where: { id: createUsuarioDto.id },
      });

      if (existingUserById) {
        throw new ConflictException('El ID de usuario ya existe');
      }

      // Verificar si el email ya existe
      const existingUserByEmail = await this.prisma.usuario.findUnique({
        where: { email: createUsuarioDto.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('El email ya está registrado');
      }

      // Crear el usuario con el ID de Supabase
      const usuario = await this.prisma.usuario.create({
        data: createUsuarioDto,
      });

      return usuario;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }
  async createPrueba(createUsuarioDto: CreateUsuarioWithIdDto) {
    try {
     
      // Crear el usuario con el ID de Supabase
      const usuario = await this.prisma.usuario.create({
        data: createUsuarioDto,
      });

      return usuario;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const usuarios = await this.prisma.usuario.findMany();
      return usuarios;
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      return usuario;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      const usuario = await this.prisma.usuario.update({
        where: { id },
        data: updateUsuarioDto,
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      return usuario;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const usuario = await this.prisma.usuario.delete({
        where: { id },
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      return usuario;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }
}

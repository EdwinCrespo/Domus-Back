import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    // El ID de Supabase debe venir en el DTO desde el frontend
    if (!createUsuarioDto.id) {
      throw new BadRequestException('Se requiere el ID de Supabase Auth');
    }
    return this.usuariosService.findOrCreate(createUsuarioDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    console.log(`Llegó a GET /usuarios/${id}`);
    console.log('Usuario autenticado (req.user):', req.user);

    if (req.user.id !== id) {
      console.log('ID del usuario autenticado no coincide con el ID solicitado. Lanzando 401.');
      throw new UnauthorizedException('No tienes permiso para acceder a este usuario');
    }

    console.log('IDs coinciden. Llamando a usuariosService.findOne...');
    try {
      const usuario = await this.usuariosService.findOne(id);
      console.log('usuariosService.findOne exitoso. Retornando usuario.');
      return usuario;
    } catch (error) {
      console.error('Error después de la llamada a usuariosService.findOne:', error);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto, @Request() req) {
    if (req.user.id !== id) {
      throw new UnauthorizedException('No tienes permiso para actualizar este usuario');
    }
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    if (req.user.id !== id) {
      throw new UnauthorizedException('No tienes permiso para eliminar este usuario');
    }
    return this.usuariosService.remove(id);
  }
}

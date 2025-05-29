import { Controller, Post, Body, UseGuards, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class CreateUserDto {
  email: string;
  password: string;
  nombre: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Este endpoint es solo para desarrollo/pruebas
  // En producción, los usuarios se crearán desde el frontend usando Supabase Auth

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }

    const token = auth.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token de autenticación inválido');
    }

    return this.authService.validateSupabaseToken(token);
  }
} 
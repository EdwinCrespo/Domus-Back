import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from '../modules/usuarios/usuarios.service';

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private usuariosService: UsuariosService,
  ) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Faltan variables de entorno de Supabase');
    }
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  async validateSupabaseToken(token: string) {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Token de Supabase inválido');
      }

     
    } catch (error) {
      throw new UnauthorizedException('Token de Supabase inválido');
    }
  }

  // Este método es solo para desarrollo/pruebas
  // En producción, los usuarios se crearán desde el frontend usando Supabase Auth

} 
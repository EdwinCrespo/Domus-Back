import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.SUPABASE_JWT_SECRET) {
      console.error('FATAL ERROR: Falta la variable de entorno SUPABASE_JWT_SECRET');
      throw new Error('Falta la variable de entorno SUPABASE_JWT_SECRET');
    }

    console.log('JwtStrategy initialized');
    console.log('Using SUPABASE_JWT_SECRET (first 5 chars): ', process.env.SUPABASE_JWT_SECRET.substring(0, 5)); // Log parcial del secreto

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
    });

    // Log after super() call
    console.log('JwtStrategy super() call completed');
  }

  async validate(payload: any): Promise<any> {
    console.log('JwtStrategy validate method invoked');
    console.log('Received payload:', payload);

    if (!payload || !payload.sub) {
      console.log('Payload inválido: Falta sub');
      throw new UnauthorizedException('Payload del token inválido');
    }

    // Aquí podrías añadir un log para verificar si el usuario existe en tu BD principal si fuera necesario
    // Por ahora, solo validamos el token.

    const user = {
      id: payload.sub,
      email: payload.email,
      // Agrega otras propiedades del payload que necesites
    };

    console.log('Token validado. Usuario retornado por la estrategia:', user);
    return user;
  }
} 
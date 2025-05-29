import { Module } from '@nestjs/common';
import { InventarioLoteService } from './inventario-lote.service';
import { InventarioLoteController } from './inventario-lote.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [InventarioLoteController],
  providers: [InventarioLoteService,PrismaService],
})
export class InventarioLoteModule {}

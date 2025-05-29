import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { InventarioLoteService, SalidaResponse } from './inventario-lote.service';
import { CreateInventarioLoteDto } from './dto/create-inventario-lote.dto';
import { UpdateInventarioLoteDto } from './dto/update-inventario-lote.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InventarioResumenDto, InventarioSalidaDto } from './dto/inventario-resumen.dto';

@Controller('inventario-lote')
export class InventarioLoteController {
  constructor(private readonly inventarioLoteService: InventarioLoteService) {}

  @Post(':usuarioId')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('usuarioId') usuarioId: string,
    @Body() createInventarioLoteDto: CreateInventarioLoteDto
  ) {
    return this.inventarioLoteService.createManual(createInventarioLoteDto, usuarioId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.inventarioLoteService.findAll();
  }

  @Get('lotes/:idProducto')
  @UseGuards(JwtAuthGuard)
  findLotesByProducto(@Param('idProducto', ParseIntPipe) idProducto: number) {
    return this.inventarioLoteService.findLotesByProducto(idProducto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.inventarioLoteService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateInventarioLoteDto: UpdateInventarioLoteDto) {
    return this.inventarioLoteService.update(+id, updateInventarioLoteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.inventarioLoteService.remove(+id);
  }

  @Get('resumen/:usuarioId')
  @UseGuards(JwtAuthGuard)
  async obtenerResumenInventario(@Param('usuarioId') usuarioId: string): Promise<InventarioResumenDto[]> {
    return this.inventarioLoteService.obtenerResumenInventario(usuarioId);
  }

  @Post('salidas/:usuarioId')
  @UseGuards(JwtAuthGuard)
  async procesarSalidasInventario(
    @Param('usuarioId') usuarioId: string,
    @Body() salidas: InventarioSalidaDto[]
  ): Promise<SalidaResponse> {
    return this.inventarioLoteService.procesarSalidasInventario({ salidas, usuarioId });
  }
}

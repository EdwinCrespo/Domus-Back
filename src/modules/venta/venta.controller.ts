import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('venta')
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createVentaDto: CreateVentaDto) {
    return this.ventaService.create(createVentaDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.ventaService.findAll();
  }

  @Get('metodo-pago')
  @UseGuards(JwtAuthGuard)
  findMetodoPagoAll() {
    return this.ventaService.findMetodoPagoAll();
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  findVentasForDashboard(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string
  ) {
    // Validar y convertir parámetros de paginación
    const paginaNum = pagina ? Math.max(1, parseInt(pagina)) : 1;
    const limiteNum = limite ? Math.min(50, Math.max(1, parseInt(limite))) : 10;

    return this.ventaService.findVentasForDashboard(
      fechaInicio,
      fechaFin,
      paginaNum,
      limiteNum
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ventaService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateVentaDto: UpdateVentaDto) {
    return this.ventaService.update(+id, updateVentaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.ventaService.remove(+id);
  }
}

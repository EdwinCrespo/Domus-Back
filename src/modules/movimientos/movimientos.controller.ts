import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MovimientosService } from './movimientos.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Post()
  create(@Body() createMovimientoDto: CreateMovimientoDto) {
    return this.movimientosService.create(createMovimientoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('usuarioId') usuarioId: string, 
    @Query('fechaInicio') fechaInicio: string, 
    @Query('fechaFin') fechaFin: string
  ) {
    return this.movimientosService.findAll(usuarioId, fechaInicio, fechaFin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movimientosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovimientoDto: UpdateMovimientoDto) {
    return this.movimientosService.update(+id, updateMovimientoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movimientosService.remove(+id);
  }
}

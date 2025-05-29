import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CategoriaModule } from './modules/categoria/categoria.module';
import { ProductoModule } from './modules/producto/producto.module';
import { InventarioLoteModule } from './modules/inventario-lote/inventario-lote.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { CompraModule } from './modules/compra/compra.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { VentaModule } from './modules/venta/venta.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsuariosModule,
    CategoriaModule,
    ProductoModule,
    InventarioLoteModule,
    ProveedoresModule,
    CompraModule,
    ClienteModule,
    VentaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

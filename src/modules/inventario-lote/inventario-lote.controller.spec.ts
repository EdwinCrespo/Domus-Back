import { Test, TestingModule } from '@nestjs/testing';
import { InventarioLoteController } from './inventario-lote.controller';
import { InventarioLoteService } from './inventario-lote.service';

describe('InventarioLoteController', () => {
  let controller: InventarioLoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventarioLoteController],
      providers: [InventarioLoteService],
    }).compile();

    controller = module.get<InventarioLoteController>(InventarioLoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

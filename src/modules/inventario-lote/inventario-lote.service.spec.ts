import { Test, TestingModule } from '@nestjs/testing';
import { InventarioLoteService } from './inventario-lote.service';

describe('InventarioLoteService', () => {
  let service: InventarioLoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventarioLoteService],
    }).compile();

    service = module.get<InventarioLoteService>(InventarioLoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

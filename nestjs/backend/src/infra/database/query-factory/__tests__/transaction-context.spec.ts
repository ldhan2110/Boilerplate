import { TransactionContext } from '../transaction-context';

describe('TransactionContext', () => {
  let mockQueryRunner: any;
  let mockDataSource: any;
  let mockManager: any;

  class FakeEntity {
    id: string;
    name: string;
  }

  beforeEach(() => {
    mockManager = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn().mockImplementation((_e, data) => Promise.resolve(data)),
      create: jest.fn().mockImplementation((_e, data) => data),
      findOne: jest.fn().mockResolvedValue({ id: 'X1', name: 'Test' }),
      upsert: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        getMany: jest.fn().mockResolvedValue([]),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
    mockQueryRunner = {
      manager: mockManager,
      query: jest.fn().mockResolvedValue([{ id: 'GEN001' }]),
    };
    mockDataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(mockManager.createQueryBuilder()),
    };
  });

  function createTx() {
    return new TransactionContext(mockQueryRunner, mockDataSource);
  }

  describe('insert', () => {
    it('should return an InsertChain', () => {
      const tx = createTx();
      const chain = tx.insert(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.values).toBe('function');
      expect(typeof chain.autoId).toBe('function');
    });
  });

  describe('insertMany', () => {
    it('should return an InsertChain (same class, semantic alias)', () => {
      const tx = createTx();
      const chain = tx.insertMany(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.values).toBe('function');
    });
  });

  describe('update', () => {
    it('should return an UpdateChain', () => {
      const tx = createTx();
      const chain = tx.update(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.where).toBe('function');
      expect(typeof chain.set).toBe('function');
      expect(typeof chain.merge).toBe('function');
    });
  });

  describe('updateMany', () => {
    it('should return an UpdateChain (same class, semantic alias)', () => {
      const tx = createTx();
      const chain = tx.updateMany(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.set).toBe('function');
    });
  });

  describe('delete', () => {
    it('should return a DeleteChain', () => {
      const tx = createTx();
      const chain = tx.delete(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.where).toBe('function');
    });
  });

  describe('upsert', () => {
    it('should return an UpsertChain', () => {
      const tx = createTx();
      const chain = tx.upsert(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.values).toBe('function');
      expect(typeof chain.conflictOn).toBe('function');
    });
  });

  describe('findOne', () => {
    it('should delegate to manager.findOne', async () => {
      const tx = createTx();
      const result = await tx.findOne(FakeEntity, { id: 'X1' } as any);
      expect(mockManager.findOne).toHaveBeenCalledWith(FakeEntity, { where: { id: 'X1' } });
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });
  });

  describe('findOneOrFail', () => {
    it('should return entity when found', async () => {
      const tx = createTx();
      const result = await tx.findOneOrFail(FakeEntity, { id: 'X1' } as any);
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockManager.findOne.mockResolvedValue(null);
      const tx = createTx();
      await expect(tx.findOneOrFail(FakeEntity, { id: 'MISSING' } as any))
        .rejects.toThrow('Entity not found');
    });
  });

  describe('genId', () => {
    it('should generate ID using QueryRunner.query', async () => {
      const tx = createTx();
      const id = await tx.genId('ROLE', 'seq_role');
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining('ROLE'),
      );
      expect(id).toBe('GEN001');
    });
  });

  describe('select', () => {
    it('should return a QueryChain using transaction manager', () => {
      const tx = createTx();
      const chain = tx.select(FakeEntity, 'f');
      expect(chain).toBeDefined();
      expect(typeof chain.where).toBe('function');
      expect(typeof chain.getMany).toBe('function');
    });
  });
});

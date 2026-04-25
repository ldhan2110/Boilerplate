import { BizException } from '@infra/common/exceptions';
import { QueryFactory } from '../query-factory.service';

describe('QueryFactory CRUD extensions', () => {
  let mockDataSource: any;
  let qf: QueryFactory;

  class FakeEntity {
    id: string;
    name: string;
  }

  beforeEach(() => {
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          findOne: jest.fn().mockResolvedValue({ id: 'X1', name: 'Test' }),
          save: jest.fn().mockImplementation((_e, d) => Promise.resolve(d)),
          create: jest.fn().mockImplementation((_e, d) => d),
          delete: jest.fn().mockResolvedValue({ affected: 1 }),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          upsert: jest.fn().mockResolvedValue({}),
          createQueryBuilder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          }),
        },
        query: jest.fn().mockResolvedValue([{ id: 'GEN001' }]),
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      }),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: 'X1', name: 'Test' }),
      }),
      query: jest.fn().mockResolvedValue([{ id: 'GEN001' }]),
    };
    qf = new QueryFactory(mockDataSource);
  });

  describe('transaction', () => {
    it('should commit on success and return result', async () => {
      const qr = mockDataSource.createQueryRunner();
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const result = await qf.transaction(async (tx) => {
        return 'hello';
      });

      expect(result).toBe('hello');
      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(qr.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should rollback on error and re-throw', async () => {
      const qr = mockDataSource.createQueryRunner();
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await expect(
        qf.transaction(async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(qr.commitTransaction).not.toHaveBeenCalled();
    });

    it('should always release QueryRunner even on error', async () => {
      const qr = mockDataSource.createQueryRunner();
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      try {
        await qf.transaction(async () => { throw new Error('fail'); });
      } catch {}

      expect(qr.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should find entity via DataSource repository', async () => {
      const result = await qf.findOne(FakeEntity, { id: 'X1' } as any);
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });

    it('should return null when not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);
      const result = await qf.findOne(FakeEntity, { id: 'MISSING' } as any);
      expect(result).toBeNull();
    });
  });

  describe('findOneOrFail', () => {
    it('should return entity when found', async () => {
      const result = await qf.findOneOrFail(FakeEntity, { id: 'X1' } as any);
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });

    it('should throw BizException when not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);
      await expect(
        qf.findOneOrFail(FakeEntity, { id: 'MISSING' } as any),
      ).rejects.toThrow(BizException);
    });
  });

  describe('genId', () => {
    it('should generate ID via DataSource.query', async () => {
      const id = await qf.genId('ROLE', 'seq_role');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ROLE'),
      );
      expect(id).toBe('GEN001');
    });
  });
});

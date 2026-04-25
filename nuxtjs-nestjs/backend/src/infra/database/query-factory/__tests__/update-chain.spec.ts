import { BizException } from '@infra/common/exceptions';
import { UpdateChain } from '../chains/update-chain';

describe('UpdateChain', () => {
  let mockManager: any;

  class FakeEntity {
    coId: string;
    coNm: string;
    taxCd: string;
    useFlg: boolean;
  }

  beforeEach(() => {
    mockManager = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn().mockResolvedValue({
        coId: 'CO001',
        coNm: 'Old Name',
        taxCd: '12345',
        useFlg: true,
      }),
      save: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
  });

  describe('set with object where', () => {
    it('should update matching rows with explicit data', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .where({ coId: 'CO001' } as any)
        .set({ coNm: 'New Name' } as any)
        .execute();

      expect(mockManager.update).toHaveBeenCalledWith(
        FakeEntity,
        { coId: 'CO001' },
        { coNm: 'New Name' },
      );
    });
  });

  describe('set with string where', () => {
    it('should use query builder for string conditions', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .where('coId = :coId AND useFlg = :useFlg', { coId: 'CO001', useFlg: true })
        .set({ coNm: 'New Name' } as any)
        .execute();

      const qb = mockManager.createQueryBuilder.mock.results[0].value;
      expect(qb.update).toHaveBeenCalledWith(FakeEntity);
      expect(qb.set).toHaveBeenCalledWith({ coNm: 'New Name' });
      expect(qb.where).toHaveBeenCalledWith('coId = :coId AND useFlg = :useFlg', { coId: 'CO001', useFlg: true });
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  describe('merge', () => {
    it('should fetch existing, merge non-null fields from dto, and save', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .where({ coId: 'CO001' } as any)
        .merge({ coNm: 'Updated Name', taxCd: undefined, useFlg: null } as any)
        .execute();

      expect(mockManager.findOne).toHaveBeenCalledWith(FakeEntity, { where: { coId: 'CO001' } });
      expect(mockManager.save).toHaveBeenCalledWith(
        FakeEntity,
        expect.objectContaining({
          coId: 'CO001',
          coNm: 'Updated Name',
          taxCd: '12345',
          useFlg: true,
        }),
      );
    });

    it('should throw BizException when entity not found', async () => {
      mockManager.findOne.mockResolvedValue(null);
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);

      await expect(
        chain.where({ coId: 'MISSING' } as any).merge({ coNm: 'X' } as any).execute(),
      ).rejects.toThrow(BizException);
    });
  });

  describe('execute without where', () => {
    it('should throw to prevent accidental full-table update', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.set({ coNm: 'X' } as any).execute(),
      ).rejects.toThrow('UpdateChain requires a WHERE condition');
    });
  });

  describe('execute without set or merge', () => {
    it('should throw when no data provided', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.where({ coId: 'CO001' } as any).execute(),
      ).rejects.toThrow('UpdateChain requires .set() or .merge()');
    });
  });
});

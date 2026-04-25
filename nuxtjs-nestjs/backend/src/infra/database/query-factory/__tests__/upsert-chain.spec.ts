import { UpsertChain } from '../chains/upsert-chain';

describe('UpsertChain', () => {
  let mockManager: any;

  class FakeEntity {
    roleId: string;
    pgmId: string;
    permId: string;
    activeYn: boolean;
  }

  beforeEach(() => {
    mockManager = {
      upsert: jest.fn().mockResolvedValue({}),
    };
  });

  describe('basic upsert', () => {
    it('should call manager.upsert with conflict columns and data', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      const data = [
        { roleId: 'R1', pgmId: 'P1', permId: 'X1', activeYn: true },
        { roleId: 'R1', pgmId: 'P2', permId: 'X2', activeYn: false },
      ];

      await chain
        .values(data as any)
        .conflictOn(['roleId', 'pgmId', 'permId'])
        .mergeFields(['activeYn'])
        .execute();

      expect(mockManager.upsert).toHaveBeenCalledWith(
        FakeEntity,
        data,
        {
          conflictPaths: ['roleId', 'pgmId', 'permId'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
    });
  });

  describe('single value upsert', () => {
    it('should wrap single value in array', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .values({ roleId: 'R1', pgmId: 'P1', permId: 'X1', activeYn: true } as any)
        .conflictOn(['roleId', 'pgmId', 'permId'])
        .mergeFields(['activeYn'])
        .execute();

      expect(mockManager.upsert).toHaveBeenCalledWith(
        FakeEntity,
        [{ roleId: 'R1', pgmId: 'P1', permId: 'X1', activeYn: true }],
        expect.any(Object),
      );
    });
  });

  describe('execute without values', () => {
    it('should throw', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.conflictOn(['roleId']).mergeFields(['activeYn']).execute(),
      ).rejects.toThrow('UpsertChain requires .values()');
    });
  });

  describe('execute without conflictOn', () => {
    it('should throw', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.values({ roleId: 'R1' } as any).mergeFields(['activeYn']).execute(),
      ).rejects.toThrow('UpsertChain requires .conflictOn()');
    });
  });
});

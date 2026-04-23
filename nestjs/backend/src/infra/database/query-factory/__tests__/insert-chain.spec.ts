import { InsertChain } from '../chains/insert-chain';

describe('InsertChain', () => {
  let mockManager: any;
  let mockQueryRunner: any;

  class FakeEntity {
    roleId: string;
    roleCd: string;
    roleNm: string;
  }

  beforeEach(() => {
    mockManager = {
      save: jest.fn().mockImplementation((entity, data) => {
        if (Array.isArray(data)) {
          return Promise.resolve(data.map((d, i) => ({ id: i, ...d })));
        }
        return Promise.resolve({ id: 1, ...data });
      }),
      create: jest.fn().mockImplementation((entity, data) => {
        if (Array.isArray(data)) return data;
        return { ...data };
      }),
    };
    mockQueryRunner = {
      query: jest.fn().mockResolvedValue([{ id: 'ROLE202604230001' }]),
    };
  });

  describe('basic insert', () => {
    it('should insert a single entity', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      await chain.values({ roleCd: 'ADMIN', roleNm: 'Administrator' } as any).execute();

      expect(mockManager.create).toHaveBeenCalledWith(FakeEntity, { roleCd: 'ADMIN', roleNm: 'Administrator' });
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('insertMany', () => {
    it('should insert multiple entities', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      const items = [
        { roleCd: 'ADMIN', roleNm: 'Admin' },
        { roleCd: 'USER', roleNm: 'User' },
      ];
      await chain.values(items as any).execute();

      expect(mockManager.create).toHaveBeenCalledWith(FakeEntity, items);
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('autoId', () => {
    it('should generate and set ID before insert', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      await chain
        .values({ roleCd: 'ADMIN', roleNm: 'Administrator' } as any)
        .autoId('roleId', 'ROLE', 'seq_role')
        .execute();

      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining('ROLE'),
      );
      const createdData = mockManager.create.mock.calls[0][1];
      expect(createdData.roleId).toBe('ROLE202604230001');
    });
  });

  describe('returning', () => {
    it('should return the saved entity', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      const result = await chain
        .values({ roleCd: 'ADMIN', roleNm: 'Administrator' } as any)
        .returning<{ roleId: string }>()
        .execute();

      expect(result).toHaveProperty('roleCd', 'ADMIN');
    });
  });

  describe('execute without values', () => {
    it('should throw', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      await expect(chain.execute()).rejects.toThrow('InsertChain requires .values()');
    });
  });
});

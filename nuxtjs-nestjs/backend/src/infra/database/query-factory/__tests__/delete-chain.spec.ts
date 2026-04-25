import { DeleteChain } from '../chains/delete-chain';

describe('DeleteChain', () => {
  let mockManager: any;

  beforeEach(() => {
    mockManager = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
  });

  class FakeEntity {
    id: string;
    name: string;
  }

  describe('where with object condition', () => {
    it('should delete matching rows using FindOptionsWhere', async () => {
      const chain = new DeleteChain<FakeEntity>(mockManager, FakeEntity);
      await chain.where({ id: 'role-1' } as any).execute();
      expect(mockManager.delete).toHaveBeenCalledWith(FakeEntity, { id: 'role-1' });
    });
  });

  describe('where with string condition', () => {
    it('should delete using query builder for string conditions', async () => {
      const chain = new DeleteChain<FakeEntity>(mockManager, FakeEntity);
      await chain.where('id = :id AND name = :name', { id: 'role-1', name: 'admin' }).execute();

      const qb = mockManager.createQueryBuilder.mock.results[0].value;
      expect(qb.delete).toHaveBeenCalled();
      expect(qb.from).toHaveBeenCalledWith(FakeEntity);
      expect(qb.where).toHaveBeenCalledWith('id = :id AND name = :name', { id: 'role-1', name: 'admin' });
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  describe('execute without where', () => {
    it('should throw an error to prevent accidental full-table delete', async () => {
      const chain = new DeleteChain<FakeEntity>(mockManager, FakeEntity);
      await expect(chain.execute()).rejects.toThrow('DeleteChain requires a WHERE condition');
    });
  });
});

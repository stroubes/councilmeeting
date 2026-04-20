import { DatabaseUnavailableError } from './postgres.service';
import { BaseRepository } from './base.repository';

class TestRepository extends BaseRepository {
  runWithFallback<T>(dbFn: () => Promise<T>, memoryFn: () => Promise<T> | T): Promise<T> {
    return this.withFallback(dbFn, memoryFn);
  }

  ensureVersion(versionKey: string, ensureFn: () => Promise<void>): Promise<void> {
    return this.ensureSchemaVersion(versionKey, ensureFn);
  }
}

describe('BaseRepository', () => {
  it('uses database branch when database is available', async () => {
    const repository = new TestRepository({ isEnabled: true } as never);

    const result = await repository.runWithFallback(
      async () => 'database',
      () => 'memory',
    );

    expect(result).toBe('database');
  });

  it('falls back to memory branch when database is unavailable', async () => {
    const repository = new TestRepository({ isEnabled: true } as never);

    const result = await repository.runWithFallback(
      async () => {
        throw new DatabaseUnavailableError('database temporarily unavailable');
      },
      () => 'memory',
    );

    expect(result).toBe('memory');
  });

  it('ensures a schema version only once', async () => {
    const repository = new TestRepository({ isEnabled: true } as never);
    const ensureFn = jest.fn().mockResolvedValue(undefined);

    await repository.ensureVersion('v1', ensureFn);
    await repository.ensureVersion('v1', ensureFn);

    expect(ensureFn).toHaveBeenCalledTimes(1);
  });
});

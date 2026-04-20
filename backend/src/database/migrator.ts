import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Client } from 'pg';

const MIGRATIONS_DIR = resolve(__dirname, 'migrations');
const SEEDS_DIR = resolve(__dirname, 'seeds');

const SCHEMA_MIGRATIONS_DDL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

export interface MigratorOptions {
  databaseUrl?: string;
  directory?: string;
  kind?: 'migration' | 'seed';
}

function listSqlFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

async function appliedNames(client: Client, kind: 'migration' | 'seed'): Promise<Set<string>> {
  const { rows } = await client.query<{ migration_name: string }>(
    'SELECT migration_name FROM schema_migrations WHERE migration_name LIKE $1',
    [`${kind}:%`],
  );
  return new Set(rows.map((row) => row.migration_name));
}

export async function runMigrations(options: MigratorOptions = {}): Promise<{ applied: string[] }> {
  const kind = options.kind ?? 'migration';
  const directory = options.directory ?? (kind === 'seed' ? SEEDS_DIR : MIGRATIONS_DIR);
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const applied: string[] = [];
  try {
    await client.query(SCHEMA_MIGRATIONS_DDL);
    const alreadyApplied = await appliedNames(client, kind);
    const files = listSqlFiles(directory);

    for (const file of files) {
      const key = `${kind}:${file}`;
      if (alreadyApplied.has(key)) {
        continue;
      }
      const sql = readFileSync(join(directory, file), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`[migrator] applying ${key}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING',
          [key],
        );
        await client.query('COMMIT');
        applied.push(key);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Failed to apply ${key}: ${(error as Error).message}`);
      }
    }
  } finally {
    await client.end();
  }

  return { applied };
}

if (require.main === module) {
  const kind = (process.argv.includes('--seed') ? 'seed' : 'migration') as 'migration' | 'seed';
  runMigrations({ kind })
    .then((result) => {
      if (result.applied.length === 0) {
        // eslint-disable-next-line no-console
        console.log(`[migrator] no new ${kind}s to apply.`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[migrator] applied ${result.applied.length} ${kind}(s).`);
      }
      process.exit(0);
    })
    .catch((error: Error) => {
      // eslint-disable-next-line no-console
      console.error(`[migrator] ${error.message}`);
      process.exit(1);
    });
}

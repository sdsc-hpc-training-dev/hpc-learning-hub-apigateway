import { Client } from 'pg';
import { runBugReportMigration } from './bug-report-migration';

jest.mock('pg', () => ({ Client: jest.fn() }));
jest.mock('./data-source', () => ({
  parseDatabasePort: () => 5432,
  parseDatabaseSslMode: () => false,
  requireDatabaseSetting: (_: string, value: string | undefined) => value,
}));

const baseLedger = [
  '1788856392276:EnablePgvector1788856392276',
  '1788893479707:CreateIngestionPersistence1788893479707',
  '1789142400000:CreateCuratedLearningPaths1789142400000',
  '1790723644950:CreateAuthenticationTables1790723644950',
  '1791487659372:CreateBookmarks1791487659372',
  '1791532800000:AddEventDestinations1791532800000',
  '1791561600000:CreateSiteFeedback1791561600000',
];

// eslint-disable-next-line max-lines-per-function -- Shared fixture models the database transitions across commands.
describe('scoped bug report migration', () => {
  const query = jest.fn<Promise<unknown>, [string, ...unknown[]]>();
  const end = jest.fn();
  const previousUsername = process.env.DB_USERNAME;
  let ledger: string[];
  let table: boolean;
  let grants: boolean;
  let lock: boolean;
  let role: boolean;
  let log: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    ledger = [...baseLedger];
    table = false;
    grants = true;
    lock = true;
    role = true;
    process.env.DB_USERNAME = 'learning_hub_gateway_ux_v1';
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    end.mockReset().mockResolvedValue(undefined);
    query.mockReset().mockImplementation((sql) => {
      if (sql.includes(' AS ledger')) {
        return Promise.resolve({
          rows: [{ ledger, present: table, runtime_exists: role }],
        });
      }
      if (sql.includes(' AS valid'))
        return Promise.resolve({ rows: [{ valid: grants }] });
      if (sql.includes(' AS acquired'))
        return Promise.resolve({ rows: [{ acquired: lock }] });
      if (sql.includes('CREATE TABLE public.bug_reports')) table = true;
      if (sql.startsWith('INSERT INTO public.migrations')) {
        ledger.push('1794528000000:CreateBugReports1794528000000');
      }
      return Promise.resolve({ rows: [] });
    });
    jest.mocked(Client).mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      query,
      end,
    });
  });

  afterEach(() => {
    log.mockRestore();
    if (previousUsername === undefined) delete process.env.DB_USERNAME;
    else process.env.DB_USERNAME = previousUsername;
  });

  it('checks without writes and applies exactly once', async () => {
    await runBugReportMigration('check');
    expect(query).toHaveBeenCalledWith('BEGIN READ ONLY');
    expect(table).toBe(false);
    await runBugReportMigration('apply');
    await runBugReportMigration('apply');
    expect(
      query.mock.calls.filter(([sql]) =>
        sql.includes('CREATE TABLE public.bug_reports'),
      ),
    ).toHaveLength(1);
    expect(ledger).toHaveLength(baseLedger.length + 1);
    expect(end).toHaveBeenCalledTimes(3);
  });

  it('does not require access to migrations from the Gateway runtime', async () => {
    await runBugReportMigration('runtime-check');
    expect(query.mock.calls.some(([sql]) => sql.includes('migrations'))).toBe(
      false,
    );
    grants = false;
    await expect(runBugReportMigration('runtime-check')).rejects.toThrow(
      'insert-only',
    );
    process.env.DB_USERNAME = 'unexpected';
    await expect(runBugReportMigration('runtime-check')).rejects.toThrow(
      'Unexpected Gateway',
    );
  });

  it('fails closed on unexpected ledger, table, or role', async () => {
    ledger.push('1793952000000:CilogonPilot1793952000000');
    await expect(runBugReportMigration('apply')).rejects.toThrow(
      'Unexpected migration ledger',
    );
    ledger = [...baseLedger];
    table = true;
    await expect(runBugReportMigration('check')).rejects.toThrow(
      'Unexpected migration ledger',
    );
    table = false;
    role = false;
    await expect(runBugReportMigration('check')).rejects.toThrow(
      'Unexpected migration ledger',
    );
    expect(query).not.toHaveBeenCalledWith('COMMIT');
  });

  it('does not migrate while ingestion holds the advisory lock', async () => {
    lock = false;
    await expect(runBugReportMigration('apply')).rejects.toThrow(
      'lock is busy',
    );
    await expect(runBugReportMigration(undefined)).rejects.toThrow(
      'Use bug-report-migration',
    );
    expect(table).toBe(false);
  });
});

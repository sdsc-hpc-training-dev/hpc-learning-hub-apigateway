jest.mock('./data-source', () => ({
  parseDatabasePort: jest.fn(),
  parseDatabaseSslMode: jest.fn(),
  requireDatabaseSetting: jest.fn(),
}));

jest.mock('pg', () => ({ Client: jest.fn() }));
jest.mock('typeorm', () => ({ DataSource: jest.fn() }));

import { feedbackCsvLine, trustedExportPath } from './feedback-maintenance';

function parseCsvLine(line: string): string[] {
  return (
    line
      .match(/"(?:""|[^"])*"/g)
      ?.map((cell) => cell.slice(1, -1).replaceAll('""', '"')) ?? []
  );
}

describe('feedback maintenance CSV', () => {
  it('round-trips a timestamp without JSON quote characters', () => {
    const timestamp = new Date('2026-10-30T00:00:00.000Z');
    const fields = parseCsvLine(
      feedbackCsvLine({
        id: 'feedback-1',
        created_at: timestamp,
        survey_version: 1,
        rating: 5,
        found_what_needed: 'yes',
        worked_well: 'Useful',
        improvements: null,
      }),
    );

    expect(fields[1]).toBe(timestamp.toISOString());
    expect(fields[1]).not.toContain('"');
  });

  it('prefixes formula-looking values after whitespace without changing the text', () => {
    const fields = parseCsvLine(
      feedbackCsvLine({
        id: 'feedback-2',
        created_at: new Date('2026-10-30T00:00:00.000Z'),
        survey_version: 1,
        rating: 4,
        found_what_needed: null,
        worked_well: '\t =SUM(A1:A2)',
        improvements: '\n@cmd',
      }),
    );

    expect(fields[5]).toBe("'\t =SUM(A1:A2)");
    expect(fields[6]).toBe("'\n@cmd");
  });

  it('requires an explicit absolute operator export destination', () => {
    expect(() => trustedExportPath('feedback.csv')).toThrow('absolute');
    expect(trustedExportPath('/tmp/feedback.csv')).toBe('/tmp/feedback.csv');
  });
});

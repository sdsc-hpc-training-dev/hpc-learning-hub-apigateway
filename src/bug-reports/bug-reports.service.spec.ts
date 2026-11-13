import { HttpException } from '@nestjs/common';
import { BugReportsService, normalizeReport } from './bug-reports.service';

const example = { title: '  Search issue  ', description: 'Line 1\nLine 2' };

describe('bug reports', () => {
  it('normalizes text and removes query strings and fragments', () => {
    expect(
      normalizeReport({
        ...example,
        pageUrl: 'https://learning-hub.sdsc.edu/materials?q=private#state',
        steps: '  ',
      }),
    ).toEqual([
      'Search issue',
      'Line 1\nLine 2',
      'https://learning-hub.sdsc.edu/materials',
      null,
    ]);
  });

  it.each([
    null,
    [],
    { ...example, email: 'private@example.test' },
    { ...example, title: ' ' },
    { ...example, title: 'x'.repeat(101) },
    { ...example, description: 'x'.repeat(1001) },
    { ...example, steps: 'x\u0000y' },
    { ...example, pageUrl: 'file:///tmp/example' },
    { ...example, pageUrl: 'https://user:password@example.test/' },
  ])('rejects invalid input: %p', (body) => {
    expect(() => normalizeReport(body)).toThrow(HttpException);
  });

  it('only inserts, and caps writes until the next minute', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(60_000);
    try {
      const query = jest.fn().mockResolvedValue([]);
      const service = new BugReportsService({ query } as never);
      for (let count = 0; count < 30; count += 1) await service.create(example);
      await expect(service.create(example)).rejects.toMatchObject({
        status: 429,
      });
      expect(query).toHaveBeenCalledTimes(30);
      const [statement, values] = query.mock.calls[0] as [string, unknown[]];
      expect(statement).toMatch(/^INSERT INTO public\.bug_reports/);
      expect(statement).not.toMatch(/SELECT|RETURNING/i);
      expect(values.slice(1)).toEqual([
        'Search issue',
        example.description,
        null,
        null,
      ]);
      clock.mockReturnValue(120_000);
      await expect(service.create(example)).resolves.toBeUndefined();
    } finally {
      clock.mockRestore();
    }
  });
});

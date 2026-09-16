import { getEnv } from '../../lib/bindings';
import { toError } from '../../lib/admin';
import { eventName, formatRecordValue, getRecords } from '../../lib/wca';

export const prerender = false;

// GET /api/records.csv — national records as CSV (same cached data as /records).
function cell(v: string | number | null): string {
  const s = v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET({ locals }: { locals: App.Locals }): Promise<Response> {
  try {
    const env = getEnv(locals);
    const recs = await getRecords(env);
    const stamp = recs.asOfExportDate ?? '';
    const lines = ['event,event_name,single,average,single_holder,single_wca_id,average_holder,average_wca_id,export_date'];
    for (const r of recs.data?.records ?? []) {
      lines.push(
        [
          cell(r.event),
          cell(r.event_name || eventName(r.event)),
          cell(r.single ? (formatRecordValue(r.event, 'single', r.single.value_centis) ?? '') : null),
          cell(r.average ? (formatRecordValue(r.event, 'average', r.average.value_centis) ?? '') : null),
          cell(r.single?.holder ?? null),
          cell(r.single?.wca_id ?? null),
          cell(r.average?.holder ?? null),
          cell(r.average?.wca_id ?? null),
          cell(stamp),
        ].join(','),
      );
    }
    return new Response(lines.join('\n') + '\n', {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="national-records-BD.csv"',
        'cache-control': 'public, s-maxage=3600',
      },
    });
  } catch (err) {
    return toError(err);
  }
}

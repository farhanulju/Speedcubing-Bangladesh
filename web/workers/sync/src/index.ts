// Standalone scheduled worker: WCA sync + outbox flush.
// Deploy separately from Pages: `wrangler deploy -c workers/sync/wrangler.jsonc`.
// Bodies land in WP-40 (sync), WP-41 (snapshots/champions), WP-42 (outbox flush).

export interface SyncEnv {
  DB: D1Database;
  WCA_CACHE: KVNamespace;
  RESEND_API_KEY: string;
}

const SYNC_CRON = '0 20 * * *'; // 02:00 Asia/Dhaka (UTC+6)

export default {
  async scheduled(event: ScheduledEvent, _env: SyncEnv, _ctx: ExecutionContext): Promise<void> {
    if (event.cron === SYNC_CRON) {
      throw new Error('not implemented — WP-40/WP-41 (sync + snapshots + champions)');
    }
    throw new Error('not implemented — WP-42 (outbox flush)');
  },
};

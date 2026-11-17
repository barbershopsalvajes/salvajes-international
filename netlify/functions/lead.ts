import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { handleLead } from '../../src/lib/server/leadHandler.ts';

export default async (req: Request, context: Context) =>
  handleLead(req, context.ip, {
    store: async () => getStore({ name: 'leads', consistency: 'strong' }),
  });

export const config: Config = { path: '/api/lead' };

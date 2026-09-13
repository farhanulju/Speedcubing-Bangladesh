import { health } from '../../../workers/api';

export const prerender = false;

export async function GET(): Promise<Response> {
  return health();
}

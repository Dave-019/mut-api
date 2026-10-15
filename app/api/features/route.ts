import { getEnv } from '@/lib/env';
import { errorResponse } from '@/lib/errors';
import { getFeatureConfig } from '@/lib/features';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  try {
    const config = await getFeatureConfig(getEnv());
    return Response.json(config);
  } catch (error) {
    return errorResponse(error);
  }
}

import { requireKv, type Env } from './env';
import { FeatureUnavailableError } from './errors';

export const FEATURES_KEY = 'features:config';

export interface FeatureConfig {
  transcript: boolean;
  hostel: boolean;
  feeStatement: boolean;
  examCard: boolean;
  unitRegistration: boolean;
  semesterRegistration: boolean;
}

export const DEFAULT_FEATURES: FeatureConfig = {
  transcript: true,
  hostel: true,
  feeStatement: false,
  examCard: false,
  unitRegistration: true,
  semesterRegistration: true,
};

export type FeatureName = keyof FeatureConfig;

export async function getFeatureConfig(env: Env): Promise<FeatureConfig> {
  const stored = await requireKv(env).get<Partial<FeatureConfig>>(FEATURES_KEY, 'json');
  return { ...DEFAULT_FEATURES, ...(stored ?? {}) };
}

export async function assertFeatureEnabled(env: Env, feature: FeatureName): Promise<void> {
  const config = await getFeatureConfig(env);
  if (!config[feature]) throw new FeatureUnavailableError(`Feature "${feature}" is currently disabled`);
}

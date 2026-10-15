import next from 'eslint-config-next/core-web-vitals';

const config = [
  ...next,
  {
    ignores: ['dist/**', '.next/**', '.wrangler/**', 'node_modules/**', 'worker-configuration.d.ts'],
  },
];

export default config;

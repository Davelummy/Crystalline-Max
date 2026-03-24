import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({
  region: 'europe-west2',
  memory: '256MiB',
  maxInstances: 10,
});

// Phase 3 baseline: shared server utilities are in place and the functions
// workspace compiles. Callable and trigger implementations are added in later phases.

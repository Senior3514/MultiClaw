import { mountSession, requireAuth } from './auth.js';

await requireAuth();
mountSession();

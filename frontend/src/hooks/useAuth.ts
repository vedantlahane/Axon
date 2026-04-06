// ─── useAuth (Hook Redirect) ─────────────────────────────────────────────────
// DEPRECATED: This file exists for backward compatibility only.
// All components should import { useAuth } from '../stores/AuthProvider'.
//
// The standalone useState-based auth hook was replaced by the AuthProvider
// context in Round 4. If you're importing from here, switch your import to:
//   import { useAuth } from '../stores/AuthProvider';

export { useAuth } from '../stores/AuthProvider';
export default undefined;
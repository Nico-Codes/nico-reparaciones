import { authApi } from './api';
import { authStorage } from './storage';

export async function logoutSession() {
  try {
    await authApi.logout();
  } catch {
    // Local logout must always win; server-side cookie cleanup is best effort.
  } finally {
    authStorage.clear();
  }
}

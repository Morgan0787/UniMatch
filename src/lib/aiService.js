import { aiClient } from '@/lib/apiClient';

export async function invokeAI(payload) {
  return aiClient.invoke(payload);
}

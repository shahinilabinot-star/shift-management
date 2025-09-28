// Example (supabase-js v2 style)
import { supabase } from './supabase';

// Subscribe to all changes on table 'shifts'
export function subscribeToShifts(callback: (payload: any) => void) {
  const channel = supabase
    .channel('public:shifts') // channel name is arbitrary but helpful
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shifts' },
      (payload) => {
        // payload: { eventType: INSERT|UPDATE|DELETE, new, old, table, schema }
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

// To unsubscribe:
export async function unsubscribeChannel(channel: any) {
  try {
    await channel.unsubscribe();
  } catch (err) {
    console.error('Failed to unsubscribe channel', err);
  }
}
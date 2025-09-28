// Offline localStorage hook removed — application should persist only to the server.
// Keeping a stub with the same signature to surface errors quickly if used.
export function useLocalStorage<T>(_key: string, _initialValue: T) {
  throw new Error('useLocalStorage is disabled: this application uses server-side persistence only. Use dbService or API hooks instead.');
}
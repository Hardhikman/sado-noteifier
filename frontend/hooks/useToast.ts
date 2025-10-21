import { useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState<string[]>([]);
  function push(msg: string) {
    setToasts(t => [...t, msg]);
    setTimeout(() => setToasts(t => t.slice(1)), 3000);
  }
  return { toasts, push };
}

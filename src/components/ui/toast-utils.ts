import { useToast } from './use-toast';

/**
 * Toast helpers — standardize success/error/info toasts
 */
export function useToastUtils() {
  const { toast } = useToast();

  function success(title: string, description?: string) {
    toast({ title, description });
  }
  function error(title: string, description?: string) {
    toast({ title, description, variant: 'destructive' });
  }
  function info(title: string, description?: string) {
    toast({ title, description });
  }

  /**
   * Run an async task and display toast based on result.
   * - ok: message on success
   * - fail: message (and optional description) on error
   */
  async function tryToast<T>(fn: () => Promise<T>, opts: {
    ok?: string;
    fail?: string;
    onError?: (e: any) => string | undefined; // return extra description
  } = {}): Promise<T | undefined> {
    try {
      const res = await fn();
      if (opts.ok) success(opts.ok);
      return res;
    } catch (e: any) {
      const desc = opts.onError?.(e) ?? (e?.message || '오류가 발생했습니다');
      error(opts.fail || '실패', desc);
      return undefined;
    }
  }

  return { success, error, info, tryToast };
}

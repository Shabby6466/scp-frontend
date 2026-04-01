import { toast as sonnerToast } from 'sonner';

export function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (type === 'error') {
    sonnerToast.error(message);
  } else if (type === 'info') {
    sonnerToast.info(message);
  } else {
    sonnerToast.success(message);
  }
}

export function toastError(err: unknown, fallback = 'Something went wrong') {
  const message =
    err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'message' in err.data
      ? String((err.data as { message: unknown }).message)
      : fallback;
  sonnerToast.error(message);
}

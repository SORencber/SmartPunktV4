import { useSnackbar } from 'notistack'

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown, fallbackMessage = 'An error occurred'): string {
  console.error('API Error:', error);
  if (error instanceof Error) {
    return error.message;
  }
  return typeof fallbackMessage === 'string' ? fallbackMessage : 'Error';
}

export function useApiErrorHandler() {
  const { enqueueSnackbar } = useSnackbar();

  const notifyError = (error: unknown, fallbackMessage = 'An error occurred') => {
    const msg = handleApiError(error, fallbackMessage);
    enqueueSnackbar(msg, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    return msg;
  };

  return { handleApiError: notifyError };
}

export function createApiWrapper<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  errorMessage = 'Failed to fetch data'
): Promise<T> {
  return new Promise((resolve) => {
    apiCall()
      .then(resolve)
      .catch((error) => {
        handleApiError(error, errorMessage)
        // Return mock data when API fails
        resolve(mockData)
      })
  })
}
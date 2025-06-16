import { useSnackbar } from 'notistack'

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export function useApiErrorHandler() {
  const { enqueueSnackbar } = useSnackbar()

  const handleApiError = (error: unknown, fallbackMessage = 'An error occurred') => {
    console.error('API Error:', error)
    
    if (error instanceof ApiError) {
      enqueueSnackbar(error.message, { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      })
      return error.message
    }
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        enqueueSnackbar('Unable to connect to server. Using demo data.', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        })
        return 'Connection failed - using demo data'
      }
      
      enqueueSnackbar(error.message, { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      })
      return error.message
    }
    
    enqueueSnackbar(fallbackMessage, { 
      variant: 'error',
      anchorOrigin: { vertical: 'top', horizontal: 'right' }
    })
    return fallbackMessage
  }

  return { handleApiError }
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
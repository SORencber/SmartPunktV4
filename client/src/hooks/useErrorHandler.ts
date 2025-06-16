import { useSnackbar } from 'notistack'
import { useCallback } from 'react'

export function useErrorHandler() {
  const { enqueueSnackbar } = useSnackbar()

  const handleError = useCallback((error: unknown, fallbackMessage = 'An unexpected error occurred') => {
    let message = fallbackMessage

    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }

    // Filter out non-critical browser extension errors
    if (message.includes('MetaMask') || message.includes('chrome-extension')) {
      console.warn('Browser extension error (non-critical):', message)
      return
    }

    console.error('Application error:', error)

    enqueueSnackbar(message, { 
      variant: 'error',
      anchorOrigin: { vertical: 'top', horizontal: 'right' }
    })
  }, [enqueueSnackbar])

  return { handleError }
}
import { SnackbarProvider } from 'notistack'
import AppRoutes from './routes'

function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={3000}
      preventDuplicate={true}
      dense={false}
      iconVariant={{
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
      }}
    >
      <AppRoutes />
    </SnackbarProvider>
  )
}

export default App
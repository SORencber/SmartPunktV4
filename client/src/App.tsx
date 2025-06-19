import { SnackbarProvider } from 'notistack'
import AppRoutes from './routes'
import { Orders } from '@/pages/Orders';
import { Invoices } from '@/pages/Invoices';

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
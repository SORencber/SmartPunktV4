import { LoadingSpinner } from './LoadingSpinner'
import { useTranslation } from 'react-i18next'

interface PageLoaderProps {
  text?: string
}

export function PageLoader({ text }: PageLoaderProps) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          {t('common.appName')}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {text || t('common.loading')}
        </p>
      </div>
    </div>
  )
}
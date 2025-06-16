import { useApiStatus } from '@/hooks/useApiStatus'
import { Badge } from './ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

export function ApiStatusIndicator() {
  const { isApiOnline } = useApiStatus()

  if (isApiOnline) {
    return null // Don't show anything when API is working
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge variant="destructive" className="bg-red-500 text-white shadow-lg">
        <WifiOff className="w-3 h-3 mr-1" />
        API Offline - Using Demo Data
      </Badge>
    </div>
  )
}
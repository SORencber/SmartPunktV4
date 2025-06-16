import { useState, useEffect } from 'react'

export function useApiStatus() {
  const [isApiOnline, setIsApiOnline] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/ping', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          setIsApiOnline(true)
        } else {
          setIsApiOnline(false)
        }
      } catch (error) {
        console.warn('API is not available:', error)
        setIsApiOnline(false)
      } finally {
        setLastChecked(new Date())
      }
    }

    // Check immediately
    checkApiStatus()

    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  return { isApiOnline, lastChecked }
}
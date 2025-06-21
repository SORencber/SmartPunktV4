import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useSnackbar } from 'notistack'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Eye, EyeOff, Wrench, Globe, UserPlus } from 'lucide-react'
import { api } from '@/api/api'

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  name: string
  role: string
}

export function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { handleError } = useErrorHandler()

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'branch_staff'
    }
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      enqueueSnackbar("Password Mismatch", {
        variant: "error",
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/auth/register', {
        email: data.email,
        password: data.password,
        fullName: data.name,
        role: data.role
      })
      
      if (response.data.success) {
        enqueueSnackbar("Registration Successful!", {
          variant: "success",
        })
        navigate('/login')
      } else {
        throw new Error(response.data.message || 'Registration failed')
      }
    } catch (error) {
      handleError(error, 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center">
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Join RepairFlow Pro to manage your repair business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="headquarters">Headquarters Staff</SelectItem>
                    <SelectItem value="branch_staff">Branch Staff</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match'
                    })}
                    className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" text="Creating account..." />
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
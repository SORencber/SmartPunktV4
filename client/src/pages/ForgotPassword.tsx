import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSnackbar } from 'notistack'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ArrowLeft, Mail, CheckCircle, Wrench } from 'lucide-react'
import { requestPasswordReset } from '@/api/passwordReset'

interface ForgotPasswordForm {
  email: string
}

export function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { handleError } = useErrorHandler()

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordForm>({
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      await requestPasswordReset(data.email)
      setEmailSent(true)
      enqueueSnackbar("Reset link sent!", {
        variant: "success",
      })
    } catch (error) {
      handleError(error, 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    const email = getValues('email')
    if (!email) return

    setLoading(true)
    try {
      await requestPasswordReset(email)
      enqueueSnackbar("Email resent!", {
        variant: "success",
      })
    } catch (error) {
      handleError(error, 'Failed to resend email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                We've sent password reset instructions to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-4">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  We sent a password reset link to{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {getValues('email')}
                  </span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Click the link in the email to reset your password. If you don't see it, check your spam folder.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" text="Resending..." />
                  ) : (
                    'Resend Email'
                  )}
                </Button>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Wrench className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" text="Sending..." />
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Remember your password?{' '}
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
            Need help?{' '}
            <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
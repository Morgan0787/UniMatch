import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Chrome, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/i18n'
import { loginText, loginEmailNotice } from '@/lib/loginCopy'
import { loginCancelTarget, readLastPublicRoute, safeLoginReturn } from '@/lib/loginReturn'
import AuthExperience from '@/components/auth/AuthExperience'
import { authSceneCopy } from '@/components/auth/authCopy'
import '@/styles/release-pages.css'
import '@/styles/auth-experience.css'

const getFriendlyAuthError = (error) => {
  if (!error) return 'Something went wrong. Please try again.'

  const message = error.message || ''

  if (message.includes('Invalid login credentials')) {
    return 'We could not sign you in. Please check your email and password and try again.'
  }

  if (message.includes('Email not confirmed')) {
    return 'Please verify your email before signing in.'
  }

  if (message.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  if (message.includes('signups not allowed')) {
    return 'Sign-ups are currently unavailable. Please contact support.'
  }

  return 'We could not complete that request. Please try again.'
}

export default function Login() {
  const { language } = useLanguage()
  const l = text => loginText(text, language)
  const sceneCopy = authSceneCopy(language)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rawRedirectTo = searchParams.get('redirect_to')
  const redirectTo = safeLoginReturn(rawRedirectTo)
  const cancelTo = loginCancelTarget(rawRedirectTo, readLastPublicRoute())

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successState, setSuccessState] = useState(null)
  const [method, setMethod] = useState('password')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          navigate(redirectTo, { replace: true })
        }
      } catch (err) {
        console.warn('Unable to restore session', err)
      }
    }

    checkSession()
  }, [navigate, redirectTo])

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessState(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data?.session?.user) {
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(l(getFriendlyAuthError(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setSuccessState(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/Login?redirect_to=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      setError(l(getFriendlyAuthError(err)))
      setLoading(false)
    }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessState(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/Login?redirect_to=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        throw error
      }

      setSuccessState({
        title: l('Check your email'),
        message: loginEmailNotice(email, language),
      })
    } catch (err) {
      setError(l(getFriendlyAuthError(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessState(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/Login?redirect_to=${encodeURIComponent(redirectTo)}`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data?.session?.user) {
        navigate(redirectTo, { replace: true })
      } else {
        setSuccessState({
          title: l('Verify your email'),
          message: loginEmailNotice(email, language, true),
        })
      }
    } catch (err) {
      setError(l(getFriendlyAuthError(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page release-page auth-page">
      <div className="auth-layout">
      <AuthExperience method={method} copy={sceneCopy} />
      <section className="release-login-shell auth-form-shell" aria-labelledby="auth-title">
        <Card className="release-login-card product-glass">
          <CardContent className="auth-card-content">
            <header className="auth-form-heading" aria-live="polite" aria-atomic="true">
              <h1 id="auth-title">{successState ? successState.title : l(method === 'signup' ? 'Create Account' : 'Sign in to your account')}</h1>
              <p>{successState ? successState.message : sceneCopy.subtitle}</p>
            </header>
            {redirectTo.includes('/AdmissionsSurvey') && <p role="status" className="auth-return-notice">{{en:'Sign in to save your university. You will return to your results and confirm the save. Your answers stay on this device for up to two hours.',ru:'Войдите, чтобы сохранить вуз. После входа вы вернётесь к результатам и подтвердите сохранение. Ответы хранятся на этом устройстве до двух часов.',uz:'Universitetni saqlash uchun kiring. Natijalarga qaytib, saqlashni tasdiqlaysiz. Javoblar bu qurilmada ikki soatgacha saqlanadi.'}[language]}</p>}
            {successState ? <div className="auth-success" role="status">
              <div className="auth-success-icon"><Mail aria-hidden="true" /></div>
              <Button variant="outline" onClick={() => setSuccessState(null)}>{l('Use a different method')}</Button>
            </div> : <Tabs value={method} onValueChange={setMethod} className="login-methods" data-method={method}>
              <TabsList className="login-method-tabs w-full mb-6">
                <TabsTrigger value="password" className="flex-1">{l("Password")}</TabsTrigger>
                <TabsTrigger value="magic" className="flex-1">{l("Magic Link")}</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">{l("Sign Up")}</TabsTrigger>
              </TabsList>

              {/* Mounted grid layers reserve the tallest form's height without exposing inactive controls. */}
              <div className="login-method-panels">
              <TabsContent value="password" forceMount inert={method !== 'password' ? '' : undefined} aria-hidden={method !== 'password'}>
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-pw">{l("Email")}</Label>
                    <Input
                      id="email-pw"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">{l("Password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Chrome className="w-4 h-4 mr-2" />}
                    {l("Continue with Google")}
                  </Button>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    {l("Sign In")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magic" forceMount inert={method !== 'magic' ? '' : undefined} aria-hidden={method !== 'magic'}>
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-magic">{l("Email")}</Label>
                    <Input
                      id="email-magic"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                    {l("Send Magic Link")}
                  </Button>
                  <p className="text-xs text-center text-slate-400">{l("We'll email you a passwordless sign-in link.")}</p>
                </form>
              </TabsContent>

              <TabsContent value="signup" forceMount inert={method !== 'signup' ? '' : undefined} aria-hidden={method !== 'signup'}>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full-name">{l("Full name")}</Label>
                    <Input
                      id="full-name"
                      type="text"
                      autoComplete="name"
                      placeholder={l("Your name")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-su">{l("Email")}</Label>
                    <Input
                      id="email-su"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password-su">{l("Password")}</Label>
                    <Input
                      id="password-su"
                      type="password"
                      autoComplete="new-password"
                      placeholder={l("At least 6 characters")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Chrome className="w-4 h-4 mr-2" />}
                    {l("Continue with Google")}
                  </Button>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {l("Create Account")}
                  </Button>
                </form>
              </TabsContent>
              </div>
            </Tabs>}
          </CardContent>
        </Card>
        <button type="button" className="auth-back" onClick={() => navigate(cancelTo)}><ArrowLeft size={16} aria-hidden="true" />{{en:'Back without signing in',ru:'Вернуться без входа',uz:'Kirmasdan qaytish'}[language]}</button>
      </section>
      </div>
    </div>
  )
}

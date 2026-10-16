import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, GraduationCap, Chrome } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirectTo = searchParams.get('redirect_to') || '/'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successState, setSuccessState] = useState(null)

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

  const ensureProfile = async (authUser) => {
    if (!authUser?.id) return

    try {
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      if (existingProfile) {
        return
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: authUser.id,
        email: authUser.email ?? null,
        full_name: authUser.user_metadata?.full_name || authUser.full_name || null,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.warn('Unable to create profile', insertError)
      }
    } catch (err) {
      console.warn('Unable to create profile', err)
    }
  }

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
        await ensureProfile(data.session.user)
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(getFriendlyAuthError(err))
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
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      setError(getFriendlyAuthError(err))
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
        title: 'Check your email',
        message: `We sent a sign-in link to ${email}. Click it to continue.`,
      })
    } catch (err) {
      setError(getFriendlyAuthError(err))
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
        await ensureProfile(data.session.user)
        navigate(redirectTo, { replace: true })
      } else {
        setSuccessState({
          title: 'Verify your email',
          message: `We sent a confirmation email to ${email}. Please open it to verify your account.`,
        })
      }
    } catch (err) {
      setError(getFriendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  if (successState) {
    return (
      <div className="login-page min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">{successState.title}</h2>
            <p className="text-slate-500 text-sm">{successState.message}</p>
            <Button variant="ghost" size="sm" onClick={() => setSuccessState(null)}>
              Use a different method
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="login-page min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">UniMatch</h1>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        <Card className="product-glass">
          <CardContent className="pt-6">
            <Tabs defaultValue="password">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
                <TabsTrigger value="magic" className="flex-1">Magic Link</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-pw">Email</Label>
                    <Input
                      id="email-pw"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Chrome className="w-4 h-4 mr-2" />}
                    Continue with Google
                  </Button>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magic">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-magic">Email</Label>
                    <Input
                      id="email-magic"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                    Send Magic Link
                  </Button>
                  <p className="text-xs text-center text-slate-400">We'll email you a passwordless sign-in link.</p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-su">Email</Label>
                    <Input
                      id="email-su"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password-su">Password</Label>
                    <Input
                      id="password-su"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Chrome className="w-4 h-4 mr-2" />}
                    Continue with Google
                  </Button>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

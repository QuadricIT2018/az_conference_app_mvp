import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-az-mulberry">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-az-mulberry">
      {/* Top section with branding */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-safe-top">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold font-heading">Conference</h1>
          <p className="mt-2 text-white/80">Your personal event companion</p>
        </div>
      </div>

      {/* Login form */}
      <div className="rounded-t-3xl bg-white px-6 pb-safe-bottom pt-8">
        <h2 className="text-2xl font-bold font-heading text-az-graphite">Sign In</h2>
        <p className="mt-1 text-gray-500">Welcome back!</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-az-mulberry focus:outline-none focus:ring-1 focus:ring-az-mulberry"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-az-mulberry focus:outline-none focus:ring-1 focus:ring-az-mulberry"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="h-6" />
      </div>
    </div>
  )
}

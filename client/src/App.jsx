import { useEffect, useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard.jsx'

function App() {
  const oauthParams = new URLSearchParams(window.location.search)
  const oauth = oauthParams.get('oauth')
  const oauthUsername = oauthParams.get('username')
  const oauthToken = oauthParams.get('token')
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean((localStorage.getItem('skilllink-session') && localStorage.getItem('skilllink-token')) || (oauthUsername && oauthToken)))
  const [username, setUsername] = useState(() => oauthUsername || localStorage.getItem('skilllink-session') || '')

  useEffect(() => {
    const googleButton = document.querySelector('.google-button')
    const startGoogleLogin = () => { window.location.href = 'http://localhost:5000/api/auth/google' }
    googleButton?.addEventListener('click', startGoogleLogin)
    if (oauth === 'success' && oauthToken && oauthUsername) {
      localStorage.setItem('skilllink-session', oauthUsername)
      localStorage.setItem('skilllink-token', oauthToken)
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (oauth === 'error') {
      window.alert(new URLSearchParams(window.location.search).get('message') || 'Google sign-in failed.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    return () => googleButton?.removeEventListener('click', startGoogleLogin)
  }, [oauth, oauthToken, oauthUsername])

  const isSignup = mode === 'signup'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      const response = await fetch(`http://localhost:5000/api/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          username: formData.get('username'),
          password: formData.get('password'),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Authentication failed.')

      if (isSignup) {
        setMode('login')
        setSubmitted(true)
      } else {
        setUsername(result.username)
        setIsAuthenticated(true)
        localStorage.setItem('skilllink-session', result.username)
        localStorage.setItem('skilllink-token', result.token)
      }
    } catch (error) {
      window.alert(error.message === 'Failed to fetch' ? 'The server is unavailable. Start the backend and try again.' : error.message)
    }
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setSubmitted(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('skilllink-session')
    localStorage.removeItem('skilllink-token')
    setUsername('')
    setIsAuthenticated(false)
  }

  if (isAuthenticated) {
    return <Dashboard username={username} token={localStorage.getItem('skilllink-token')} onLogout={handleLogout} />
  }

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="SkillLink introduction">
        <div className="visual-content">
          <div className="brand"><span className="brand-mark">s</span><span>skill<span>link</span></span></div>
          <div className="visual-copy"><p className="eyebrow">A NETWORK FOR WHAT YOU DO BEST</p><h1>Meet people who make your work <em>better.</em></h1><p>Build a circle around your skills, exchange ideas, and find opportunities that feel like a natural next step.</p></div>
          <div className="network-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="node node-main">JS</span><span className="node node-one">MC</span><span className="node node-two">AW</span><span className="node node-three">PN</span><span className="connection-line line-one" /><span className="connection-line line-two" /><span className="connection-line line-three" /></div>
          <div className="quote"><span>“</span><p>The best opportunities start with a good conversation.</p></div>
        </div>
        <footer>© 2024 SkillLink <span>•</span> Made for people who are going places</footer>
      </section>

      <section className="auth-panel"><div className="mobile-brand"><div className="brand"><span className="brand-mark">s</span><span>skill<span>link</span></span></div></div><div className="auth-card"><div className="mode-switch" role="tablist" aria-label="Authentication mode"><button className={mode === 'login' ? 'selected' : ''} onClick={() => switchMode('login')} role="tab" aria-selected={mode === 'login'}>Log in</button><button className={mode === 'signup' ? 'selected' : ''} onClick={() => switchMode('signup')} role="tab" aria-selected={mode === 'signup'}>Sign up</button></div><div className="auth-heading"><p className="eyebrow">{isSignup ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</p><h2>{isSignup ? 'Create your account' : 'Log in to SkillLink'}</h2><p>{isSignup ? 'Your next meaningful connection is a few details away.' : 'Pick up where you left off.'}</p></div><form onSubmit={handleSubmit}>{isSignup && <label>Full name<input type="text" name="name" placeholder="e.g. Jagadeesh S" required /></label>}<label>Username or email<input type="text" name="username" placeholder="you@example.com" required /></label><label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} name="password" placeholder={isSignup ? 'Create a password' : 'Enter your password'} minLength="6" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label>{isSignup ? <label className="check-row"><input type="checkbox" required /><span>I agree to the <a href="#terms">terms of service</a> and privacy policy</span></label> : <div className="form-options"><label className="check-row"><input type="checkbox" /><span>Remember me</span></label><a href="#forgot">Forgot password?</a></div>}{submitted && <p className="success-message">{isSignup ? 'Account details ready. Welcome to SkillLink!' : 'You are ready to continue to SkillLink.'}</p>}<button className="submit-button" type="submit">{isSignup ? 'Create account' : 'Log in'} <span>→</span></button></form><div className="divider"><span>or continue with</span></div><button className="google-button" type="button"><span className="google-g">G</span> Continue with Google</button><p className="switch-prompt">{isSignup ? 'Already have an account?' : 'New to SkillLink?'} <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Log in' : 'Create an account'}</button></p></div></section>
    </main>
  )
}

export default App

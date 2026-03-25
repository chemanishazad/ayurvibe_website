import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, Lock, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export function isAdminAuthenticated(): boolean {
  return !!sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export type AuthUser = {
  id: string;
  username: string;
  role: string;
  clinicId: string | null;
  /** Staff: explicit sidebar routes from admin; omitted or null = default staff menu. */
  allowedNavPaths?: string[] | null;
  /** Staff: `nurse` = vitals-only consultation entry. */
  staffRole?: string | null;
};

export function getAuthUser(): AuthUser | null {
  const raw = sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/** Replace token + user together (e.g. after switch-clinic). */
export function persistAuthSession(token: string, user: AuthUser): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function setAdminAuthenticated(value: boolean): void {
  if (value) {
    // Token and user are set by login response
  } else {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  }
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { toast } = useToast();

  if (isAdminAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Login failed', description: data.error || 'Invalid credentials', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      toast({ title: 'Welcome back', description: 'You have signed in successfully.' });
      navigate(from, { replace: true });
    } catch (err) {
      toast({ title: 'Login failed', description: 'Network error. Is the backend running?', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md border border-border/60 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10">
        <CardHeader className="space-y-6 pb-3 text-center">
          <div className="flex justify-center">
            <Logo withText textClassName="text-center" />
          </div>
          <div className="flex justify-center">
            <div className="group rounded-2xl bg-primary/10 p-4 ring-4 ring-primary/5 transition-transform duration-300 ease-out hover:scale-[1.03]">
              <Lock className="h-10 w-10 text-primary transition-transform duration-300 ease-out group-hover:-rotate-3" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Admin Login</CardTitle>
            <CardDescription className="mt-2">Sign in to continue to the admin dashboard.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  disabled={isLoading}
                  className="pl-10 transition-[border-color,box-shadow] duration-200 hover:border-primary/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 transition-[border-color,box-shadow] duration-200 hover:border-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full font-medium transition-all duration-200 hover:shadow-md active:scale-[0.99]"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            { <p className="text-center text-xs text-muted-foreground">Authorized users only.</p> }
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

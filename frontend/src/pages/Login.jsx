import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';

const PRESET_ROLES = [
  {
    key: 'admin',
    label: 'Admin',
    description: 'System & tenant control',
    defaultEmail: 'admin@brightloop.io',
  },
  {
    key: 'staff',
    label: 'Internal Staff',
    description: 'Billing & operations management',
    defaultEmail: 'staff@brightloop.io',
  },
  {
    key: 'customer',
    label: 'Customer',
    description: 'Subscriber portal & invoices',
    defaultEmail: 'customer@acme.corp',
  },
];

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.key);
    setEmail(roleItem.defaultEmail);
    setPassword('password123');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both corporate email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({
      email: email.trim(),
      password,
      role: selectedRole,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background subtle micro-grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Zap className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Brightloop<span className="text-indigo-400">.</span>
          </span>
        </div>
        <h2 className="mt-3 text-center text-xs font-semibold tracking-wider uppercase text-slate-400">
          Enterprise Subscription & Recurring Billing
        </h2>
      </div>

      {/* Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 pb-5 border-b border-slate-800/80">
            <h3 className="text-lg font-semibold text-slate-100">Sign in to console</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select your authorization role or enter corporate credentials.
            </p>

            {/* Role Target Selector */}
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                Authorization Target
              </span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_ROLES.map((item) => {
                  const isSelected = selectedRole === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleRoleSelect(item)}
                      className={`text-left p-2.5 rounded-lg border transition-all text-xs active:scale-[0.98] ${
                        isSelected
                          ? 'border-indigo-500/70 bg-indigo-500/10 text-white ring-1 ring-indigo-500/50'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{item.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <span className="block text-xs text-slate-400 mt-0.5 truncate">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Corporate Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@brightloop.io"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-xs font-mono text-slate-400">
                  Default: <span className="text-indigo-400 font-semibold">password123</span>
                </span>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Context Indicator */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Active Session Role:
              </span>
              <span className="font-mono text-indigo-400 uppercase tracking-wider text-xs font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {selectedRole}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-medium tracking-wide shadow-lg shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating session...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Register */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need a new enterprise tenant account?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1"
              >
                Register organization
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-slate-500 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted Session & JWT Verification</span>
        </div>
      </div>
    </div>
  );
};

export default Login;

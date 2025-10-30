import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { useLoginMutation } from './api';
import { loginSuccess } from './slice';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [login, { isLoading, error }] = useLoginMutation();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (isAuthenticated)
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );

  const onSubmit = async (data: LoginForm) => {
    try {
      // useLoginMutation returns { token, user }
      const result = await login(data).unwrap();
      dispatch(
        loginSuccess({
          token: result.token,
          user: result.user,
          role: result.user.role,
        })
      );
      navigate('/dashboard', { replace: true });
    } catch (e) {
      // handled by error banner below
      console.error('Login failed:', e);
    }
  };

  type ApiError = {
    status?: number;
    data?: {
      error?: { message?: string };
      message?: string;
    };
    error?: string;
  };

  const apiError = error as ApiError | undefined;

  const errorMsg =
    apiError?.data?.error?.message ??
    apiError?.data?.message ??
    apiError?.error ??
    (typeof error === 'string' ? error : null);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <div className='mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-primary-500 shadow-md'>
            <span className='text-white text-2xl font-bold'>M</span>
          </div>
          <h1 className='mt-6 text-3xl font-extrabold text-gray-900'>
            Made-in-China Admin
          </h1>
          <p className='mt-2 text-sm text-gray-600'>
            Sign in to access the dashboard
          </p>
        </div>

        <form
          className='mt-8 space-y-6'
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className='space-y-4'>
            {/* Email */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700'
              >
                Email Address
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Mail className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  {...register('email')}
                  id='email'
                  type='email'
                  autoComplete='email'
                  className={cn(
                    'appearance-none block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm',
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder='admin@madeinchina.com'
                />
              </div>
              {errors.email && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  {...register('password')}
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  className={cn(
                    'appearance-none block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm',
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder='Enter your password'
                />
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                  <button
                    type='button'
                    className='text-gray-400 hover:text-gray-600 focus:outline-none'
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className='rounded-md bg-red-50 p-3'>
              <div className='text-sm text-red-800'>{String(errorMsg)}</div>
            </div>
          )}

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative w-full flex justify-center py-2.5 px-4
             text-sm font-medium rounded-md text-white
             bg-primary-500 hover:bg-primary-600
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
             disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? (
                <span className='flex items-center gap-2'>
                  <svg
                    className='animate-spin h-4 w-4 text-white'
                    viewBox='3 3 18 18'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='9'
                      stroke='currentColor'
                      strokeWidth='2'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M12 3v9l6 3'
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

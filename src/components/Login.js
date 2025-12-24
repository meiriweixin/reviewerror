import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '../services/api';
import Lottie from 'lottie-react';
import robotAnimation from '../robot.json';

const Login = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setIsLoading(true);
      const userData = await loginWithGoogle(credentialResponse.credential);
      onLogin(userData.user);
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Google login failed. Please try again.');
    setIsLoading(false);
  };

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      text: 'AI-powered question extraction',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      text: 'Track progress & achievements',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      text: 'All subjects, Sec 1 to University',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />

          {/* Animated blobs */}
          <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-40 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-40 left-20 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-3000" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

          {/* Radial gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="max-w-md w-full mx-4 relative z-10">
          {/* Card with animated border */}
          <div className="relative group">
            {/* Animated gradient border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

            {/* Card content */}
            <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10">
              {/* Glow effect behind robot */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-2xl" />

              {/* Header */}
              <div className="text-center mb-8 relative">
                {/* Robot Animation */}
                <div className="inline-block mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-full blur-xl scale-110" />
                  <Lottie
                    animationData={robotAnimation}
                    loop={true}
                    style={{ width: 160, height: 160 }}
                    className="relative z-10"
                  />
                </div>

                {/* Title with gradient */}
                <h1 className="text-4xl font-bold mb-3">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Student Review
                  </span>
                </h1>
                <p className="text-slate-400 text-lg">
                  Master your wrong questions with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-semibold">AI</span>
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mb-8 space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-xl transition-all duration-300 cursor-default ${
                      hoveredFeature === index
                        ? `${feature.bgColor} scale-[1.02]`
                        : 'hover:bg-white/5'
                    }`}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color} text-white mr-4 shadow-lg transition-transform duration-300 ${
                      hoveredFeature === index ? 'scale-110 rotate-3' : ''
                    }`}>
                      {feature.icon}
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      hoveredFeature === index ? 'text-white' : 'text-slate-300'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Login Button */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
                    <div className="relative">
                      <div className="w-8 h-8 border-2 border-blue-500/30 rounded-full" />
                      <div className="absolute top-0 left-0 w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="ml-4 text-slate-300 font-medium">Signing in...</span>
                  </div>
                ) : (
                  <div className="relative group/btn">
                    {/* Button glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-40 group-hover/btn:opacity-60 transition duration-300" />

                    {/* Google Login wrapper */}
                    <div className="relative bg-slate-800 rounded-2xl p-1 border border-white/10">
                      <div className="flex justify-center bg-white rounded-xl overflow-hidden">
                        <GoogleLogin
                          onSuccess={handleSuccess}
                          onError={handleError}
                          useOneTap
                          theme="outline"
                          size="large"
                          text="continue_with"
                          shape="rectangular"
                          width="350"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security note */}
              <div className="mt-6 flex items-center justify-center text-sm text-slate-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure login with Google
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              For students from <span className="text-slate-400 font-medium">Secondary 1</span> to <span className="text-slate-400 font-medium">University</span>
            </p>
            <div className="mt-4 flex justify-center space-x-1">
              {['bg-blue-500', 'bg-purple-500', 'bg-pink-500'].map((color, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${color} opacity-60`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;

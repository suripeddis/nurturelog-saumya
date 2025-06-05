'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-green-600 mb-8 text-center">Welcome to NurtureLog</h1>
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center mb-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading sign-in...</span>
          </div>
        )}
        
        {/* Descope Component */}
        <div className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
          <Descope
            flowId="sign-up-or-in"
            onSuccess={() => {
              console.log('Logged in successfully!');
              router.push('/upload');
            }}
            onError={(e: any) => {
              console.error('Login error:', e);
              setIsLoading(false);
            }}
            onReady={() => {
              setIsLoading(false);
            }}
            redirectAfterSuccess="/upload"
          />
        </div>
      </div>
    </main>
  );
} 
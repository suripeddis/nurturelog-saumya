'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { processSession, ProcessingResult, ProcessingProgress } from '@/lib/processSession';

interface ProcessingContextType {
  results: ProcessingResult | null;
  progress: ProcessingProgress | null;
  error: string | null;
  isProcessing: boolean;
  startProcessing: (file: File) => Promise<void>;
  reset: () => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startProcessing = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResults(null);
    setProgress(null);
    
    try {
      const result = await processSession(file, (progressUpdate) => {
        setProgress(progressUpdate);
      });
      
      setResults(result);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResults(null);
    setProgress(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <ProcessingContext.Provider
      value={{
        results,
        progress,
        error,
        isProcessing,
        startProcessing,
        reset,
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
} 
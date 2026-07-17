'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SOFI_MASCOT_ASSETS,
  type SofiMascotOneShotState,
  type SofiMascotState,
  preloadSofiMascotAssets,
} from './sofi-mascot-assets';

type SofiMascotControllerOptions = {
  initialState?: SofiMascotState;
  preload?: boolean;
};

export type SofiMascotController = {
  state: SofiMascotState;
  isLoading: boolean;
  send: (state: SofiMascotOneShotState) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

export function useSofiMascotController({
  initialState = 'idle',
  preload = true,
}: SofiMascotControllerOptions = {}): SofiMascotController {
  const [state, setState] = useState<SofiMascotState>(initialState);
  const [isLoading, setIsLoading] = useState(initialState === 'loading');
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReturnTimer = useCallback(() => {
    if (!returnTimerRef.current) return;
    clearTimeout(returnTimerRef.current);
    returnTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (preload) {
      preloadSofiMascotAssets();
    }

    return clearReturnTimer;
  }, [clearReturnTimer, preload]);

  const reset = useCallback(() => {
    clearReturnTimer();
    setIsLoading(false);
    setState('idle');
  }, [clearReturnTimer]);

  const setLoading = useCallback((loading: boolean) => {
    clearReturnTimer();
    setIsLoading(loading);
    setState(loading ? 'loading' : 'idle');
  }, [clearReturnTimer]);

  const send = useCallback((nextState: SofiMascotOneShotState) => {
    if (isLoading) {
      setState('loading');
      return;
    }

    clearReturnTimer();
    setState(nextState);

    const durationMs = SOFI_MASCOT_ASSETS[nextState].durationMs;
    returnTimerRef.current = setTimeout(() => {
      setState('idle');
      returnTimerRef.current = null;
    }, durationMs);
  }, [clearReturnTimer, isLoading]);

  return {
    state,
    isLoading,
    send,
    setLoading,
    reset,
  };
}

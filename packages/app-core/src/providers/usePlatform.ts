// @repo/app-core — level 2.

import type { Platform } from '@repo/platform/platform';
import { useContext } from 'react';
import { PlatformContext } from './platformContext';

export function usePlatform(): Platform {
  const platform = useContext(PlatformContext);
  if (!platform) {
    throw new Error('usePlatform must be called within a PlatformProvider');
  }
  return platform;
}

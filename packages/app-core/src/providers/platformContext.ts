// @repo/app-core — level 2.
// The platform service bundle, instantiated with a concrete adapter by each app; app-core only
// defines and consumes the context (app-core-inventory.md §1).

import type { Platform } from '@repo/platform/platform';
import { createContext } from 'react';

export const PlatformContext = createContext<Platform | null>(null);

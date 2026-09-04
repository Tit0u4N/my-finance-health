// @repo/platform — level 0.
// The contract carries a pre-configured ky instance built by the app: base URL, headers, retry
// policy, timeouts, plugins (start-roadmap.md §8). The core builds requests and translates
// errors; it never instantiates the client itself. Since ky sits on fetch, this is identical on
// all three targets — desktop only differs in which fetch implementation the app's instance
// wraps (the Tauri HTTP plugin's), which the core never has to know about.

import type { KyInstance } from 'ky';

export type HttpClientService = {
  readonly instance: KyInstance;
};

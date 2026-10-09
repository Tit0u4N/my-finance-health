// The open local workspace, as far as the app stage needs to know it: where its database lives
// (so Settings → Data can export it) and how to leave it. Provided by LocalAppRoot only — in the
// in-memory fixture mode there is no session, `useWorkspaceSession()` is null, and Settings → Data
// shows no file actions.

import { createContext, useContext } from 'react';

export type WorkspaceSession = {
  /** Sandbox-relative path of the open `.mfhdb`. */
  readonly databasePath: string;
  /** Closes the session and returns to the passphrase prompt for this same workspace. */
  readonly onLock: () => void;
  /** Closes the session and returns to the workspace list. */
  readonly onSwitchWorkspace: () => void;
};

export const WorkspaceSessionContext = createContext<WorkspaceSession | null>(null);

export function useWorkspaceSession(): WorkspaceSession | null {
  return useContext(WorkspaceSessionContext);
}

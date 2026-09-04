// @repo/data — level 1.
// A workspace's storage mode is chosen at creation and immutable thereafter (start-roadmap.md
// §9). The two refs below are how the bootstrap-stage hook designates or resumes one — they
// carry no secret material themselves (the API key lives behind the platform secrets contract;
// the local file's key never leaves the platform adapter).

export type LocalWorkspaceRef = {
  readonly mode: 'local';
  /** Stable id for the recent-workspaces list; independent of the (possibly-relocated) file path. */
  readonly id: string;
  /** Opaque to the core — resolved and re-validated by the platform's file system service. */
  readonly path: string;
  readonly label: string;
};

export type OnlineWorkspaceRef = {
  readonly mode: 'online';
  readonly id: string;
  readonly apiBaseUrl: string;
  readonly label: string;
};

export type WorkspaceRef = LocalWorkspaceRef | OnlineWorkspaceRef;

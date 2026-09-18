import type { DomainError } from '@repo/domain/primitives/errors';

/** Maps a DomainError from the local workspace opener to user-facing copy. English only for
 * this pass — the bootstrap flow is new UI without an i18n namespace yet. */
export function describeBootstrapError(error: DomainError): string {
  switch (error.kind) {
    case 'not-found':
      return "That file doesn't look like a my finance health workspace.";
    case 'integrity':
      return `This workspace's files are missing or damaged: ${error.message}`;
    case 'conflict':
      return error.message;
    case 'validation':
      return error.message;
    case 'storage':
      return error.message;
    case 'unauthorized':
      return error.message;
    case 'network':
      return error.message;
    case 'unsupported-capability':
      return `This isn't a local workspace (${error.capability}).`;
    default:
      return error satisfies never;
  }
}

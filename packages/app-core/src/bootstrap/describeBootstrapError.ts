import type { DomainError } from '@repo/domain/primitives/errors';
import type { useTranslation } from '../i18n/useTranslation';

type Translate = ReturnType<typeof useTranslation>['t'];

/** Maps a DomainError from the local workspace opener to user-facing copy. The kinds the user can
 * act on are translated; the rest pass the core's own message through. */
export function describeBootstrapError(error: DomainError, t: Translate): string {
  switch (error.kind) {
    case 'not-found':
      return t('bootstrap:error.notFound');
    case 'integrity':
      return t('bootstrap:error.integrity', { detail: error.message });
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
      return t('bootstrap:error.unsupportedCapability', { capability: error.capability });
    default:
      return error satisfies never;
  }
}

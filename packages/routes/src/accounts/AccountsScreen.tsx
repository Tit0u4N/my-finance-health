// @repo/routes — level 3.
// View for the Accounts (list) screen (screens.md) — JSX and @repo/ui composition only, all data
// and handlers come from useAccountsScreen. useTranslation is allowed here for static copy —
// everything derived (plurals, interpolation) stays in the ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { AmountValue } from '@repo/ui/components/AmountValue';
import { Avatar } from '@repo/ui/components/Avatar';
import { Badge } from '@repo/ui/components/Badge';
import { Button } from '@repo/ui/components/Button';
import { Content } from '@repo/ui/components/Content';
import { AreaChart } from '@repo/ui/components/charts/AreaChart';
import { Dialog } from '@repo/ui/components/Dialog';
import { Input } from '@repo/ui/components/Input';
import { OptionGrid } from '@repo/ui/components/OptionGrid';
import { PageHeader } from '@repo/ui/components/PageHeader';
import { Select } from '@repo/ui/components/Select';
import { ChevronRight, Plus } from 'lucide-react';
import { useAccountsScreen } from './useAccountsScreen';

export function AccountsScreen() {
  const { t } = useTranslation();
  const screen = useAccountsScreen();

  if (!screen.ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-body text-muted">
        {t('common:state.loadingWorkspace')}
      </div>
    );
  }

  const { hidden, cards, subtitle, onOpenAccount, addAccount } = screen;

  return (
    <>
      <PageHeader
        title={t('accounts:list.title')}
        subtitle={subtitle}
        actions={
          <Button tone="primary" size="sm" icon={Plus} onClick={addAccount.onOpen}>
            {t('accounts:list.addAccount')}
          </Button>
        }
      />
      <Content>
        <div className="grid-cards">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenAccount(card.id)}
              className="hovercard flex flex-col rounded-lg border border-border bg-surface p-4.5 text-left transition-[box-shadow,transform,border-color]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar icon={card.icon} color={card.color} size={38} />
                  <div>
                    <div className="text-foreground text-label-strong">{card.name}</div>
                    <div className="mt-0.5 text-caption text-muted normal-case">{card.meta}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-subtle" />
              </div>

              <div className="mt-4.5 flex items-baseline">
                <AmountValue value={card.balanceLabel} hidden={hidden} className="text-value" />
                <span className="ml-1.5 text-caption text-muted normal-case">{card.currencyLabel}</span>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <Badge tone={card.changeTone} size="sm">
                  <AmountValue value={card.changeLabel} hidden={hidden} className="text-inherit" />
                </Badge>
                <span className="text-caption text-muted normal-case">{card.changeCaption}</span>
              </div>

              <div className="mt-3.5 h-18.5">
                {card.sparkline.length > 1 && (
                  <AreaChart data={card.sparkline} width={330} height={74} color={card.color} />
                )}
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={addAccount.onOpen}
            className="flex min-h-55 flex-col items-center justify-center gap-2 rounded-lg border-2 border-border-strong border-dashed text-muted"
          >
            <Plus size={22} />
            <span className="text-label-strong">{t('accounts:list.addAnother')}</span>
          </button>
        </div>
      </Content>

      <Dialog
        open={addAccount.isOpen}
        // The dialog is opened only by our own onOpen() above (no <Dialog.Trigger> here) — base-ui
        // only ever calls this back to request a close (Escape / backdrop / the header's own X).
        onOpenChange={addAccount.onClose}
        title={t('accounts:createDialog.title')}
        subtitle={t('accounts:createDialog.subtitle')}
        closeLabel={t('common:action.close')}
        width={560}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={addAccount.onClose}>
              {t('common:action.cancel')}
            </Button>
            <Button tone="primary" size="sm" onClick={addAccount.onSubmit} disabled={!addAccount.canSubmit}>
              {t('accounts:createDialog.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t('accounts:createDialog.nameLabel')}
            placeholder={t('accounts:createDialog.namePlaceholder')}
            value={addAccount.name}
            onChange={(event) => addAccount.onNameChange(event.target.value)}
          />
          <div>
            <span className="text-label text-muted">{t('accounts:createDialog.typeLabel')}</span>
            <div className="mt-2">
              <OptionGrid
                value={addAccount.type}
                onChange={addAccount.onTypeChange}
                options={addAccount.typeOptions}
                columns={2}
                ariaLabel={t('accounts:createDialog.typeAriaLabel')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('accounts:createDialog.initialBalanceLabel')}
              placeholder="0.00"
              inputMode="decimal"
              value={addAccount.initialBalance}
              onChange={(event) => addAccount.onInitialBalanceChange(event.target.value)}
            />
            <Select
              label={t('accounts:createDialog.currencyLabel')}
              value={addAccount.currency}
              onValueChange={addAccount.onCurrencyChange}
              options={addAccount.currencyOptions}
            />
          </div>
          {addAccount.errorMessage && <span className="text-body-sm text-neg">{addAccount.errorMessage}</span>}
        </div>
      </Dialog>
    </>
  );
}

type AccountSwitcherAccount = {
  id: string;
  name: string;
  enabled: boolean;
};

type AccountSwitcherProps = {
  accounts: AccountSwitcherAccount[];
  selectedAccountId?: string;
  onSelect?: (accountId: string) => void;
};

export function AccountSwitcher({ accounts, selectedAccountId, onSelect }: AccountSwitcherProps) {
  const enabledAccounts = accounts.filter((account) => account.enabled);

  if (enabledAccounts.length < 2) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="选择账号">
      {enabledAccounts.map((account) => {
        const isSelected = selectedAccountId === account.id;

        return (
          <button
            key={account.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect?.(account.id)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              isSelected
                ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]'
            }`}
          >
            {account.name}
          </button>
        );
      })}
    </div>
  );
}

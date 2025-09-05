export type UserId = 'A' | 'B';
export type Category = 'food' | 'transport' | 'groceries' | 'general';

export interface GroupExpenseTxn {
  id: string;
  kind: 'GROUP_EXPENSE';
  paidBy: UserId;
  totalCents: number;
  category: Category;
  note?: string;
  timestamp: string; // ISO
}

export interface SettlementTxn {
  id: string;
  kind: 'SETTLEMENT';
  from: UserId;
  to: UserId;
  amountCents: number;
  timestamp: string;
}

export type JournalTx = GroupExpenseTxn | SettlementTxn;

export interface UserDerived {
  id: UserId;
  name: string;
  walletBalanceCents: number;
  monthlyBudgetCents: number;
  spentByCategoryCents: Record<Category, number>;
}

export interface DerivedState {
  users: Record<UserId, UserDerived>;
  /* Positive: B owes A. 
    Negative: A owes B. 
    Zero: settled.
    */
  netBOwesATotalCents: number;
}

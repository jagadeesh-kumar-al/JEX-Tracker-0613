export type TransactionRow = {
  id: number;
  amount: number;
  kind: "expense" | "income";
  categoryId: number;
  merchant: string;
  note: string | null;
  occurredAt: Date;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

export type CategoryRow = {
  id: number;
  name: string;
  icon: string;
  color: string;
  kind: "expense" | "income";
  monthlyBudget: number | null;
  createdAt: Date;
};

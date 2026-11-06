export type Expense = {
  id: string;
  amount: number;
  category: string;
  payMethod: string | null;
  note: string | null;
  spentOn: string; // YYYY-MM-DD
};

export interface Category {
    _id: string;
    name: string;
}

export interface Member {
    _id: string;
    name: string;
}

export interface Expense {
    _id: string;
    expenseReason: string;
    category: Category;
    amount: number;
    reimbursedID: Reimbursement | null;
    paidBy?: Category;
    description: string
    settled: Account | null;
    createdAt: Date;
    updatedAt: Date;
    reference_id?: string | null;
    directExpense: boolean;
}

export interface InstituteExpense {
    _id : string
    expenseReason: string;
    category: Category;
    project: Project;
    projectHead: string;
    amount: number;
    year_or_installment : number
    pd_ref : Account
    overheadPercentage: number;
    reference_id?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface EditExpenseData {
    expenseReason: string;
    category: string;
    amount: number;
    paidBy?: string;
}

export interface MemberExpense {
    memberId: string;
    memberName: string;
    totalPaid: number;
    totalSettled: number;
    totalDue: number;
}

export interface Reimbursement {
    _id: string;
    project: Project;
    totalAmount: number;
    createdAt: Date;
    title: string;
    expenses: Expense[];
    projectHead: string;
    paidStatus: boolean;
    description: string
    reference_id: string
    year_or_installment : number
}

export interface Installment {
    start_date: string;
    end_date: string;
}

export interface Project {
    _id?: string;
    funding_agency: string;
    project_id: string
    project_title: string
    start_date: Date | null;
    end_date: Date | null;
    project_heads: {
        [key: string]: number[];
    };
    carry_forward: {
        [key: string]: number[]
    }
    project_type: string;
    installments?: Installment[];
    total_amount: number;
    pis: Member[];
    copis: Member[];
    sanction_letter?: File | null;
    sanction_letter_file_id?: string;
    description: string
    note: string | null
    negative_heads: string[]
    override: { type: string, index: number }
}

export interface Account {
    _id: string
    amount: number;
    createdAt: Date
    type: 'Current' | 'Savings' | 'PDA' | 'PDF' | null;
    remarks?: string;
    credited: boolean;
    transferable: number;
    transfer: Account | null
}


export type Inputs = {
    selectedConfig: string
}
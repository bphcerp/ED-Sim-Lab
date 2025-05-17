import express, { Request, Response } from 'express';
import { ExpenseModel, InstituteExpenseModel } from '../models/expense';
import { CategoryModel } from '../models/category';
import { authenticateToken } from '../middleware/authenticateToken';
import { ObjectId, Schema } from 'mongoose';
import { AccountModel } from '../models/account';
import { ProjectModel } from '../models/project';
import { getCurrentIndex } from './project';
import { ReimbursementModel } from '../models/reimburse';
import { MemberModel } from '../models/member';

const router = express.Router();

interface ExpenseRequest {
  category: ObjectId;
  expenseReason: string;
  amount: number;
  type: 'Normal' | 'Institute'
  description: string;
  paidBy: ObjectId;
  reimbursedID?: ObjectId;
  settled?: 'Current' | 'Savings' | null;
}

interface MemberExpenseSummary {
  memberId: ObjectId;
  memberName: string;
  totalPaid: number;
  totalSettled: number;
  totalDue: number;
}

router.use(authenticateToken);

const VALID_SETTLED_STATUS = ['Current', 'Savings'] as const;

const validateCategory = async (categoryId: Schema.Types.ObjectId): Promise<boolean> => {
  const categoryExists = await CategoryModel.findById(categoryId);
  return !!categoryExists;
};

router.post('/', async (req: Request, res: Response) => {
  const expenseData = req.body;

  try {
    if (!await validateCategory(expenseData.category)) {
      res.status(400).json({ message: 'Invalid category ID' });
      return;
    }

    let expense;

    if (expenseData.type === 'Institute') {

      const project = await ProjectModel.findById(expenseData.project)

      if (!project) {
        res.status(404).send("Project ID not found!")
        return
      }


      if (expenseData.overheadPercentage && (expenseData.overheadPercentage < 0 || expenseData.overheadPercentage > 100)) {
        res.status(400).send({ message: 'Overhead Percentage is incorrect. (Enter from 0 to 100)' })
        return
      }

      let pd_entry
      if (expenseData.overHeadPercentage > 0) {
        pd_entry = await (new AccountModel({
          type: 'PDF',
          amount: expenseData.amount * (expenseData.overheadPercentage / 100),
          credited: false,
          remarks: `Institute Expense : ${expenseData.expenseReason}`
        })).save();
      }

      expense = new InstituteExpenseModel({
        ...expenseData,
        pd_ref: pd_entry?._id,
        year_or_installment: getCurrentIndex(project),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    else if (expenseData.paidDirectWith) {

      if (!VALID_SETTLED_STATUS.includes(expenseData.paidDirectWith)) {
        res.status(400).json({
          message: `Invalid account. Must be one of: ${VALID_SETTLED_STATUS.join(', ')}`,
        });
        return;
      }

      const accountEntry = await new AccountModel({
        amount: expenseData.amount,
        type: expenseData.paidDirectWith,
        remarks: `Paid expense ${expenseData.expenseReason} with ${expenseData.paidDirectWith}`,
        credited: false,
      }).save();

      expense = new ExpenseModel({
        ...expenseData,
        directExpense: true,
        settled: accountEntry._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    else {
      expense = new ExpenseModel({
        ...expenseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    if (type === 'Institute') {
      const instituteExpenses = await InstituteExpenseModel.find()
        .populate('category', 'name')
        .populate('project', 'funding_agency project_title project_type')
        .lean();

      res.status(200).send(instituteExpenses);
      return
    }

    const expenses = await ExpenseModel.find()
      .populate<{ reimbursedID: { _id: ObjectId; title: string; paidStatus: boolean } }>({ path: 'reimbursedID', select: 'title paidStatus' })
      .populate<{ settled: { _id: Schema.Types.ObjectId, type: string } }>('settled')
      .populate('category paidBy')
      .lean();

    res.status(200).send(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/passbook', async (req: Request, res: Response) => {
  const { type } = req.query;

  try {
    const expenses = await ExpenseModel.find({ settled: type })
      .populate<{ reimbursedID: { _id: ObjectId; title: string; paidStatus: boolean } }>({ path: 'reimbursedID', select: 'title paidStatus' })
      .populate('category paidBy')
      .lean();

    res.status(200).send(expenses);
  } catch (error) {
    console.error('Error fetching passbook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/settle', async (req: Request, res: Response) => {
  try {
    const { ids, type, amount, remarks } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Invalid or empty ids array' });
      return;
    }

    if (!VALID_SETTLED_STATUS.includes(type)) {
      res.status(400).json({
        message: `Invalid settled status. Must be one of: ${VALID_SETTLED_STATUS.join(', ')}`,
      });
      return;
    }

    const accountEntry = await new AccountModel({
      amount,
      type,
      remarks: (remarks as String).length ? remarks : 'Settled Expenses',
      credited: false,
    }).save();

    const result = await ExpenseModel.updateMany(
      { _id: { $in: ids } },
      { settled: accountEntry._id }
    );

    res.status(200).json({
      message: 'Expenses settled successfully',
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error settling expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/settle/:memberId', async (req: Request, res: Response) => {
  const { memberId } = req.params;
  const { settlementType, remarks, amount } = req.body;

  try {
    if (!['Current', 'Savings'].includes(settlementType)) {
      res.status(400).json({ message: 'Invalid settlement type' });
      return;
    }

    const member = await MemberModel.findById(memberId)

    if (!member) {
      res.status(404).send({ message: "Invalid member id" })
      return
    }

    const accountEntry = new AccountModel({
      amount,
      type: settlementType,
      remarks: remarks.length ? remarks : `Settled expenses for ${member.name}`,
      credited: false,
    });

    await accountEntry.save();

    const result = await ExpenseModel.updateMany(
      { paidBy: memberId, settled: null },
      { settled: accountEntry._id }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Settled expenses for member' });
    } else {
      res.status(404).json({ message: 'No unsettled expenses found for member' });
    }
  } catch (error) {
    console.error('Error settling member expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/member-expenses', async (req: Request, res: Response) => {
  try {
    const expenses = await ExpenseModel.find()
      .populate<{ paidBy: { _id: Schema.Types.ObjectId, name: string } }>('paidBy')
      .populate<{ settled: { _id: Schema.Types.ObjectId, type: string } }>('settled')
      .lean();

    const memberExpenses: Record<string, MemberExpenseSummary> = {};

    expenses.filter(expense => expense.paidBy).forEach(expense => {
      const memberName = expense.paidBy.name;

      if (!memberExpenses[memberName]) {
        memberExpenses[memberName] = {
          memberId: expense.paidBy._id as ObjectId,
          memberName,
          totalPaid: 0,
          totalSettled: 0,
          totalDue: 0,
        };
      }

      memberExpenses[memberName].totalPaid += expense.amount;

      if (expense.settled && (expense.settled.type === 'Current' || expense.settled.type === 'Savings')) {
        memberExpenses[memberName].totalSettled += expense.amount;
      } else {
        memberExpenses[memberName].totalDue += expense.amount;
      }
    });

    const result: MemberExpenseSummary[] = Object.values(memberExpenses);

    res.json(result);
  } catch (error) {
    console.error('Error fetching member expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const expenseData = req.body as ExpenseRequest;

  const { type } = req.query

  try {
    if (type !== 'Institute' && !await validateCategory(expenseData.category)) {
      res.status(400).json({ message: 'Invalid category ID' });
      return;
    }

    const updatedExpense = type === 'Institute' ? await InstituteExpenseModel.findByIdAndUpdate(
      id,
      {
        ...expenseData,
        updatedAt: new Date(),
      },
      { new: true }
    ) : await ExpenseModel.findByIdAndUpdate(
      id,
      {
        ...expenseData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedExpense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    res.status(200).send();
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {

    if ( req.query.type === 'Institute') {
      await InstituteExpenseModel.findByIdAndDelete(id)
      res.status(204).send()
      return
    }

    const expenseToBeDeleted = await ExpenseModel.findById(id).populate<{ reimbursedID: { _id: ObjectId; paidStatus: boolean } }>({ path: 'reimbursedID', select: 'paidStatus' })

    if (expenseToBeDeleted?.reimbursedID.paidStatus) {
      res.status(400).json({ message: 'Expense cannot be deleted. The reimbursement has been marked paid' });
      return;
    }

    if (!expenseToBeDeleted) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    if (expenseToBeDeleted.paidBy) {
      await AccountModel.findByIdAndDelete(expenseToBeDeleted.paidBy)
    }

    if (expenseToBeDeleted.reimbursedID) {
      const reimbursement = await ReimbursementModel.findById(expenseToBeDeleted.reimbursedID._id)
      reimbursement!.expenses = reimbursement!.expenses.filter(expense => expense.toString() !== id)
      if (reimbursement!.expenses.length === 0) {
        await ReimbursementModel.findByIdAndDelete(expenseToBeDeleted.reimbursedID._id)
      }
      else {
        reimbursement!.totalAmount -= expenseToBeDeleted.amount
        await reimbursement?.save()
      }
    }

    await ExpenseModel.findByIdAndDelete(id)

    res.status(204).send()
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
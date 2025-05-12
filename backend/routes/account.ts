import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { AccountModel } from '../models/account';
import { ObjectId } from 'mongoose';

const router = express.Router();

router.use(authenticateToken);

router.get('/totals', async (req, res) => {
    try {
        const totals = await AccountModel.aggregate([
            {
                $group: {
                    _id: "$type", 
                    totalCredited: {
                        $sum: {
                            $cond: [{ $eq: ["$credited", true] }, "$amount", 0]
                        }
                    },
                    totalDebited: {
                        $sum: {
                            $cond: [{ $eq: ["$credited", false] }, "$amount", 0]
                        }
                    },
                    balance: { $sum: "$amount" } 
                }
            },
            {
                $addFields: {
                    order: {
                        $indexOfArray: [
                            ["Savings", "Current", "PDA", "PDF"], "$_id"
                        ]
                    }
                }
            },
            {
                $sort: { order: 1 } 
            },
            {
                $project: { order: 0 } 
            }
        ]);

        res.status(200).json(totals.length > 0 ? totals : []);
    } catch (error) {
        console.error('Error fetching totals:', error);
        res.status(500).json({ error: 'An error occurred while fetching totals.' });
    }
});


router.get('/:type', async (req: Request, res: Response) => {

    const { type } = req.params

    if (!type) {
        res.status(400).send("Mention the account type")
        return
    }

    try {
        const account = await AccountModel.find({ type }).populate('transfer');
        res.status(200).json(account);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching account: ' + (error as Error).message });
    }
});

router.post('/entry', async (req: Request, res: Response) => {
    try {
        const { type, amount, credited, remarks } = req.body

        const entry = new AccountModel({
            type,
            amount,
            credited,
            remarks
        })

        const newEntry = await entry.save()
        res.status(200).json(newEntry);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching account: ' + (error as Error).message });
    }
});

router.post('/transfer', async (req: Request, res: Response) => {
    try {
        const { transferDetails } : { transferDetails : { [key : string] : number } } = req.body;
        
        const transactions = Object.entries(transferDetails).map(async ([accountEntryId, transferAmount ], i) => {
            
            const currentAccountEntry = await AccountModel.findById(accountEntryId)

            //If there is a transfer already add to it.
            if (currentAccountEntry!.transfer){
                const savingsEntry = await AccountModel.findById(currentAccountEntry!.transfer)

                savingsEntry!.amount += transferAmount
                savingsEntry!.remarks =  `Transferred ${savingsEntry!.amount} from Current`
    
                await savingsEntry!.save();
    
                await AccountModel.findByIdAndUpdate(accountEntryId, {
                    transfer: savingsEntry!._id
                });
    
                return { accountEntryId, savingsEntry };
            }
            else{
                const savingsEntry = new AccountModel({
                    type: 'Savings',
                    amount: transferAmount,
                    credited: true,
                    remarks: `Transferred ${transferAmount} from Current`
                });
    
                await savingsEntry.save();
    
                await AccountModel.findByIdAndUpdate(accountEntryId, {
                    transfer: savingsEntry._id
                });
    
                return { accountEntryId, savingsEntry };
            }
        });

        const results = await Promise.all(transactions);
        res.status(200).json(results);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'An error occurred while processing the transaction.' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const account = await AccountModel.findById(id);

        if (!account) {
            res.status(404).json({ message: 'Account not found' });
            return
        }

        if (account.transferable < 0) {
            const deletedAccount = await AccountModel.findByIdAndDelete(id);
            await AccountModel.findByIdAndDelete(deletedAccount!.transfer);
            res.status(200).json({ message: 'Account deleted successfully' });
            return
        }

        res.status(400).json({ message: 'Cannot delete non transfer account entry' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account' });
    }
});


export default router;

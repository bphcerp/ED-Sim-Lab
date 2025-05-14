import express, { Request, Response } from 'express';
import { ReimbursementModel } from '../models/reimburse';
import { ExpenseModel, InstituteExpenseModel } from '../models/expense';
import { authenticateToken } from '../middleware/authenticateToken';
import { Readable } from "stream";
import mongoose, { InferSchemaType, ObjectId } from 'mongoose';
import { ProjectModel } from '../models/project';
import { AccountModel } from '../models/account';
import multer from 'multer';
import { getCurrentIndex } from './project';
import { Workbook } from 'exceljs';

const router = express.Router();
const conn = mongoose.connection;
export let gfs: mongoose.mongo.GridFSBucket;

router.use(authenticateToken);

conn.once("open", () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db!, {
        bucketName: "references"
    });
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

type Project = mongoose.Document & typeof ProjectModel extends mongoose.Model<infer T> ? T : never;

router.get('/:id/reference', async (req: Request, res: Response) => {
    try {
        const reimbursement = await ReimbursementModel.findById(req.params.id);

        if (!reimbursement) {
            console.error(`Reimbursement not found for ID: ${req.params.id}`);
            res.status(404).json({ message: 'Reimbursement not found' });
            return;
        }

        if (!reimbursement.reference_id) {
            console.error(`No reference document found for reimbursement ID: ${req.params.id}`);
            res.status(404).json({ message: 'Reference document not found for this reimbursement' });
            return;
        }

        const fileId = reimbursement.reference_id;


        const downloadStream = gfs.openDownloadStream(fileId);

        const filename = `reference_${reimbursement.title}`.replace(/\s/g, '_')


        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename=${filename}`);


        downloadStream.on('error', (error) => {
            console.error(`Error fetching file: ${error.message}`);
            res.status(404).send('File not found');
            return;
        });


        downloadStream.pipe(res).on('finish', () => {
            console.log('File streamed successfully.');
        });

        return;
    } catch (error) {
        console.error(`Error fetching reference document for reimbursement ID ${req.params.id}: ${(error as Error).message}`);
        res.status(500).json({ message: 'Error fetching reference document', error: (error as Error).message });
        return;
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const reimbursements = await ReimbursementModel.find().sort({ paidStatus: 1, createdAt: -1 }).populate('project expenses');
        res.status(200).json(reimbursements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reimbursements: ' + (error as Error).message });
    }
});

router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params
        const { head, index, all, exportData } = req.query
        const filter = { project: projectId, ...(all === "undefined" ? { projectHead: head } : {}), ...(index !== "undefined" ? { year_or_installment: index } : {}) }
        const reimbursements = await ReimbursementModel.find(filter).populate('expenses').sort({ createdAt: -1 }).lean();
        const instituteExpenses = await InstituteExpenseModel.find(filter).sort({ createdAt: -1 }).lean()

        if (exportData) {
            const workbook = new Workbook()

            workbook.creator = 'Nano Scale Device Lab, BITS Hyderabad'
            workbook.lastModifiedBy = 'Nano Scale Device Lab, BITS Hyderabad'
            workbook.created = new Date()
            workbook.modified = new Date()

            const project = (reimbursements[0].project as unknown as Project) ?? (instituteExpenses[0].project as unknown as Project)

            const sheet = workbook.addWorksheet(project.project_title)

            sheet.columns = [
                { header: 'S.No.', key: 'sno', width: 10 },
                { header: 'Submitted On', key: 'createdAt', width: 20 },
                { header: 'Title', key: 'title', width: 30 },
                { header: 'Project Head', key: 'projectHead', width: 25 },
                { header: 'Type', key: 'expenseType', width: 25 },
                { header: project.project_type === 'invoice' ? 'Installment' : 'Year', key: 'year_or_installment', width: 20 },
                { header: 'Amount', key: 'totalAmount', width: 15 },
            ]

            sheet.spliceRows(1, 0, [])
            sheet.spliceRows(1, 0, [])

            sheet.mergeCells('A1:G1');
            const titleCell = sheet.getCell('A1');
            titleCell.value = project.funding_agency
            titleCell.font = { bold: true, size: 20, name: 'Arial' }
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

            sheet.mergeCells('A2:C2');
            const projectIdCell = sheet.getCell('A2');
            projectIdCell.value = `Project ID: ${project.project_id}`
            projectIdCell.font = { bold: true, size: 20, name: 'Arial' }
            projectIdCell.alignment = { horizontal: 'center' }

            sheet.mergeCells('D2:G2');
            const projectTitleCell = sheet.getCell('D2');
            projectTitleCell.value = `Project Title: ${project.project_title}`
            projectTitleCell.font = { bold: true, size: 20, name: 'Arial' }
            projectTitleCell.alignment = { horizontal: 'center' }

            sheet.getRow(1).height = 70
            sheet.getRow(2).font = { bold: true, size: 12 }
            sheet.getRow(2).height = 50
            sheet.getRow(3).font = { bold: true, size: 12 }
            sheet.getRow(3).height = 25

            sheet.getColumn('createdAt').numFmt = 'dd-mm-yyyy'
            sheet.getColumn('totalAmount').numFmt = '"₹" #,##0.00'

            reimbursements.map((reimbursement, sno) => {
                sheet.addRow({ sno: sno + 1, ...reimbursement, expenseType: "Reimbursement", year_or_installment: reimbursement.year_or_installment + 1 })
            })

            const serialAfterReimbursement = reimbursements.length

            instituteExpenses.map((expense, sno) => {
                sheet.addRow({ sno: serialAfterReimbursement + sno + 1, ...expense, expenseType: "Institute Expense", totalAmount: expense.amount, title: expense.expenseReason, year_or_installment: expense.year_or_installment + 1 })
            })

            const reimbursementTotal = reimbursements.reduce((acc, reimbursement) => acc + reimbursement.totalAmount, 0);
            const instituteExpenseTotal = instituteExpenses.reduce((acc, reimbursement) => acc + reimbursement.amount, 0);
            const totalAmount = reimbursementTotal + instituteExpenseTotal

            sheet.addRow({ year_or_installment: 'Total Amount', totalAmount })
            sheet.getRow(sheet.rowCount).font = { bold: true, size: 12 }

            const buffer = await workbook.xlsx.writeBuffer();

            res.setHeader('Content-Disposition', 'attachment; filename=reimbursements.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer)
            return
        }

        res.status(200).json({ reimbursements, instituteExpenses });
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Error fetching reimbursements: ' + (error as Error).message });
    }
});

router.post('/paid', async (req: Request, res: Response) => {
    try {
        const { reimbursementIds } = req.body;

        if (!Array.isArray(reimbursementIds) || reimbursementIds.length === 0) {
            res.status(400).json({ message: 'Invalid input. Please provide an array of reimbursement IDs.' });
            return;
        }

        let reimbursements = await ReimbursementModel.find({ _id: { $in: reimbursementIds } })
            .populate<{ expenses: { amount: number, settled: { type: String } }[] }>({
                path: 'expenses',
                populate: {
                    path: 'settled',
                    select: 'type'
                }
            });

        reimbursements = reimbursements.filter(reimbursement => !reimbursement.paidStatus)


        if (!reimbursements || reimbursements.length === 0) {
            res.status(404).json({ message: 'No valid reimbursements found to be marked paid.' });
            return;
        }

        let totalTransferableAmount = 0, amount = 0;
        reimbursements.forEach(reimbursement => {
            amount += reimbursement.totalAmount
            reimbursement.expenses.forEach(expense => {

                if (expense.settled?.type === "Savings") {
                    totalTransferableAmount += expense.amount;
                }
            });
        });

        const acc_entry = await new AccountModel({
            amount,
            type: "Current",
            remarks: `Reimbursement money for ${reimbursements.map(item => item.title).join(",")}`,
            credited: true,
            transferable: totalTransferableAmount
        }).save();

        await ReimbursementModel.updateMany(
            { _id: { $in: reimbursementIds } },
            { paidStatus: true, acc_entry: acc_entry._id }
        );

        res.status(200).json({ message: 'Reimbursements updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating reimbursements: ' + (error as Error).message });
    }
});

router.post('/unpaid', async (req: Request, res: Response) => {
    try {
        const { reimbursementIds } = req.body;

        if (!Array.isArray(reimbursementIds) || reimbursementIds.length === 0) {
            res.status(400).json({ message: 'Invalid input. Please provide an array of reimbursement IDs.' });
            return;
        }

        let reimbursements = await ReimbursementModel.find({ _id: { $in: reimbursementIds } })
            .populate<{ expenses: { amount: number, settled: { type: String } }[] }>({
                path: 'expenses',
                populate: {
                    path: 'settled',
                    select: 'type'
                }
            })
            .populate<{ acc_entry : { transfer : ObjectId } }>('acc_entry')

        reimbursements = reimbursements.filter(reimbursement => reimbursement.paidStatus)


        if (!reimbursements || reimbursements.length === 0) {
            res.status(404).json({ message: 'No valid reimbursements found to be marked unpaid.' });
            return;
        }

        for (const reimbursement of reimbursements) {
            // First, delete if any transfer was made with the reimbursement money
            if (!reimbursement.acc_entry) continue;
            if (reimbursement.acc_entry.transfer) {
                await AccountModel.findByIdAndDelete(reimbursement.acc_entry.transfer);
            }
        
            // Then, remove the reimbursement amount from the account entry and update the remarks
            function removeFirstOccurrence(searchString: string, wordToRemove: string) {
                const prefix = "Reimbursement money for ";
                searchString = searchString.slice(prefix.length);
                let arr = searchString.split(",");
                let index = arr.indexOf(wordToRemove);
                if (index !== -1) {
                    arr.splice(index, 1);
                }
                return prefix + arr.join(",");
            }
        
            const acc_entry = await AccountModel.findById(reimbursement.acc_entry);
            if (!acc_entry) continue;
        
            acc_entry.amount -= reimbursement.totalAmount;
        
            // Subtract the transferable
            for (const expense of reimbursement.expenses) {
                if (expense.settled?.type === "Savings") {
                    acc_entry.transferable -= expense.amount;
                }
            }
        
            acc_entry.remarks = removeFirstOccurrence(acc_entry.remarks!, reimbursement.title);
            if ( acc_entry.remarks === "Reimbursement money for "){
                await AccountModel.findByIdAndDelete(acc_entry._id)
                continue
            }
            await acc_entry.save();
        }
        

        await ReimbursementModel.updateMany(
            { _id: { $in: reimbursementIds } },
            { paidStatus: false, acc_entry : null }
        );

        res.status(200).json({ message: 'Reimbursements updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating reimbursements: ' + (error as Error).message });
    }
});



router.post('/', upload.single('referenceDocument'), async (req: Request, res: Response) => {
    try {
        const { projectId, projectHead, totalAmount, title, description } = req.body;

        const expenseIds = JSON.parse(req.body.expenseIds)

        let referenceId: mongoose.Types.ObjectId | null = null

        if (req.file) {
            const readableStream = new Readable();
            readableStream.push(req.file.buffer);
            readableStream.push(null);

            const uploadStream = gfs.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype || 'application/octet-stream'
            });

            await new Promise<void>((resolve, reject) => {
                readableStream.pipe(uploadStream)
                    .on("error", (err) => reject(err))
                    .on("finish", () => {
                        referenceId = uploadStream.id;
                        resolve();
                    });
            });
        }

        const project = await ProjectModel.findById(projectId)

        if (!project) {
            res.status(404).send("Project ID not found!")
            return
        }


        const reimbursement = new ReimbursementModel({
            project: projectId,
            expenses: expenseIds,
            projectHead,
            totalAmount,
            title,
            description,
            submittedAt: new Date(),
            reference_id: referenceId,
            year_or_installment: getCurrentIndex(project)
        });

        await reimbursement.save();

        await ExpenseModel.updateMany(
            { _id: { $in: expenseIds } },
            { reimbursedID: reimbursement._id }
        );

        await reimbursement.populate('project expenses');

        res.status(201).json(reimbursement);
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: 'Error creating reimbursement: ' + (error as Error).message });
    }
});

router.post('/:id/reference', upload.single('referenceDocument'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        if (!req.file) {
            res.status(400).send({ message: "Please upload a file!" })
            return
        }

        const reimbursement = await ReimbursementModel.findById(id)

        if (!reimbursement) {
            res.status(404).send({ message: "Reimbursement not found!" })
            return
        }

        let referenceId: mongoose.Types.ObjectId | null = null

        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        const uploadStream = gfs.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype || 'application/octet-stream'
        });

        await new Promise<void>((resolve, reject) => {
            readableStream.pipe(uploadStream)
                .on("error", (err) => reject(err))
                .on("finish", () => {
                    referenceId = uploadStream.id;
                    resolve();
                });
        });

        reimbursement.reference_id = referenceId
        await reimbursement.save()
        res.send({ message: "Reference upload sucessful!" })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: `Error Occured : ${(err as Error).message}` })
    }
})

router.put('/:id', upload.single('referenceDocument'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { project, projectHead, totalAmount, title, description } = req.body;

    const expenses = JSON.parse(req.body.expenses)
    const removedExpenses = JSON.parse(req.body.removedExpenses)

    try {

        let reimbursementToBeEdited = await ReimbursementModel.findById(id)

        if (!reimbursementToBeEdited) {
            res.status(404).json({ message: 'Reimbursement not found' });
            return;
        }

        let referenceId: mongoose.Types.ObjectId | null = null

        if (req.file) {
            const readableStream = new Readable();
            readableStream.push(req.file.buffer);
            readableStream.push(null);

            const uploadStream = gfs.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype || 'application/octet-stream'
            });

            await new Promise<void>((resolve, reject) => {
                readableStream.pipe(uploadStream)
                    .on("error", (err) => reject(err))
                    .on("finish", () => {
                        referenceId = uploadStream.id;
                        resolve();
                    });
            });

            if (reimbursementToBeEdited?.reference_id) {
                await gfs.delete(reimbursementToBeEdited.reference_id);
            }
        }

        await ExpenseModel.updateMany(
            { _id: { $in: removedExpenses } },
            { $set: { reimbursedID: null } }
        )

        await ReimbursementModel.updateOne({ _id: id }, {
            $set: { project, projectHead, title, description, totalAmount, expenses, reference_id: referenceId ?? reimbursementToBeEdited.reference_id }
        })

        res.status(200).json();
    } catch (error) {
        console.error('Error updating reimbursement:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const deletedReimbursement = await ReimbursementModel.findByIdAndDelete(id);

        if (!deletedReimbursement) {
            res.status(404).json({ message: 'Reimbursement not found' });
            return;
        }

        const referenceId = deletedReimbursement.reference_id;

        if (referenceId) {
            await gfs.delete(referenceId);
        }

        await ExpenseModel.updateMany({ reimbursedID: id }, { reimbursedID: null });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting reimbursement:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


export default router;
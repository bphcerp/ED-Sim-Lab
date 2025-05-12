import express, {Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser'

import userRoutes from './routes/user';
import projectRoutes from './routes/project';
import expenseRoutes from './routes/expense';
import categoryRoutes from './routes/category';
import reimburseRoutes from './routes/reimburse';
import memberRoutes from './routes/member';
import accountRoutes from './routes/account';
import { authenticateToken } from './middleware/authenticateToken';
import {ExpenseModel} from "./models/expense";
import {ProjectModel} from "./models/project";
import morgan from 'morgan'

dotenv.config();

const interval = 30000;

function keepAlive() {
  fetch(process.env.BASE_URL!)
}

setInterval(keepAlive, interval)

const app = express()
const PORT = process.env.PORT!

mongoose.connect(process.env.DB_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(morgan('combined'))

app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL!,
  exposedHeaders: ['Content-Disposition'],
  credentials: true // Allow cookies to be sent
}))

app.use('/api/user', userRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/reimburse', reimburseRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/account', accountRoutes);

app.use(express.static("public"))

app.get('/api', (req: Request, res: Response) => {
  res.send('Welcome to LAMBDA LAB ERP API')
});

app.get('/api/check-auth',authenticateToken, (req: Request, res: Response) => {
  res.send('Welcome to LAMBDA LAB ERP API (Authenticated)')
});

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const totalDueQuery = ExpenseModel.aggregate([
      { $match: { reimbursedID: null } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);

    const unsettledQuery = ExpenseModel.aggregate([
      { $match: { settled: null } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);

    const grandTotalQuery = ProjectModel.aggregate([
      { $group: { _id: null, totalSum: { $sum: '$total_amount' } } },
    ]);

    const [totalDueResult, unsettledResult, grandTotalResult] = await Promise.all([
      totalDueQuery,
      unsettledQuery,
      grandTotalQuery,
    ]);

    const totalDue = totalDueResult.length > 0 ? totalDueResult[0].totalAmount : 0;
    const totalUnsettled = unsettledResult.length > 0 ? unsettledResult[0].totalAmount : 0;
    const grandTotal = grandTotalResult.length > 0 ? grandTotalResult[0].totalSum : 0;

    res.status(200).json({
      total_due: totalDue,
      total_unsettled: totalUnsettled,
      grand_total: grandTotal,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
});

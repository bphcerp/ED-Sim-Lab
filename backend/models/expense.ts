import mongoose, { Schema } from 'mongoose';

const expenseSchema = new Schema({
  expenseReason: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
  amount: { type: Number, required: true },
  reimbursedID: { type: mongoose.Schema.Types.ObjectId, ref: 'reimbursements', default: null },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'members'},
  settled: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  reference_id: { type: Schema.Types.ObjectId, ref: 'references.files' },
  directExpense : { type: Schema.Types.Boolean, default : false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  description: { type: String, default: null }
});

expenseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const ExpenseModel = mongoose.model('Expense', expenseSchema);

const instituteExpenseSchema = new Schema({
  expenseReason: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectHead: { type: String, required: true },
  amount: { type: Number, required: true },
  year_or_installment : { type : Number , required : true},
  overheadPercentage: { type: Number, default:0, required: true },
  reference_id: { type: Schema.Types.ObjectId, ref: 'references.files' },
  pd_ref: { type: Schema.Types.ObjectId, ref: 'account' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

instituteExpenseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const InstituteExpenseModel = mongoose.model('InstituteExpense', instituteExpenseSchema);
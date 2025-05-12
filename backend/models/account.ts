import mongoose, { Schema } from 'mongoose';

const AccountSchema = new Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Current', 'Savings', 'PDA', 'PDF', null], required: true },
  remarks: { type: String },
  credited: { type: Boolean, required: true },
  transferable: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  transfer: { type: Schema.Types.ObjectId, ref: 'account', default:null }
});

export const AccountModel = mongoose.model('account', AccountSchema);

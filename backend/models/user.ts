import mongoose, { Document, Schema } from 'mongoose';

const userSchema = new Schema({
	name: { type: String },
	email: { type: String, required: true },
	pwd: { type: String }
});


export const UserModel = mongoose.model('User', userSchema);

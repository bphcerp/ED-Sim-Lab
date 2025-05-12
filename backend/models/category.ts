import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
});

export const CategoryModel = mongoose.model('categories', CategorySchema);
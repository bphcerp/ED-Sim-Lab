import mongoose, { Schema } from 'mongoose';

const MemberSchema = new Schema({
    institute_id : {type : String, unique : true, required : true},
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true}
});

export const MemberModel = mongoose.model('members', MemberSchema);
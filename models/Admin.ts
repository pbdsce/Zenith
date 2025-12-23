import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdmin extends Document {
    uid: string;
    name: string;
}

const AdminSchema: Schema = new Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
}, {
    timestamps: true,
});

const Admin: Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;

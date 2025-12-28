import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdmin extends Document {
    uid: string;
    email: string;
    name: string;
    role: 'admin';
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}

const AdminSchema: Schema = new Schema({
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, default: 'admin' },
    permissions: [{ type: String }],
    lastLoginAt: { type: Date },
}, {
    timestamps: true,
});

if (mongoose.models.Admin) {
    delete mongoose.models.Admin;
}

const Admin: Model<IAdmin> = mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;

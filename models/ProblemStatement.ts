import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProblemStatement extends Document {
    id: string;
    uid: string;
    title: string;
    description: string;
}

const ProblemStatementSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    uid: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
}, {
    timestamps: true,
});

const ProblemStatement: Model<IProblemStatement> = mongoose.models.ProblemStatement || mongoose.model<IProblemStatement>('ProblemStatement', ProblemStatementSchema);

export default ProblemStatement;

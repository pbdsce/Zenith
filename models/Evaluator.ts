import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvaluator extends Document {
    uid: string;
    name: string;
    PS: string[];
}

const EvaluatorSchema: Schema = new Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    PS: [{ type: String }],
}, {
    timestamps: true,
});

const Evaluator: Model<IEvaluator> = mongoose.models.Evaluator || mongoose.model<IEvaluator>('Evaluator', EvaluatorSchema);

export default Evaluator;

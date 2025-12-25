import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
    teamCode: string;
    teamLead: string;
    islooking: boolean;
    teamMembers: string[];
    teamStatus: 'submitted' | 'pending' | 'withdrawn' | 'rsvped';
    appliedFor: string;
    isEvaluated: boolean;
    evaluatorId?: string;
    scores?: {
        tech: number;
        ux: number;
        presentation: number;
        total: number;
    };
    comments?: string;
    isShortlisted: boolean;
    videoURL?: string;
    anyOtherLinks?: string;
}

const TeamSchema: Schema = new Schema({
    teamCode: { type: String, required: true, unique: true },
    teamLead: { type: String, required: true }, // Store Firebase UID
    islooking: { type: Boolean, default: true },
    teamMembers: [{ type: String }],
    teamStatus: {
        type: String,
        enum: ['submitted', 'pending', 'withdrawn', 'rsvped'],
        default: 'pending'
    },
    appliedFor: { type: String },
    isEvaluated: { type: Boolean, default: false },
    evaluatorId: { type: String },
    scores: {
        tech: { type: Number },
        ux: { type: Number },
        presentation: { type: Number },
        total: { type: Number }
    },
    comments: { type: String },
    isShortlisted: { type: Boolean, default: false },
    videoURL: { type: String },
    anyOtherLinks: { type: String },
}, {
    timestamps: true,
});

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;

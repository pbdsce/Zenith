import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
    teamCode: string;
    teamLead: string;
    islooking: boolean;
    teamMembers: string[];
    teamStatus: 'submitted' | 'pending' | 'withdrawn';
    RSVP: boolean;
    appliedFor: string;
    isEvaluated: boolean;
    scores?: {
        tech: number;
        ux: number;
        presentation: number;
        total: number;
    };
    comments?: string;
    isShortlisted: boolean;
}

const TeamSchema: Schema = new Schema({
    teamCode: { type: String, required: true, unique: true },
    teamLead: { type: String, required: true }, // Store Firebase UID
    islooking: { type: Boolean, default: true },
    teamMembers: [{ type: String }],
    teamStatus: {
        type: String,
        enum: ['submitted', 'pending', 'withdrawn'],
        default: 'pending'
    },
    RSVP: { type: Boolean, default: false },
    appliedFor: { type: String },
    isEvaluated: { type: Boolean, default: false },
    scores: {
        tech: { type: Number },
        ux: { type: Number },
        presentation: { type: Number },
        total: { type: Number }
    },
    comments: { type: String },
    isShortlisted: { type: Boolean, default: false }
}, {
    timestamps: true,
});

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;

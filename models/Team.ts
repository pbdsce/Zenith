import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeamMember {
  uid: string;
  joinedAt: Date;
  role: 'Team Lead' | 'Member';
}

export interface IMemberRSVP {
  uid: string;
  name: string;
  rsvpStatus: 'confirmed' | 'declined';
  rsvpedAt: Date;
}

export interface IScores {
  tech: number;
  ux: number;
  presentation: number;
  total: number;
}

export type TeamStatus = 'pending' | 'submitted' | 'withdrawn' | 'shortlisted' | 'rsvped' | 'rsvp_declined';

export interface ITeam extends Document {
  teamCode: string;
  teamName: string;
  teamLead: string;
  isLooking: boolean;
  teamMembers: ITeamMember[];
  memberCount: number;
  teamStatus: TeamStatus;
  appliedFor?: string;
  
  videoURL?: string;
  submissionPDF?: string;
  anyOtherLink?: string;
  
  isEvaluated: boolean;
  evaluator?: string;
  scores?: IScores;
  comments?: string;
  
  isShortlisted: boolean;
  memberRSVPs: IMemberRSVP[];
  
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  evaluatedAt?: Date;
  shortlistedAt?: Date;
  rsvpCompletedAt?: Date;
}

const TeamMemberSchema = new Schema({
  uid: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['Team Lead', 'Member'], default: 'Member' },
}, { _id: false });

const MemberRSVPSchema = new Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },
  rsvpStatus: { type: String, enum: ['confirmed', 'declined'], required: true },
  rsvpedAt: { type: Date, default: Date.now },
}, { _id: false });

const ScoresSchema = new Schema({
  tech: { type: Number, min: 0, max: 100 },
  ux: { type: Number, min: 0, max: 100 },
  presentation: { type: Number, min: 0, max: 100 },
  total: { type: Number, min: 0, max: 300 },
}, { _id: false });

const TeamSchema: Schema = new Schema({
  teamCode: { 
    type: String, 
    required: true, 
    unique: true,
    index: true,
  },
  teamName: { 
    type: String, 
    required: true, 
    unique: true,
    index: true,
  },
  teamLead: { 
    type: String, 
    required: true,
    index: true,
  },
  isLooking: { 
    type: Boolean, 
    default: true,
    index: true,
  },
  teamMembers: [TeamMemberSchema],
  memberCount: { 
    type: Number, 
    default: 1,
  },
  teamStatus: {
    type: String,
    enum: ['pending', 'submitted', 'withdrawn', 'shortlisted', 'rsvped', 'rsvp_declined'],
    default: 'pending',
    index: true,
  },
  appliedFor: { 
    type: String,
    index: true,
  },
  
  videoURL: { type: String },
  submissionPDF: { type: String },
  anyOtherLink: { type: String },
  
  // Evaluation
  isEvaluated: { 
    type: Boolean, 
    default: false,
    index: true,
  },
  evaluator: { 
    type: String,
    index: true,
  },
  scores: ScoresSchema,
  comments: { type: String },
  
  isShortlisted: { 
    type: Boolean, 
    default: false,
    index: true,
  },
  memberRSVPs: [MemberRSVPSchema],
  
  submittedAt: { type: Date },
  evaluatedAt: { type: Date },
  shortlistedAt: { type: Date },
  rsvpCompletedAt: { type: Date },
}, {
  timestamps: true,
});

TeamSchema.index({ 'scores.total': -1 });
TeamSchema.index({ 'memberRSVPs.uid': 1 });
TeamSchema.index({ createdAt: -1 });

TeamSchema.pre('save', async function (this: ITeam) {
  this.memberCount = this.teamMembers.length;
});

if (mongoose.models.Team) {
  delete mongoose.models.Team;
}

const Team: Model<ITeam> = mongoose.model<ITeam>('Team', TeamSchema);

export default Team;

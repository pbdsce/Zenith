import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeamJoinRequest extends Document {
  teamCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'request' | 'invite';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  requestedAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
}

const TeamJoinRequestSchema: Schema = new Schema({
  teamCode: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['request', 'invite'],
    default: 'request',
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
    index: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
  respondedBy: {
    type: String,
  },
}, {
  timestamps: true,
});

TeamJoinRequestSchema.index({ teamCode: 1, userId: 1, status: 1, type: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

if (mongoose.models.TeamJoinRequest) {
  delete mongoose.models.TeamJoinRequest;
}

const TeamJoinRequest: Model<ITeamJoinRequest> = mongoose.model<ITeamJoinRequest>('TeamJoinRequest', TeamJoinRequestSchema);
export default TeamJoinRequest;

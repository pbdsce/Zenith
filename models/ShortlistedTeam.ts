import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShortlistedTeam extends Document {
  teamCode: string;
  teamName: string;
  teamLead: string;
  appliedFor: string;
  memberCount: number;
  submissionPdf?: string;
  videoUrl?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShortlistedTeamSchema: Schema = new Schema(
  {
    teamCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
    },
    teamLead: {
      type: String,
      required: true,
    },
    appliedFor: {
      type: String,
    },
    memberCount: {
      type: Number,
      default: 1,
    },
    submissionPdf: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    status: {
      type: String,
      default: "shortlisted",
    },
  },
  {
    timestamps: true,
  }
);

ShortlistedTeamSchema.index({ createdAt: -1 });
ShortlistedTeamSchema.index({ status: 1 });

const ShortlistedTeam: Model<IShortlistedTeam> =
  mongoose.models.ShortlistedTeam ||
  mongoose.model<IShortlistedTeam>("ShortlistedTeam", ShortlistedTeamSchema);

export default ShortlistedTeam;

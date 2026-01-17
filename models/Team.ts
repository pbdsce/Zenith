import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamMember {
  uid: string;
  joinedAt: Date;
  role: "Team Lead" | "Member";
}

export interface IMemberRSVP {
  uid: string;
  name: string;
  rsvpStatus: "confirmed" | "declined";
  rsvpedAt: Date;
}

export interface IEvaluation {
  evaluatorId: string;
  name: string;
  tier: "strongly_accepted" | "accepted" | "borderline" | "rejected";
  comment: string;
  createdAt: Date;
}

export interface IVote {
  evaluatorId: string;
  vote: "up" | "down";
  comment?: string;
  createdAt: Date;
}

export type TeamStatus =
  | "pending"
  | "submitted"
  | "withdrawn"
  | "shortlisted"
  | "rsvped"
  | "rsvp_declined";

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
  evaluations: IEvaluation[];
  votes: IVote[];

  isShortlisted: boolean;
  memberRSVPs: IMemberRSVP[];

  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  evaluatedAt?: Date;
  shortlistedAt?: Date;
  rsvpCompletedAt?: Date;
}

const TeamMemberSchema = new Schema(
  {
    uid: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ["Team Lead", "Member"], default: "Member" },
  },
  { _id: false }
);

const MemberRSVPSchema = new Schema(
  {
    uid: { type: String, required: true },
    name: { type: String, required: true },
    rsvpStatus: {
      type: String,
      enum: ["confirmed", "declined"],
      required: true,
    },
    rsvpedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);



const TeamSchema: Schema = new Schema(
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
      enum: [
        "pending",
        "submitted",
        "withdrawn",
        "shortlisted",
        "rsvped",
        "rsvp_declined",
      ],
      default: "pending",
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
    // evaluations: stores detailed reviews by assigned evaluators
    evaluations: [
      {
        evaluatorId: { type: String, required: true },
        name: { type: String, required: true },
        tier: {
          type: String,
          enum: ["strongly_accepted", "accepted", "borderline", "rejected"],
          required: true
        },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    // votes: stores up/down votes by community evaluators
    votes: [
      {
        evaluatorId: { type: String, required: true },
        vote: { type: String, enum: ["up", "down"], required: true },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],

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
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ "evaluations.tier": 1 });
TeamSchema.index({ "memberRSVPs.uid": 1 });
TeamSchema.index({ createdAt: -1 });

TeamSchema.pre("save", async function (this: ITeam) {
  this.memberCount = this.teamMembers.length;
});

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);

export default Team;

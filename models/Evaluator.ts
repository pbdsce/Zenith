import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssignedTeam {
  teamCode: string;
  assignedAt: Date;
  isEvaluated: boolean;
}

export interface IEvaluatorStats {
  evaluationsCompleted: number;
  evaluationsPending: number;
}

export interface IEvaluator extends Document {
  uid: string;
  email: string;
  name: string;
  role: "evaluator";

  assignedTeams: IAssignedTeam[];
  assignedCount: number;
  evaluatedCount: number;

  stats: IEvaluatorStats;

  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastEvaluationAt?: Date;
}

const AssignedTeamSchema = new Schema(
  {
    teamCode: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    isEvaluated: { type: Boolean, default: false },
  },
  { _id: false }
);

const StatsSchema = new Schema(
  {
    evaluationsCompleted: { type: Number, default: 0 },
    evaluationsPending: { type: Number, default: 0 },
  },
  { _id: false }
);

const EvaluatorSchema: Schema = new Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "evaluator",
    },

    assignedTeams: [AssignedTeamSchema],
    assignedCount: {
      type: Number,
      default: 0,
    },
    evaluatedCount: {
      type: Number,
      default: 0,
    },

    stats: {
      type: StatsSchema,
      default: () => ({
        evaluationsCompleted: 0,
        evaluationsPending: 0,
      }),
    },

    lastLoginAt: { type: Date },
    lastEvaluationAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

EvaluatorSchema.index({ "assignedTeams.teamCode": 1 });

EvaluatorSchema.pre("save", async function (this: IEvaluator) {
  this.assignedCount = this.assignedTeams.length;
  this.evaluatedCount = this.assignedTeams.filter(
    (t: IAssignedTeam) => t.isEvaluated
  ).length;
  if (this.stats) {
    this.stats.evaluationsCompleted = this.evaluatedCount;
    this.stats.evaluationsPending = this.assignedCount - this.evaluatedCount;
  }
});

const Evaluator: Model<IEvaluator> =
  mongoose.models.Evaluator ||
  mongoose.model<IEvaluator>("Evaluator", EvaluatorSchema);

export default Evaluator;

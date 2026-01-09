import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    totalUsers: {
        type: Number,
        required: true,
    },
    totalTeams: {
        type: Number,
        required: true,
    },
    totalSubmissions: {
        type: Number,
        required: true,
    },
    totalEvaluated: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

export default mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    resume_link?: string;
    leetcode_profile?: string;
    github_link?: string;
    linkedin_link?: string;
    codeforces_link?: string;
    kaggle_link?: string;
    devfolio_link?: string;
    portfolio_link?: string;
    ctf_profile?: string;
    bio?: string;
    age?: number;
    organisation?: string;
    profile_picture?: string;
    isLooking: boolean;
    role: 'user' | 'admin' | 'evaluator';
}

const UserSchema: Schema = new Schema({
    uid: { type: String, required: true, unique: true }, // Firebase UID
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String }, // Optional - required for regular users during registration
    resume_link: { type: String },
    leetcode_profile: { type: String },
    github_link: { type: String },
    linkedin_link: { type: String },
    codeforces_link: { type: String },
    kaggle_link: { type: String },
    devfolio_link: { type: String },
    portfolio_link: { type: String },
    ctf_profile: { type: String },
    bio: { type: String }, // Optional - required for regular users during registration
    age: { type: Number }, // Optional - required for regular users during registration
    organisation: { type: String }, // Optional - required for regular users during registration
    profile_picture: { type: String },
    isLooking: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'evaluator'], default: 'user' }
}, {
    timestamps: true,
});

// Prevent overwrite compilation error
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

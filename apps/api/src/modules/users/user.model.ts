import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { UserRole } from '@dsa/shared';

const lastActivitySchema = new Schema(
  {
    problemId: { type: Schema.Types.ObjectId },
    topicId: { type: Schema.Types.ObjectId },
    chapterId: { type: Schema.Types.ObjectId },
    at: { type: Date },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.student,
      required: true,
    },
    lastActivity: { type: lastActivitySchema, required: false },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const UserModel = model('User', userSchema);

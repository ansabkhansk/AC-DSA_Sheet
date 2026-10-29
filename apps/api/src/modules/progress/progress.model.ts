import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { ProgressStatus } from '@dsa/shared';

const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    status: {
      type: String,
      enum: Object.values(ProgressStatus),
      required: true,
    },
    completedAt: { type: Date, required: true },
    notes: { type: String, required: false, trim: true },
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
progressSchema.index({ userId: 1, chapterId: 1 });
progressSchema.index({ userId: 1, completedAt: 1 });

export type ProgressDocument = InferSchemaType<typeof progressSchema> & {
  _id: Types.ObjectId;
};

export const UserProgressModel = model('UserProgress', progressSchema);

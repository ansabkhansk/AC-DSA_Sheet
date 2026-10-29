import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { Difficulty } from '@dsa/shared';

const resourcesSchema = new Schema(
  {
    youtube: { type: String, required: true },
    article: { type: String, required: true },
    leetcode: { type: String, required: false },
    codeforces: { type: String, required: false },
  },
  { _id: false },
);

const problemSchema = new Schema(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    difficulty: {
      type: String,
      enum: Object.values(Difficulty),
      required: true,
    },
    order: { type: Number, required: true },
    resources: { type: resourcesSchema, required: true },
  },
  { timestamps: true },
);

problemSchema.index({ topicId: 1, order: 1 });
problemSchema.index({ chapterId: 1 });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ slug: 1 }, { unique: true });

export type ProblemDocument = InferSchemaType<typeof problemSchema> & {
  _id: Types.ObjectId;
};

export const ProblemModel = model('Problem', problemSchema);

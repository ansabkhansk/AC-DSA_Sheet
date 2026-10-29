import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PlanStatus } from '@dsa/shared';

const planSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    problemIds: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: false },
    status: {
      type: String,
      enum: Object.values(PlanStatus),
      default: PlanStatus.planned,
      required: true,
    },
    note: { type: String, required: false, trim: true },
    kind: {
      type: String,
      enum: ['study', 'revision', 'generated'],
      default: 'study',
      required: true,
    },
  },
  { timestamps: true },
);

planSchema.index({ userId: 1, date: 1 });

export type PlanDocument = InferSchemaType<typeof planSchema> & {
  _id: Types.ObjectId;
};

export const StudyPlanModel = model('StudyPlan', planSchema);

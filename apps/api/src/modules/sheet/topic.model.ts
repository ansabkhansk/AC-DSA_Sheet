import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const topicSchema = new Schema(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    order: { type: Number, required: true },
  },
  { timestamps: true },
);

topicSchema.index({ chapterId: 1, order: 1 });

export type TopicDocument = InferSchemaType<typeof topicSchema> & {
  _id: Types.ObjectId;
};

export const TopicModel = model('Topic', topicSchema);

import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const chapterSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    order: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

chapterSchema.index({ slug: 1 }, { unique: true });
chapterSchema.index({ order: 1 });

export type ChapterDocument = InferSchemaType<typeof chapterSchema> & {
  _id: Types.ObjectId;
};

export const ChapterModel = model('Chapter', chapterSchema);

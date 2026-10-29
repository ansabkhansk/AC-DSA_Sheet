import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { ChapterModel } from './chapter.model.js';
import { ProblemModel } from './problem.model.js';
import { TopicModel } from './topic.model.js';

const chapterProjection = {
  title: 1,
  slug: 1,
  order: 1,
  description: 1,
} as const;

const topicProjection = {
  chapterId: 1,
  title: 1,
  slug: 1,
  order: 1,
} as const;

const problemProjection = {
  topicId: 1,
  chapterId: 1,
  title: 1,
  slug: 1,
  difficulty: 1,
  order: 1,
  resources: 1,
} as const;

function mapId<T extends { _id: mongoose.Types.ObjectId }>(doc: T) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

export async function getSheetTree() {
  const chapters = await ChapterModel.find({}, chapterProjection).sort({ order: 1 }).lean();
  const topics = await TopicModel.find({}, topicProjection).sort({ order: 1 }).lean();
  const problems = await ProblemModel.find({}, problemProjection).sort({ order: 1 }).lean();

  const topicsByChapter = new Map<string, typeof topics>();
  for (const topic of topics) {
    const key = topic.chapterId.toString();
    const list = topicsByChapter.get(key) ?? [];
    list.push(topic);
    topicsByChapter.set(key, list);
  }

  const problemsByTopic = new Map<string, typeof problems>();
  for (const problem of problems) {
    const key = problem.topicId.toString();
    const list = problemsByTopic.get(key) ?? [];
    list.push(problem);
    problemsByTopic.set(key, list);
  }

  return chapters.map((chapter) => {
    const chapterTopics = topicsByChapter.get(chapter._id.toString()) ?? [];
    return {
      ...mapId(chapter),
      topics: chapterTopics.map((topic) => ({
        ...mapId(topic),
        chapterId: topic.chapterId.toString(),
        problems: (problemsByTopic.get(topic._id.toString()) ?? []).map((problem) => ({
          ...mapId(problem),
          topicId: problem.topicId.toString(),
          chapterId: problem.chapterId.toString(),
        })),
      })),
    };
  });
}

export async function getChapterBySlug(slug: string) {
  const chapter = await ChapterModel.findOne({ slug }, chapterProjection).lean();
  if (!chapter) {
    throw new ApiError(404, 'NOT_FOUND', 'Chapter not found');
  }

  const topics = await TopicModel.find({ chapterId: chapter._id }, topicProjection)
    .sort({ order: 1 })
    .lean();
  const topicIds = topics.map((topic) => topic._id);
  const problems = await ProblemModel.find({ topicId: { $in: topicIds } }, problemProjection)
    .sort({ order: 1 })
    .lean();

  const problemsByTopic = new Map<string, typeof problems>();
  for (const problem of problems) {
    const key = problem.topicId.toString();
    const list = problemsByTopic.get(key) ?? [];
    list.push(problem);
    problemsByTopic.set(key, list);
  }

  return {
    ...mapId(chapter),
    topics: topics.map((topic) => ({
      ...mapId(topic),
      chapterId: topic.chapterId.toString(),
      problems: (problemsByTopic.get(topic._id.toString()) ?? []).map((problem) => ({
        ...mapId(problem),
        topicId: problem.topicId.toString(),
        chapterId: problem.chapterId.toString(),
      })),
    })),
  };
}

export async function listProblems(filters: { difficulty?: string; topic?: string }) {
  const query: Record<string, unknown> = {};

  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }

  if (filters.topic) {
    if (!mongoose.isValidObjectId(filters.topic)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid topic id', [
        { field: 'topic', message: 'topic must be a valid ObjectId' },
      ]);
    }
    query.topicId = new mongoose.Types.ObjectId(filters.topic);
  }

  const problems = await ProblemModel.find(query, problemProjection).sort({ order: 1 }).lean();

  return problems.map((problem) => ({
    ...mapId(problem),
    topicId: problem.topicId.toString(),
    chapterId: problem.chapterId.toString(),
  }));
}

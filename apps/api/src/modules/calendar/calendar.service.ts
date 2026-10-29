import mongoose from 'mongoose';
import {
  PlanStatus,
  REVISIT_OFFSETS_DAYS,
  type CreatePlanInput,
  type GeneratePlansInput,
  type PlanStatus as PlanStatusValue,
  type UpdatePlanInput,
} from '@dsa/shared';
import { ApiError } from '../../utils/ApiError.js';
import {
  eachDateKey,
  formatUtcDateKey,
  parseDateKeyToUtc,
  shiftDateKey,
  toDateKey,
} from '../../utils/timezone.js';
import { ChapterModel } from '../sheet/chapter.model.js';
import { ProblemModel } from '../sheet/problem.model.js';
import { TopicModel } from '../sheet/topic.model.js';
import { UserProgressModel } from '../progress/progress.model.js';
import { StudyPlanModel } from './plan.model.js';

type LeanPlan = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  title: string;
  problemIds: mongoose.Types.ObjectId[];
  topicId?: mongoose.Types.ObjectId | null;
  status: PlanStatusValue;
  note?: string | null;
  kind?: string;
};

function mapPlan(
  plan: LeanPlan,
  completedIds: Set<string>,
  todayKey: string,
): {
  id: string;
  date: string;
  title: string;
  problemIds: string[];
  topicId: string | null;
  status: PlanStatusValue;
  note: string | null;
  kind: string;
} {
  const problemIds = plan.problemIds.map((id) => id.toString());
  let status: PlanStatusValue = plan.status;

  // C9: derived status when the plan has problems; stored status otherwise.
  if (problemIds.length > 0) {
    const allDone = problemIds.every((id) => completedIds.has(id));
    if (allDone) {
      status = PlanStatus.done;
    } else if (formatUtcDateKey(plan.date) < todayKey) {
      status = PlanStatus.missed;
    } else {
      status = PlanStatus.planned;
    }
  }

  return {
    id: plan._id.toString(),
    date: formatUtcDateKey(plan.date),
    title: plan.title,
    problemIds,
    topicId: plan.topicId ? plan.topicId.toString() : null,
    status,
    note: plan.note ?? null,
    kind: plan.kind ?? 'study',
  };
}

async function assertProblemsExist(problemIds: string[]): Promise<void> {
  if (problemIds.length === 0) {
    return;
  }

  const unique = [...new Set(problemIds)];
  const objectIds = unique.map((id) => new mongoose.Types.ObjectId(id));
  const count = await ProblemModel.countDocuments({ _id: { $in: objectIds } });
  if (count !== unique.length) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'One or more problemIds do not exist', [
      { field: 'problemIds', message: 'All problemIds must refer to existing problems' },
    ]);
  }
}

async function completedSet(userId: mongoose.Types.ObjectId): Promise<Set<string>> {
  const rows = await UserProgressModel.find({ userId }).select('problemId').lean();
  return new Set(rows.map((row) => row.problemId.toString()));
}

export async function listPlans(userId: string, from: string, to: string, timeZone: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const [plans, completedIds] = await Promise.all([
    StudyPlanModel.find({
      userId: userObjectId,
      date: {
        $gte: parseDateKeyToUtc(from),
        $lte: parseDateKeyToUtc(to),
      },
    })
      .sort({ date: 1, createdAt: 1 })
      .lean(),
    completedSet(userObjectId),
  ]);

  const todayKey = toDateKey(new Date(), timeZone);
  return {
    plans: plans.map((plan) => mapPlan(plan as LeanPlan, completedIds, todayKey)),
  };
}

export async function createPlan(userId: string, input: CreatePlanInput, timeZone: string) {
  await assertProblemsExist(input.problemIds);

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const created = await StudyPlanModel.create({
    userId: userObjectId,
    date: parseDateKeyToUtc(input.date),
    title: input.title,
    problemIds: input.problemIds.map((id) => new mongoose.Types.ObjectId(id)),
    topicId: input.topicId ? new mongoose.Types.ObjectId(input.topicId) : undefined,
    note: input.note,
    status: input.status ?? PlanStatus.planned,
    kind: 'study',
  });

  const completedIds = await completedSet(userObjectId);
  return {
    plan: mapPlan(created.toObject() as LeanPlan, completedIds, toDateKey(new Date(), timeZone)),
  };
}

export async function updatePlan(
  userId: string,
  planId: string,
  input: UpdatePlanInput,
  timeZone: string,
) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const plan = await StudyPlanModel.findOne({
    _id: planId,
    userId: userObjectId,
  });

  if (!plan) {
    throw new ApiError(404, 'NOT_FOUND', 'Plan not found');
  }

  if (input.problemIds) {
    await assertProblemsExist(input.problemIds);
    plan.problemIds = input.problemIds.map((id) => new mongoose.Types.ObjectId(id));
  }
  if (input.date !== undefined) {
    plan.date = parseDateKeyToUtc(input.date);
  }
  if (input.title !== undefined) {
    plan.title = input.title;
  }
  if (input.note !== undefined) {
    plan.note = input.note ?? undefined;
  }
  if (input.topicId !== undefined) {
    plan.topicId = input.topicId ? new mongoose.Types.ObjectId(input.topicId) : undefined;
  }
  if (input.status !== undefined) {
    plan.status = input.status;
  }

  await plan.save();

  const completedIds = await completedSet(userObjectId);
  return {
    plan: mapPlan(plan.toObject() as LeanPlan, completedIds, toDateKey(new Date(), timeZone)),
  };
}

export async function deletePlan(userId: string, planId: string) {
  const result = await StudyPlanModel.deleteOne({
    _id: planId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, 'NOT_FOUND', 'Plan not found');
  }
}

async function problemsInSheetOrder() {
  const [chapters, topics, problems] = await Promise.all([
    ChapterModel.find({}).select('_id order').sort({ order: 1 }).lean(),
    TopicModel.find({}).select('_id chapterId order').sort({ order: 1 }).lean(),
    ProblemModel.find({}).select('_id topicId chapterId order title').sort({ order: 1 }).lean(),
  ]);

  const chapterOrder = new Map(chapters.map((chapter, index) => [chapter._id.toString(), index]));
  const topicOrder = new Map(topics.map((topic, index) => [topic._id.toString(), index]));

  return [...problems].sort((a, b) => {
    const chapterDiff =
      (chapterOrder.get(a.chapterId.toString()) ?? 0) -
      (chapterOrder.get(b.chapterId.toString()) ?? 0);
    if (chapterDiff !== 0) {
      return chapterDiff;
    }
    const topicDiff =
      (topicOrder.get(a.topicId.toString()) ?? 0) - (topicOrder.get(b.topicId.toString()) ?? 0);
    if (topicDiff !== 0) {
      return topicDiff;
    }
    return a.order - b.order;
  });
}

export async function generatePlans(userId: string, input: GeneratePlansInput, timeZone: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const [ordered, completedIds, existingPlans] = await Promise.all([
    problemsInSheetOrder(),
    completedSet(userObjectId),
    StudyPlanModel.find({ userId: userObjectId }).select('problemIds').lean(),
  ]);

  const alreadyPlanned = new Set<string>();
  for (const plan of existingPlans) {
    for (const id of plan.problemIds) {
      alreadyPlanned.add(id.toString());
    }
  }

  const candidates = ordered.filter((problem) => {
    const id = problem._id.toString();
    return !completedIds.has(id) && !alreadyPlanned.has(id);
  });

  const days = eachDateKey(input.startDate, input.endDate);
  const toCreate: Array<{
    userId: mongoose.Types.ObjectId;
    date: Date;
    title: string;
    problemIds: mongoose.Types.ObjectId[];
    status: PlanStatusValue;
    kind: string;
  }> = [];

  let cursor = 0;
  for (const day of days) {
    if (cursor >= candidates.length) {
      break;
    }
    const slice = candidates.slice(cursor, cursor + input.perDay);
    cursor += slice.length;
    if (slice.length === 0) {
      continue;
    }
    toCreate.push({
      userId: userObjectId,
      date: parseDateKeyToUtc(day),
      title: `Study plan (${slice.length})`,
      problemIds: slice.map((problem) => problem._id),
      status: PlanStatus.planned,
      kind: 'generated',
    });
  }

  if (toCreate.length > 0) {
    await StudyPlanModel.insertMany(toCreate);
  }

  return {
    created: toCreate.length,
    problemsScheduled: toCreate.reduce((total, plan) => total + plan.problemIds.length, 0),
    today: toDateKey(new Date(), timeZone),
  };
}

/**
 * Schedule +1 / +3 / +7 revision plans for a problem (idempotent).
 */
export async function scheduleRevisions(
  userId: string,
  problemId: string,
  problemTitle: string,
  timeZone: string,
) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const problemObjectId = new mongoose.Types.ObjectId(problemId);
  const today = toDateKey(new Date(), timeZone);

  let created = 0;

  for (const offset of REVISIT_OFFSETS_DAYS) {
    const dateKey = shiftDateKey(today, offset);
    const date = parseDateKeyToUtc(dateKey);

    const existing = await StudyPlanModel.findOne({
      userId: userObjectId,
      date,
      kind: 'revision',
      problemIds: problemObjectId,
    })
      .select('_id')
      .lean();

    if (existing) {
      continue;
    }

    await StudyPlanModel.create({
      userId: userObjectId,
      date,
      title: `Revision: ${problemTitle}`,
      problemIds: [problemObjectId],
      status: PlanStatus.planned,
      kind: 'revision',
    });
    created += 1;
  }

  return { created };
}

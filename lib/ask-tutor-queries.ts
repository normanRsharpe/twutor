import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { tutors as seedTutors, type TutorId } from "@/data/twutor";
import { createAskTutorThread, type AskTutorResponseDraft, type AskTutorThread } from "@/lib/ask-tutors";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import { askTutorQuestions, askTutorResponses, tutors } from "@/lib/db/schema";
import { demoLearnerId } from "@/lib/seed-data";
import { getTwutorAIClient } from "@/lib/twutor-ai";

export type AskTutorResponseView = AskTutorResponseDraft & {
  tutorName: string;
  tutorHandle: string;
  tutorAvatarUrl: string;
};

export type AskTutorThreadView = Omit<AskTutorThread, "responses"> & {
  responses: AskTutorResponseView[];
};

let fallbackAskTutorThreads: AskTutorThread[] = [];

export function resetFallbackAskTutorThreads() {
  fallbackAskTutorThreads = [];
}

function uniqueThreadsByQuestion<T extends { question: string }>(threads: T[]) {
  const seen = new Set<string>();
  return threads.filter((thread) => {
    const key = thread.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function attachTutorViews(threads: AskTutorThread[]): AskTutorThreadView[] {
  return uniqueThreadsByQuestion(threads).map((thread) => ({
    ...thread,
    responses: thread.responses.map((response) => {
      const tutor = seedTutors[response.tutorId];
      return {
        ...response,
        tutorName: tutor.name,
        tutorHandle: tutor.handle,
        tutorAvatarUrl: tutor.avatar
      };
    })
  }));
}

export async function createAskTutorThreadFromQuestion(question: string) {
  const thread = await createAskTutorThread({
    learnerId: demoLearnerId,
    question,
    tutors: seedTutors,
    aiClient: getTwutorAIClient(),
    idGenerator: randomUUID,
    learnerContext: "Learner is building platform and AI engineering intuition inside a social feed."
  });

  if (!getDatabaseUrl()) {
    fallbackAskTutorThreads = [thread, ...fallbackAskTutorThreads];
    return thread;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(askTutorQuestions).values({
      id: thread.id,
      learnerId: thread.learnerId,
      question: thread.question,
      createdAt: thread.createdAt
    });
    await tx.insert(askTutorResponses).values(
      thread.responses.map((response) => ({
        id: response.id,
        questionId: response.questionId,
        tutorId: response.tutorId,
        status: response.status,
        body: response.body,
        guardrails: response.guardrails,
        followUpPrompt: response.followUpPrompt,
        provider: response.provider,
        model: response.model,
        prompt: response.prompt,
        createdAt: response.createdAt
      }))
    );
  });

  return thread;
}

export async function listAskTutorThreads(): Promise<AskTutorThreadView[]> {
  if (!getDatabaseUrl()) return attachTutorViews(fallbackAskTutorThreads);

  const db = getDb();
  const [questionRows, responseRows, tutorRows] = await Promise.all([
    db.select().from(askTutorQuestions).where(eq(askTutorQuestions.learnerId, demoLearnerId)).orderBy(desc(askTutorQuestions.createdAt)),
    db.select().from(askTutorResponses).orderBy(asc(askTutorResponses.createdAt)),
    db.select().from(tutors)
  ]);
  const tutorsById = new Map(tutorRows.map((tutor) => [tutor.id, tutor]));
  const responsesByQuestion = responseRows.reduce<Record<string, AskTutorResponseView[]>>((acc, response) => {
    const tutor = tutorsById.get(response.tutorId);
    acc[response.questionId] ??= [];
    acc[response.questionId].push({
      id: response.id,
      questionId: response.questionId,
      tutorId: response.tutorId as TutorId,
      status: response.status,
      body: response.body,
      guardrails: response.guardrails,
      followUpPrompt: response.followUpPrompt,
      provider: response.provider,
      model: response.model,
      prompt: response.prompt,
      createdAt: response.createdAt,
      tutorName: tutor?.name ?? response.tutorId,
      tutorHandle: tutor?.handle ?? `@${response.tutorId}`,
      tutorAvatarUrl: tutor?.avatarUrl ?? ""
    });
    return acc;
  }, {});

  return uniqueThreadsByQuestion(questionRows.map((question) => ({
    id: question.id,
    learnerId: question.learnerId,
    question: question.question,
    status: "answered",
    createdAt: question.createdAt,
    responses: responsesByQuestion[question.id] ?? []
  })));
}

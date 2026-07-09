import { eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { posts, tutors } from "../data/twutor";
import {
  agenticPostIntents,
  challenges,
  contentBriefs,
  diagramNodes,
  feedEvents,
  generatedAssets,
  learnerConceptStates,
  learnerLearningStates,
  learnerSavedPosts,
  learners,
  pollOptions,
  postMetrics,
  posts as postTable,
  quotePosts,
  researchNotes,
  traceCards,
  tutorFollows,
  tutors as tutorTable
} from "../lib/db/schema";
import { buildSeedRows } from "../lib/seed-data";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is required. Use `railway run --service twutor -- npm run db:seed` or set a local Railway Postgres URL.");
}

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);
const seed = buildSeedRows({ tutors, posts });
const postIds = seed.posts.map((post) => post.id);
const tutorIds = seed.tutors.map((tutor) => tutor.id);
const learnerIds = seed.learners.map((learner) => learner.id);

async function main() {
  await db.transaction(async (tx) => {
    if (postIds.length) {
      await tx.delete(feedEvents).where(inArray(feedEvents.postId, postIds));
      await tx.delete(agenticPostIntents).where(inArray(agenticPostIntents.publishedPostId, postIds));
      await tx.delete(challenges).where(inArray(challenges.postId, postIds));
      await tx.delete(traceCards).where(inArray(traceCards.postId, postIds));
      await tx.delete(pollOptions).where(inArray(pollOptions.postId, postIds));
      await tx.delete(quotePosts).where(inArray(quotePosts.postId, postIds));
      await tx.delete(diagramNodes).where(inArray(diagramNodes.postId, postIds));
      await tx.delete(postMetrics).where(inArray(postMetrics.postId, postIds));
      await tx.delete(postTable).where(inArray(postTable.id, postIds));
    }

    if (tutorIds.length) {
      await tx.delete(agenticPostIntents).where(inArray(agenticPostIntents.tutorId, tutorIds));
      await tx.delete(generatedAssets).where(inArray(generatedAssets.ownerId, tutorIds));
      await tx.delete(tutorFollows).where(inArray(tutorFollows.tutorId, tutorIds));
      await tx.delete(learnerSavedPosts).where(inArray(learnerSavedPosts.postId, postIds));
      await tx.delete(tutorTable).where(inArray(tutorTable.id, tutorIds));
    }

    for (const learnerId of learnerIds) {
      await tx.delete(feedEvents).where(eq(feedEvents.learnerId, learnerId));
      await tx.delete(agenticPostIntents).where(eq(agenticPostIntents.learnerId, learnerId));
      await tx.delete(contentBriefs).where(eq(contentBriefs.learnerId, learnerId));
      await tx.delete(learnerConceptStates).where(eq(learnerConceptStates.learnerId, learnerId));
      await tx.delete(learnerLearningStates).where(eq(learnerLearningStates.learnerId, learnerId));
      await tx.delete(learners).where(eq(learners.id, learnerId));
    }

    await tx.insert(learners).values(seed.learners);
    await tx.insert(learnerLearningStates).values(seed.learningStates);
    await tx.insert(learnerConceptStates).values(seed.conceptStates);
    await tx.insert(contentBriefs).values(seed.contentBriefs);
    await tx.insert(researchNotes).values(seed.researchNotes);
    await tx.insert(tutorTable).values(seed.tutors);
    await tx.insert(generatedAssets).values(seed.generatedAssets);
    await tx.insert(tutorFollows).values(seed.follows);
    await tx.insert(postTable).values(seed.posts);
    await tx.insert(agenticPostIntents).values(seed.agenticPostIntents);
    await tx.insert(feedEvents).values(seed.feedEvents);
    await tx.insert(learnerSavedPosts).values(seed.savedPosts);
    await tx.insert(postMetrics).values(seed.postMetrics);

    if (seed.diagramNodes.length) await tx.insert(diagramNodes).values(seed.diagramNodes);
    if (seed.quotePosts.length) await tx.insert(quotePosts).values(seed.quotePosts);
    if (seed.pollOptions.length) await tx.insert(pollOptions).values(seed.pollOptions);
    if (seed.traceCards.length) await tx.insert(traceCards).values(seed.traceCards);
    if (seed.challenges.length) await tx.insert(challenges).values(seed.challenges);
  });

  console.log(`Seeded ${seed.tutors.length} tutors, ${seed.posts.length} posts, ${seed.follows.length} follows, ${seed.savedPosts.length} saved posts, ${seed.feedEvents.length} feed events, ${seed.learningStates.length} learning states, ${seed.conceptStates.length} concept states, ${seed.contentBriefs.length} content briefs, ${seed.researchNotes.length} research notes, ${seed.agenticPostIntents.length} agentic post intents.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });

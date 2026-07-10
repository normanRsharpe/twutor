const allowedTutorIds = new Set(["maya", "eval", "nora", "kai", "lin", "priya"]);

export type OnboardingSelection = {
  tutors: string[];
  topics: string[];
};

export function normalizeOnboardingSelection({ tutors, topics }: OnboardingSelection): OnboardingSelection {
  return {
    tutors: [...new Set(tutors)].filter((tutor) => allowedTutorIds.has(tutor)).slice(0, 3),
    topics: [...new Set(topics.map((topic) => topic.trim()).filter(Boolean))].slice(0, 5)
  };
}

export function createColdStartLearningState({ goal, topics, cadence }: { goal: string; level: string; topics: string[]; cadence: string }) {
  return {
    title: "Platform × AI Engineering",
    currentArc: "Your first learning arc",
    progressPercent: 0,
    focusTopics: topics,
    lastSignal: `Starting with your selected goals · ${cadence}`
  };
}

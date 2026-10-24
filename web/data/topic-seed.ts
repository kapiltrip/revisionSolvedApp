import catalog from '../content/maven/catalog.json' with { type: 'json' };
import type { CourseCatalog } from '../content/maven/types';

export type TopicSeed = {
  id: string;
  repository: 'maven-silicon';
  subject: string;
  title: string;
  priority: 'high' | 'medium' | 'normal';
  targetDate: string | null;
  sourceUrl: string;
};

export const topicSeeds: TopicSeed[] = (
  catalog as CourseCatalog
).assignments.flatMap((assignment) =>
  assignment.questions.map((question) => ({
    id: question.id,
    repository: 'maven-silicon' as const,
    subject: `Digital · Assignment ${assignment.number}`,
    title: `Q${String(question.number).padStart(2, '0')} · ${question.title}`,
    priority: 'normal' as const,
    targetDate: null,
    sourceUrl: question.sourceUrl,
  })),
);

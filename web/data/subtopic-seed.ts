import type { TopicSeed } from './topic-seed';

export type SubtopicSeed = {
  id: string;
  topicId: string;
  label: string;
  sortOrder: number;
  sourceUrl: string | null;
};

export function subtopicSeedsForTopic(
  topic: Pick<TopicSeed, 'id' | 'subject' | 'sourceUrl'>,
): SubtopicSeed[] {
  return [
    'Concept · Define the idea, assumptions and signal conventions without notes.',
    'Application · Explain where this circuit or representation is useful.',
    'Solving · Derive the answer and check a boundary case before opening the solution.',
    'Review · Explain the reasoning aloud in a clear 60–90 second answer.',
  ].map((label, sortOrder) => ({
    id: `${topic.id}-check-${sortOrder + 1}`,
    topicId: topic.id,
    label,
    sortOrder,
    sourceUrl: topic.sourceUrl || null,
  }));
}

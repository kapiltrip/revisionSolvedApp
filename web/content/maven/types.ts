export type CourseAssignment = {
  number: number;
  title: string;
  available: boolean;
  questionCount: number;
  sourceUrl: string | null;
  pdfUrl: string | null;
  questions: Array<{
    id: string;
    number: number;
    title: string;
    sourceUrl: string;
  }>;
};
export type CourseCatalog = {
  course: string;
  module: string;
  currentAssignment: number;
  sourceCheckedAt: string | null;
  sourceMode?: 'imported' | 'empty';
  assignments: CourseAssignment[];
};

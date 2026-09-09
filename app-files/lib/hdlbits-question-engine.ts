import rawCatalog from '../data/hdlbits-question-catalog.json' with { type: 'json' };

export type HdlBitsFocus =
  | 'all'
  | 'fundamentals'
  | 'combinational'
  | 'sequential'
  | 'fsm'
  | 'verification'
  | 'weak-spots';

export type HdlBitsSessionMode = 'smart-series' | 'single';
export type HdlBitsDifficulty = 'warm-up' | 'standard' | 'challenge';

type RawQuestion = {
  number: number;
  slug: string;
  title: string;
  category: string;
  section: string;
  subsection: string;
  url: string;
  totalAttempts: number;
  successRate: number;
};

type SeriesDefinition = {
  id: string;
  name: string;
  numbers: number[];
};

export type HdlBitsQuestion = RawQuestion & {
  id: string;
  difficulty: HdlBitsDifficulty;
  estimatedMinutes: number;
  seriesId: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  seriesLength: number | null;
};

export type HdlBitsHistoryItem = {
  questionId: string;
  startedAt: string;
};

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

export const hdlBitsSeries: SeriesDefinition[] = [
  { id: 'getting-started', name: 'Getting started', numbers: [151, 152] },
  {
    id: 'language-basics',
    name: 'Verilog language basics',
    numbers: range(1, 8),
  },
  { id: 'vectors', name: 'Vector operations', numbers: range(9, 17) },
  { id: 'module-hierarchy', name: 'Module hierarchy', numbers: range(18, 26) },
  { id: 'procedural-rtl', name: 'Procedural RTL', numbers: range(27, 34) },
  {
    id: 'verilog-features',
    name: 'More Verilog features',
    numbers: range(35, 41),
  },
  { id: 'gates-one', name: 'Gate circuits · part I', numbers: range(42, 50) },
  { id: 'gates-two', name: 'Gate circuits · part II', numbers: range(51, 58) },
  { id: 'multiplexers', name: 'Multiplexer series', numbers: range(59, 63) },
  { id: 'arithmetic', name: 'Arithmetic circuits', numbers: range(64, 70) },
  {
    id: 'karnaugh-maps',
    name: 'Karnaugh-map circuits',
    numbers: range(71, 78),
  },
  { id: 'registers', name: 'Registers and reset', numbers: range(79, 84) },
  {
    id: 'storage-circuits',
    name: 'Storage circuit exams',
    numbers: range(85, 92),
  },
  { id: 'edge-detection', name: 'Edge detection', numbers: range(93, 96) },
  { id: 'basic-counters', name: 'Basic counters', numbers: range(97, 100) },
  {
    id: 'shift-lfsr',
    name: 'Shift registers and LFSRs',
    numbers: range(101, 109),
  },
  { id: 'fsm-foundations', name: 'FSM foundations', numbers: range(110, 118) },
  {
    id: 'lemmings',
    name: 'Lemmings FSM series',
    numbers: [119, 159, 160, 161],
  },
  {
    id: 'fsm-exams',
    name: 'FSM exam series',
    numbers: [121, 142, 155, 156, 157, 158, 162],
  },
  { id: 'debugging', name: 'Find the RTL bug', numbers: range(122, 126) },
  { id: 'waveforms', name: 'Build from waveforms', numbers: range(127, 136) },
  { id: 'testbenches', name: 'Testbench series', numbers: range(137, 141) },
  {
    id: 'advanced-counters',
    name: 'Advanced counters',
    numbers: range(143, 146),
  },
  {
    id: 'complete-timer',
    name: 'Complete timer design series',
    numbers: [147, 148, 149, 150, 153, 154, 178],
  },
  {
    id: 'serial-receiver',
    name: 'Serial receiver series',
    numbers: [163, 164, 165],
  },
  { id: 'ps2', name: 'PS/2 packet series', numbers: [166, 167] },
  {
    id: 'protocol-datapaths',
    name: 'Protocol datapaths',
    numbers: [168, 169, 170],
  },
  {
    id: 'fsm-equations',
    name: 'FSM equation series',
    numbers: [171, 172, 173, 174, 177],
  },
  {
    id: 'cellular-automata',
    name: 'Cellular automata',
    numbers: [175, 176, 179],
  },
];

const seriesByNumber = new Map<
  number,
  { series: SeriesDefinition; index: number }
>();
for (const series of hdlBitsSeries) {
  series.numbers.forEach((number, index) => {
    if (seriesByNumber.has(number)) {
      throw new Error(`HDLBits question ${number} belongs to two series.`);
    }
    seriesByNumber.set(number, { series, index });
  });
}

function difficultyFor(question: RawQuestion): HdlBitsDifficulty {
  const historicallyHard =
    question.totalAttempts >= 6 || question.successRate <= 35;
  const conceptuallyHard =
    question.subsection === 'Finite State Machines' ||
    question.section === 'Building Larger Circuits' ||
    question.subsection === 'More Circuits';
  if (historicallyHard || conceptuallyHard) return 'challenge';
  if (
    question.totalAttempts <= 2 &&
    question.successRate >= 75 &&
    (question.section === 'Basics' || question.number >= 151)
  ) {
    return 'warm-up';
  }
  return 'standard';
}

function estimateFor(question: RawQuestion, difficulty: HdlBitsDifficulty) {
  let minutes =
    difficulty === 'warm-up' ? 7 : difficulty === 'challenge' ? 24 : 14;
  if (question.subsection === 'Finite State Machines') minutes += 6;
  if (question.section === 'Building Larger Circuits') minutes += 10;
  if (question.subsection === 'More Circuits') minutes += 12;
  if (question.category.startsWith('Verification'))
    minutes = Math.max(12, minutes - 2);
  if (question.slug === 'exams/review2015_fancytimer') minutes = 45;
  if (question.slug === 'conwaylife') minutes = 40;
  return minutes;
}

export const hdlBitsQuestions: HdlBitsQuestion[] = (
  rawCatalog as RawQuestion[]
).map((question) => {
  const seriesEntry = seriesByNumber.get(question.number);
  const difficulty = difficultyFor(question);
  return {
    ...question,
    id: `hdlbits-${String(question.number).padStart(3, '0')}`,
    difficulty,
    estimatedMinutes: estimateFor(question, difficulty),
    seriesId: seriesEntry?.series.id ?? null,
    seriesName: seriesEntry?.series.name ?? null,
    seriesIndex: seriesEntry ? seriesEntry.index + 1 : null,
    seriesLength: seriesEntry?.series.numbers.length ?? null,
  };
});

const questionById = new Map(
  hdlBitsQuestions.map((question) => [question.id, question]),
);
const questionByNumber = new Map(
  hdlBitsQuestions.map((question) => [question.number, question]),
);

export function getHdlBitsQuestion(id: string) {
  return questionById.get(id) ?? null;
}

export function getHdlBitsQuestions(ids: string[]) {
  return ids.flatMap((id) => {
    const question = getHdlBitsQuestion(id);
    return question ? [question] : [];
  });
}

export function sessionQuestionsFor(
  question: HdlBitsQuestion,
  mode: HdlBitsSessionMode,
) {
  if (mode === 'single' || !question.seriesId) return [question];
  const series = hdlBitsSeries.find((item) => item.id === question.seriesId);
  if (!series) return [question];
  return series.numbers.flatMap((number) => {
    const item = questionByNumber.get(number);
    return item ? [item] : [];
  });
}

export function timeLimitFor(questions: HdlBitsQuestion[]) {
  return questions.reduce(
    (total, question) => total + question.estimatedMinutes,
    0,
  );
}

function matchesFocus(question: HdlBitsQuestion, focus: HdlBitsFocus) {
  if (focus === 'all') return true;
  if (focus === 'weak-spots') {
    return question.successRate < 70 || question.totalAttempts >= 4;
  }
  if (focus === 'fundamentals') {
    return (
      question.category === 'Verilog Language' ||
      question.category === 'Getting Started'
    );
  }
  if (focus === 'combinational') {
    return question.section === 'Combinational Logic';
  }
  if (focus === 'fsm') {
    return (
      question.subsection === 'Finite State Machines' ||
      ['complete-timer', 'fsm-equations', 'lemmings'].includes(
        question.seriesId ?? '',
      )
    );
  }
  if (focus === 'verification') {
    return question.category.startsWith('Verification');
  }
  return (
    question.section === 'Sequential Logic' ||
    question.section === 'Building Larger Circuits'
  );
}

export function pickHdlBitsQuestion({
  focus,
  history,
  random = Math.random,
}: {
  focus: HdlBitsFocus;
  history: HdlBitsHistoryItem[];
  random?: () => number;
}) {
  const filtered = hdlBitsQuestions.filter((question) =>
    matchesFocus(question, focus),
  );
  const candidates = filtered.length ? filtered : hdlBitsQuestions;
  const attempts = new Map<string, { count: number; last: string }>();
  for (const item of history) {
    const current = attempts.get(item.questionId);
    attempts.set(item.questionId, {
      count: (current?.count ?? 0) + 1,
      last:
        current && current.last > item.startedAt
          ? current.last
          : item.startedAt,
    });
  }
  const ranked = [...candidates].sort((a, b) => {
    const aHistory = attempts.get(a.id);
    const bHistory = attempts.get(b.id);
    return (
      (aHistory?.count ?? 0) - (bHistory?.count ?? 0) ||
      (aHistory?.last ?? '').localeCompare(bHistory?.last ?? '') ||
      a.number - b.number
    );
  });
  const smallestCount = attempts.get(ranked[0].id)?.count ?? 0;
  const leastSeen = ranked.filter(
    (question) => (attempts.get(question.id)?.count ?? 0) === smallestCount,
  );
  return leastSeen[Math.floor(random() * leastSeen.length)] ?? ranked[0];
}

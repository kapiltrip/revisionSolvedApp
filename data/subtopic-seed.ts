import type { TopicSeed } from '@/data/topic-seed';

export type SubtopicSeed = {
  id: string;
  topicId: string;
  label: string;
  sortOrder: number;
  sourceUrl: string | null;
};

const explicitSubtopics: Record<string, string[]> = {
  'cpp-phase-1': [
    'Types, variables, expressions and control flow',
    'Functions, references and const correctness',
    'Compilation, headers and translation units',
    'Input validation and a small working program',
  ],
  'cpp-phase-2': [
    'Stack, heap, scope and object lifetime',
    'RAII, ownership and smart pointers',
    'Classes, constructors and value semantics',
    'Inheritance, polymorphism and abstraction',
  ],
  'cpp-phase-3': [
    'Containers, iterators and complexity choices',
    'Algorithms, predicates and lambdas',
    'Strings, files and error handling',
    'Measure and explain an implementation choice',
  ],
  'cpp-phase-4': [
    'Templates, constraints and concepts',
    'Move semantics and perfect forwarding',
    'constexpr and compile-time techniques',
    'Ranges, concurrency and modern C++ patterns',
  ],
  'cpp-phase-5': [
    'Build structure and CMake workflow',
    'Unit tests, sanitizers and static analysis',
    'Debugging, profiling and benchmarking',
    'API design, documentation and code review',
  ],
  'cpp-phase-6': [
    'Define the VLSI/EDA capstone contract',
    'Design the data model and architecture',
    'Implement the converter with tests',
    'Measure performance and produce the report',
  ],
  'script-perl': [
    'Variables and scalars',
    'Arrays and hashes',
    'File handling',
    'Subroutines and command-line arguments',
  ],
  'script-regex': [
    'Literals, character classes and anchors',
    'Quantifiers and grouping',
    'Capture groups and substitutions',
    'Test patterns against edge cases',
  ],
  'script-shell': [
    'Commands, variables and quoting',
    'Conditions, loops and functions',
    'Pipes and redirection',
    'grep, sed and awk basics',
  ],
  'script-automation': [
    'Compile/run and failure-report script',
    'Boundary and random-input generator',
    'Algorithm result corpus aggregator',
    'Build, test, sanitizer and benchmark driver',
    'Compiler-feature probe and runner',
    'Capstone conversion and report automation',
  ],
};

function defaultLabels(subject: string) {
  const templates: Record<string, string[]> = {
    'SV Basics': [
      'Syntax and data model',
      'Execution and scheduling behavior',
      'Working SystemVerilog example',
      'Common trap and its fix',
    ],
    'Functional Coverage': [
      'Coverage intent and requirement',
      'Coverpoints, bins and crosses',
      'Sampling and filtering conditions',
      'Read the result and close a hole',
    ],
    'SV Assertions': [
      'Property intent',
      'Sequence and temporal operators',
      'Reset, sampling and vacuity',
      'Explain a pass and failure trace',
    ],
    Protocols: [
      'Signals and endpoint roles',
      'Transaction sequence',
      'Timing, errors and corner cases',
      'Explain a waveform from start to finish',
    ],
    AMBA: [
      'Signals and transfer phases',
      'Wait states and error handling',
      'Master and slave behavior',
      'Explain a complete transfer waveform',
    ],
    'AMBA AXI': [
      'Channel roles and handshakes',
      'Backpressure and signal stability',
      'Bursts, ordering and responses',
      'Prove behavior with a waveform',
    ],
    'Digital Design': [
      'Interface contract and state',
      'Datapath and control RTL',
      'Corner cases and failure modes',
      'Verification proof',
    ],
    Timing: [
      'Constraints and timing paths',
      'Setup and hold reasoning',
      'Slack, exceptions and violations',
      'Work through one timing report',
    ],
    'MOSFET and CMOS': [
      'Device mechanism and operating regions',
      'Key equations and assumptions',
      'Circuit-level implication',
      'Solve one worked example',
    ],
    'Computer Architecture': [
      'ISA and datapath model',
      'Control and memory behavior',
      'Performance trade-offs',
      'Trace one instruction sequence',
    ],
  };

  return (
    templates[subject] ?? [
      'Define the idea in your own words',
      'Explain how it works',
      'Complete one example',
      'Name one common mistake',
    ]
  );
}

export function subtopicSeedsForTopic(
  topic: Pick<TopicSeed, 'id' | 'subject' | 'sourceUrl'>,
): SubtopicSeed[] {
  const labels = explicitSubtopics[topic.id] ?? defaultLabels(topic.subject);
  return labels.map((label, index) => ({
    id: `${topic.id}-check-${index + 1}`,
    topicId: topic.id,
    label,
    sortOrder: index + 1,
    sourceUrl: topic.sourceUrl || null,
  }));
}

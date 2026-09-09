import type { TopicSeed } from '@/data/topic-seed';

export type SubtopicSeed = {
  id: string;
  topicId: string;
  label: string;
  sortOrder: number;
  sourceUrl: string | null;
};

const explicitSubtopics: Record<string, string[]> = {
  'hdlbits-b01-foundations': [
    '001–008 · Wires, gates and explicit continuous connections',
    '009–017 · Vector ranges, part-selects, concatenation and replication',
    '151–152 · Minimal modules: pass-through and constant output',
    'Blind proof · Solve selected problems before opening the archived solution',
  ],
  'hdlbits-b02-modules-procedures': [
    '018–026 · Port mapping, hierarchy, adders and carry-chain wiring',
    '027–028 · Combinational versus clocked always blocks',
    '029–034 · If, case, casez, priority and complete assignment coverage',
    'Explain blocking, nonblocking and latch inference from hardware intent',
  ],
  'hdlbits-b03-features-gates': [
    '035–037 · Ternary and reduction operators over wide vectors',
    '038–041 · Procedural loops, generate loops, indexed slices and BCD adders',
    '042–050 · Gate networks, truth tables and equality logic',
    'Diagnose width and operator mistakes from the first mismatch',
  ],
  'hdlbits-b04-gates-muxes': [
    '051–058 · Boolean circuit translation, popcount and vector gates',
    '059–063 · 2:1, 9:1 and 256:1 multiplexer construction',
    'Prove select width, default behavior and out-of-range handling',
    'Rebuild one circuit from its truth table without notes',
  ],
  'hdlbits-b05-arithmetic-kmaps': [
    '064–070 · Half/full adders, ripple carry, signed overflow and wide adders',
    '071–078 · Karnaugh-map grouping, SOP/POS and mux mapping',
    'Derive sum, carry and borrow equations instead of recalling a template',
    'Check every minimized expression against boundary input combinations',
  ],
  'hdlbits-b06-latches-dffs': [
    '079–082 · D-latch versus edge-triggered DFF behavior',
    '083–088 · Synchronous/asynchronous reset, enable priority and DFF banks',
    'Trace old values and nonblocking updates at a clock edge',
    'Explain exactly when storage is intentional and when it is an inferred bug',
  ],
  'hdlbits-b07-edges-counters': [
    '089–093 · DFF applications, arbitrary transition and edge detection',
    '094–100 · Basic, decade and BCD counter behavior',
    'Prove previous-sample storage for rising, falling and any-edge pulses',
    'Check rollover, reset and enable priority at boundary cycles',
  ],
  'hdlbits-b08-shift-lfsr': [
    '101–104 · Shift-register stages, muxed shifting and rotation',
    '105–109 · LFSR feedback taps and pseudo-random state movement',
    'Draw bit movement and index direction before writing RTL',
    'Verify reset seed, forbidden states and one complete transition trace',
  ],
  'hdlbits-b09-fsm-foundations': [
    '110–114 · State transition, Moore/Mealy output and reset structure',
    '115–118 · Sequence detectors and state-history reasoning',
    '119 · Lemmings 1 direction and collision priority',
    'Separate current state, next state and outputs in a blind implementation',
  ],
  'hdlbits-b10-debug-waveforms-1': [
    '122–126 · Locate semantic bugs in supplied combinational and sequential RTL',
    '127–132 · Infer circuits from timing relationships and waveform evidence',
    'Stop at the first mismatching output and identify its causal cycle',
    'Classify the intended storage as combinational, latch or flip-flop',
  ],
  'hdlbits-b11-waveforms-testbenches': [
    '133–138 · Continue waveform-to-circuit inference across edge cases',
    '139–141 · Instantiate the DUT once and schedule stimulus over time',
    'Account for clock phase, old values and nonblocking observation timing',
    'Add a self-check that reports the first failing vector and expected value',
  ],
  'hdlbits-b12-advanced-counters': [
    '143–146 · Cascaded enables, multi-digit counters and rollover',
    '147–150 · Clock/time counters and combined control-datapath designs',
    'Trace terminal count, carry enable and reset on the same boundary cycle',
    'Prove one complete rollover using a compact cycle table',
  ],
  'hdlbits-b13-fsm-timer': [
    '121, 142 · FSM review and timer/counter integration',
    '153–158 · Exam state diagrams, state tables and one-hot equations',
    'Complete timer · Keep control state separate from shifting/counting registers',
    'Derive requested next-state bits from incoming arrows only',
  ],
  'hdlbits-b14-lemmings-serial': [
    '159–161 · Falling, digging and direction-memory priority in Lemmings',
    '162 · Preserve the supplied one-hot state interface',
    '163–164 · Serial framing, bit count, stop validation and done alignment',
    'Trace one complete frame cycle-by-cycle before coding outputs',
  ],
  'hdlbits-b15-protocol-datapaths': [
    '165 · Reset and evaluate odd parity at the correct frame boundary',
    '166–167 · PS/2 packet framing, byte slices and back-to-back packets',
    '168 · HDLC run-length recognition and output-cycle alignment',
    '169–170 · Datapath transformations and complementer correctness',
  ],
  'hdlbits-b16-fsm-equations-arbiter': [
    '171–174 · Advanced next-state equations and history-dependent behavior',
    '177–178 · Arbiter/review FSM and selected one-hot equations',
    'Use destination-first incoming-arrow reasoning for each requested state bit',
    'Explain unused-state warnings without inventing unnecessary logic',
  ],
  'hdlbits-b17-cellular-automata': [
    '175–176 · Cellular-automata rules and parallel next-state calculation',
    '179 · Conway Life on a toroidal 16×16 grid',
    'Count wrapped neighbours at corners, edges and an interior cell',
    'Compute next_q entirely from old q before the registered update',
  ],
  'hdlbits-weaknesses-01-12': [
    '01 · Assignment context: wires, assign and always',
    '02 · Verilog operators are not English or C++',
    '03 · Concatenation and literal widths',
    '04 · Adders and borrow logic: derive the equation',
    '05 · Generate loops and indexed part-selects',
    '06 · Priority encoders and casez',
    '07 · K-maps feeding multiplexers',
    '08 · Latches versus flip-flops',
    '09 · Edge detection, shift registers and LFSRs',
    '10 · FSM state is memory, not input',
    '11 · Reading simulation waveforms from the first mismatch',
    '12 · Testbenches: instantiate once, stimulate over time',
  ],
  'hdlbits-weaknesses-13-24': [
    '13 · Complete timer: separate control and datapath state',
    '14 · Lemmings: falling must remember direction',
    '15 · One-hot FSM: preserve the supplied state interface',
    '16 · State for control, registers for data',
    '17 · Serial receiver: align done, stop validation and byte capture',
    '18 · Serial parity: reset per frame and check the post-bit value',
    '19 · PS/2 datapath: count bytes, not bits',
    '20 · HDLC: decode outputs from the correct run-length state',
    '21 · Q3c: present-state vector versus next-state bit',
    '22 · Q6c one-hot equations: use incoming arrows',
    '23 · Review2015: selected equations and unused-state warnings',
    '24 · Conway Life: wrap the grid before counting neighbours',
  ],
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

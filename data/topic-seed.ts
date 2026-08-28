export type TopicSeed = {
  id: string;
  repository: 'revision-solved' | 'systemverilog-from-beginning';
  subject: string;
  title: string;
  priority: 'high' | 'medium' | 'normal';
  targetDate: string | null;
  sourceUrl: string;
};

const revisionUrl = 'https://github.com/kapiltrip/RevisionAtlas';
const systemVerilogUrl =
  'https://github.com/kapiltrip/systemverilog-from-beginning';

export const topicSeeds: TopicSeed[] = [
  { id: 'sv-basics-01-08', repository: 'systemverilog-from-beginning', subject: 'SV Basics', title: 'Basics 01–08 — simulation and collections', priority: 'high', targetDate: '2026-08-24', sourceUrl: systemVerilogUrl },
  { id: 'sv-basics-09-21', repository: 'systemverilog-from-beginning', subject: 'SV Basics', title: 'Basics 09–21 — classes and object behavior', priority: 'high', targetDate: '2026-08-25', sourceUrl: systemVerilogUrl },
  { id: 'sv-basics-22-29', repository: 'systemverilog-from-beginning', subject: 'SV Basics', title: 'Basics 22–29 — constrained random stimulus', priority: 'high', targetDate: '2026-08-27', sourceUrl: systemVerilogUrl },
  { id: 'sv-basics-30-39', repository: 'systemverilog-from-beginning', subject: 'SV Basics', title: 'Basics 30–39 — process communication', priority: 'high', targetDate: '2026-08-28', sourceUrl: systemVerilogUrl },
  { id: 'sv-basics-40-44', repository: 'systemverilog-from-beginning', subject: 'SV Basics', title: 'Basics 40–44 — layered DUT communication', priority: 'high', targetDate: '2026-08-29', sourceUrl: systemVerilogUrl },
  { id: 'sv-task-function', repository: 'systemverilog-from-beginning', subject: 'SV Basics', title: 'Repair — task versus function', priority: 'high', targetDate: '2026-08-29', sourceUrl: systemVerilogUrl },
  { id: 'sv-coverage-repair-06', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Repair — reusable covergroup use cases', priority: 'medium', targetDate: '2026-08-25', sourceUrl: systemVerilogUrl },
  { id: 'sv-coverage-repair-07', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Repair — sampling methods', priority: 'medium', targetDate: '2026-08-26', sourceUrl: systemVerilogUrl },
  { id: 'sv-coverage-repair-08', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Repair — cross coverage', priority: 'medium', targetDate: '2026-08-27', sourceUrl: systemVerilogUrl },
  { id: 'sv-coverage-repair-09', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Repair — transition bins', priority: 'medium', targetDate: '2026-08-28', sourceUrl: systemVerilogUrl },
  { id: 'sva-scheduler', repository: 'systemverilog-from-beginning', subject: 'SV Assertions', title: 'SVA scheduler foundation', priority: 'high', targetDate: '2026-08-31', sourceUrl: systemVerilogUrl },
  { id: 'sva-01-07', repository: 'systemverilog-from-beginning', subject: 'SV Assertions', title: 'SVA 01–07', priority: 'high', targetDate: '2026-08-31', sourceUrl: systemVerilogUrl },
  { id: 'sva-08-14', repository: 'systemverilog-from-beginning', subject: 'SV Assertions', title: 'SVA 08–14', priority: 'high', targetDate: '2026-09-01', sourceUrl: systemVerilogUrl },
  { id: 'sva-15-21', repository: 'systemverilog-from-beginning', subject: 'SV Assertions', title: 'SVA 15–21', priority: 'high', targetDate: '2026-09-03', sourceUrl: systemVerilogUrl },
  { id: 'sva-22-28', repository: 'systemverilog-from-beginning', subject: 'SV Assertions', title: 'SVA 22–28', priority: 'high', targetDate: '2026-09-05', sourceUrl: systemVerilogUrl },
  { id: 'sva-project-fsm', repository: 'systemverilog-from-beginning', subject: 'SV Assertions', title: 'SVA project — FSM verification', priority: 'medium', targetDate: '2026-09-05', sourceUrl: systemVerilogUrl },
  { id: 'sva-project-counter', repository: 'systemverilog-from-beginning', subject: 'SV Assertions', title: 'SVA project — counter assertions with bind', priority: 'medium', targetDate: '2026-09-05', sourceUrl: systemVerilogUrl },

  { id: 'atlas-fifo', repository: 'revision-solved', subject: 'Digital Design', title: 'FIFO — contract, pointers, flags and verification', priority: 'high', targetDate: '2026-09-07', sourceUrl: revisionUrl },
  { id: 'atlas-frequency-dividers', repository: 'revision-solved', subject: 'Digital Design', title: 'Frequency Dividers — 13 pages', priority: 'high', targetDate: '2026-09-07', sourceUrl: revisionUrl },
  { id: 'atlas-divider-rtl', repository: 'revision-solved', subject: 'Digital Design', title: 'Programmable Divider RTL — /2 through /5', priority: 'medium', targetDate: '2026-09-07', sourceUrl: revisionUrl },
  { id: 'atlas-i2c', repository: 'revision-solved', subject: 'Protocols', title: 'I2C', priority: 'high', targetDate: '2026-09-08', sourceUrl: revisionUrl },
  { id: 'atlas-spi', repository: 'revision-solved', subject: 'Protocols', title: 'SPI', priority: 'high', targetDate: '2026-09-08', sourceUrl: revisionUrl },
  { id: 'atlas-uart', repository: 'revision-solved', subject: 'Protocols', title: 'UART', priority: 'high', targetDate: '2026-09-08', sourceUrl: revisionUrl },
  { id: 'atlas-ahb', repository: 'revision-solved', subject: 'AMBA', title: 'AMBA AHB', priority: 'high', targetDate: '2026-09-09', sourceUrl: revisionUrl },
  { id: 'atlas-apb', repository: 'revision-solved', subject: 'AMBA', title: 'AMBA APB', priority: 'high', targetDate: '2026-09-09', sourceUrl: revisionUrl },
  { id: 'atlas-axi-01', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 1', priority: 'high', targetDate: '2026-09-10', sourceUrl: revisionUrl },
  { id: 'atlas-axi-02', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 2', priority: 'high', targetDate: '2026-09-10', sourceUrl: revisionUrl },
  { id: 'atlas-axi-03', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 3', priority: 'high', targetDate: '2026-09-10', sourceUrl: revisionUrl },
  { id: 'atlas-axi-04', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 4', priority: 'high', targetDate: '2026-09-11', sourceUrl: revisionUrl },
  { id: 'atlas-axi-05', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 5', priority: 'high', targetDate: '2026-09-11', sourceUrl: revisionUrl },
  { id: 'atlas-axi-06', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 6', priority: 'high', targetDate: '2026-09-11', sourceUrl: revisionUrl },
  { id: 'atlas-axi-07', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 7', priority: 'high', targetDate: '2026-09-12', sourceUrl: revisionUrl },
  { id: 'atlas-axi-08', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 8', priority: 'high', targetDate: '2026-09-12', sourceUrl: revisionUrl },
  { id: 'atlas-axi-09', repository: 'revision-solved', subject: 'AMBA AXI', title: 'AXI Section 9', priority: 'high', targetDate: '2026-09-12', sourceUrl: revisionUrl },
  { id: 'atlas-sta', repository: 'revision-solved', subject: 'Timing', title: 'Static Timing Analysis — 25 pages', priority: 'high', targetDate: '2026-09-14', sourceUrl: revisionUrl },
  { id: 'atlas-mos-01', repository: 'revision-solved', subject: 'MOSFET and CMOS', title: 'MOSFET/CMOS notebook 1 — MOS capacitor fundamentals', priority: 'high', targetDate: '2026-09-16', sourceUrl: revisionUrl },
  { id: 'atlas-mos-02', repository: 'revision-solved', subject: 'MOSFET and CMOS', title: 'MOSFET/CMOS notebook 2 — non-ideal MOS and regions', priority: 'high', targetDate: '2026-09-17', sourceUrl: revisionUrl },
  { id: 'atlas-mos-03', repository: 'revision-solved', subject: 'MOSFET and CMOS', title: 'MOSFET/CMOS notebook 3 — models and inverter', priority: 'high', targetDate: '2026-09-18', sourceUrl: revisionUrl },
  { id: 'atlas-mos-04', repository: 'revision-solved', subject: 'MOSFET and CMOS', title: 'MOSFET/CMOS notebook 4 — delay, power and noise', priority: 'high', targetDate: '2026-09-19', sourceUrl: revisionUrl },
  { id: 'atlas-mos-05', repository: 'revision-solved', subject: 'MOSFET and CMOS', title: 'MOSFET/CMOS notebook 5 — sizing and NAND timing', priority: 'high', targetDate: '2026-09-19', sourceUrl: revisionUrl },
  { id: 'atlas-architecture', repository: 'revision-solved', subject: 'Computer Architecture', title: 'RISC/CISC foundation', priority: 'medium', targetDate: '2026-09-15', sourceUrl: revisionUrl },

  { id: 'fc-intent', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Requirements and coverage intent', priority: 'high', targetDate: '2026-08-24', sourceUrl: systemVerilogUrl },
  { id: 'fc-lifecycle', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Covergroup lifecycle and sampling', priority: 'high', targetDate: '2026-08-24', sourceUrl: systemVerilogUrl },
  { id: 'fc-coverpoints', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Coverpoints and bin forms', priority: 'high', targetDate: '2026-08-25', sourceUrl: systemVerilogUrl },
  { id: 'fc-conditions', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Conditions and transition bins', priority: 'high', targetDate: '2026-08-28', sourceUrl: systemVerilogUrl },
  { id: 'fc-cross', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Cross coverage and filtering', priority: 'high', targetDate: '2026-09-03', sourceUrl: systemVerilogUrl },
  { id: 'fc-options', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Options and percentage interpretation', priority: 'medium', targetDate: '2026-09-04', sourceUrl: systemVerilogUrl },
  { id: 'fc-architecture', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Transaction-level coverage architecture', priority: 'high', targetDate: '2026-09-05', sourceUrl: systemVerilogUrl },
  { id: 'fc-closure', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'Coverage-driven stimulus and closure', priority: 'high', targetDate: '2026-09-19', sourceUrl: systemVerilogUrl },
  { id: 'fc-fifo-capstone', repository: 'systemverilog-from-beginning', subject: 'Functional Coverage', title: 'FIFO functional-coverage capstone', priority: 'high', targetDate: '2026-09-19', sourceUrl: systemVerilogUrl },
];

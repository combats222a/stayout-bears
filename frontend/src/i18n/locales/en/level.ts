import type { LevelContent } from '../ru/level';

const level: LevelContent = {
  pageTitle: 'Stay Out Experience & Level Table (0–150) — how much EXP you need',
  pageDescription:
    'Stay Out experience and level table: how much EXP each character level from 0 to 150 needs, how much experience is left until the next level, and total experience for any level. Quick leveling calculator.',
  breadcrumbName: 'Level & Experience Table',
  tableAbout: 'Stay Out character experience (EXP) and level table, levels 0–150',
  heroTitlePrefix: 'Experience (EXP) & Level Table for ',
  heroTitleAccent: 'Stay Out',
  heroSubtitle:
    'A complete Stay Out character experience (EXP) and level table. Find out how much experience each level from 0 to 150 requires, how much EXP is left until the next level, and the total experience needed to reach any level. A calculator for experience between levels is also available for quick planning.',
  calcTitle: 'Stay Out experience (EXP) calculator between levels',
  calcSub1: 'Enter a starting and target level — the calculator works out the total experience (EXP) your character needs to level up between them.',
  calcSub2: 'The calculator automatically works out the total experience (EXP) needed to go between the two selected Stay Out character levels.',
  calcFromLabel: 'From level',
  calcToLabel: 'To level',
  calcResultLabel: (from, to) => `Experience from level ${from} to ${to}:`,
  calcPhrase: (from, to, exp) => `Going from level ${from} to ${to} requires: ${exp} EXP. You need ${exp} more experience.`,
  calcReversedNote: '(levels were swapped — the calculation always runs from lower to higher)',
  calcErrorInteger: 'Enter whole numbers',
  calcErrorRange: (max) => `Levels must be between 0 and ${max}`,
  calcErrorSameLevel: 'Choose two different levels',
  searchPlaceholder: 'Find a level…',
  allLevels: (max) => `All levels: 0–${max}`,
  found: (n) => `Found: ${n}`,
  tableHeadLevel: 'Level',
  tableHeadTotal: 'Total experience',
  tableHeadNeeded: 'Experience for level',
  levelNotFound: 'Level not found',
  footnoteTitle: 'Where the numbers in the "Experience for level" column come from',
  footnoteText:
    'The column is calculated with a simple formula: take the "Total experience" of the level you want and subtract the "Total experience" of the level before it. The result is exactly the missing experience — how many points need to stack up on top for the level counter to tick over to the next one. Nothing had to be hidden behind a paid subscription: the calculation runs right in the browser across all 151 values (levels 0–150), and updates itself if newer numbers show up.',
  faqSectionTitle: 'Frequently asked questions about Stay Out experience and levels',
  faqItems: [
    {
      q: 'How much experience do I need for any level in Stay Out?',
      a: 'Use the search above the table — type a level number into the "Find a level…" field, and the table instantly shows the matching row: total experience needed and exactly how much EXP that level requires. You can look up any level from 0 to 150 this way, for example 20, 30, 50, or 100.',
    },
    {
      q: 'How is the experience for a level calculated?',
      a: 'The "Experience for level" column shows the difference between the total (accumulated) experience of the current level and the total experience of the previous level. In other words — how much extra EXP you need to gain on top of the previous level\'s experience to raise your character\'s level by one.',
    },
    {
      q: 'Up to what level does the Stay Out experience table go?',
      a: 'The level and experience table covers every value from level 0 to 150 — the full range of character levels in Stay Out right now, with no restrictions or paywalled placeholders.',
    },
    {
      q: 'Where can I find a Stay Out level calculator?',
      a: 'The calculator is right on this page, above the table: enter a starting and target level (for example, from 115 to 142) and immediately see how much total experience your character needs to level up between them. The table itself also lets you look up data for any individual level through search.',
    },
  ],
  standaloneSeoFooter:
    'The Stay Out experience table contains the complete list of character levels from 0 to 150, total accumulated experience, and the amount of EXP needed to reach each next level. If you need to quickly find out how much experience is left until a target level, use the table search or the experience-between-levels calculator. Bear Tracker also offers other tools for Stay Out players: white bear respawns, Shining Mountain calculations, raid loot tracking, and personal timers. Also check out',
  standaloneFooterText: 'Want to track bears, Shining Mountain, and clan timers too? Head to the home page and register — it is free.',
  faqLinkLabel: 'FAQ',
};

export default level;

import type { FaqContent } from '../ru/faq';

const faq: FaqContent = {
  pageTitle: 'FAQ — Bear Tracker questions and answers | Stay Out',
  pageDescription:
    'Answers to common Bear Tracker questions: how to use the service, how bear and draug timers work, Shining Mountain, anomaly breaches, loot tracking, base captures, clans, achievements, the level calculator, and how to redeem a Stay Out promo code.',
  heroTitlePrefix: 'Frequently Asked ',
  heroTitleAccent: 'Questions',
  heroSubtitle: 'Everything you need to know about Bear Tracker — the Stay Out clan tracker',
  items: [
    {
      q: 'How do I use Bear Tracker?',
      a: 'Bear Tracker is a free online service for Stay Out players that runs right in your browser, no install needed. It helps you track when white bears and draugs respawn, calculate game events like Shining Mountain and anomaly breaches, keep a shared loot log, create personal timers, follow the base capture schedule, and use other handy calculators. After registering, you can create your own clan or join an existing one with an invite code — then all data about bears, draugs, the Shining, loot tracking, and other shared events syncs automatically between clan members in real time.',
    },
    {
      q: 'How do the bear and draug timers work?',
      a: 'The "Bears" and "Draugs" sections track when the next mutant will spawn in Stay Out. After a kill or a despawn, just tap "Now" or "Despawned" — Bear Tracker recalculates the next spawn time, the countdown until it appears, the time of the last kill or despawn, and shows which clan member last updated the data. White bears spawn every 35 minutes and draugs every 25 minutes after the previous kill or despawn, so the timers help you get ready for the next run ahead of time.',
    },
    {
      q: 'What is Shining Mountain?',
      a: 'The "Shining" section tracks the schedule of the Shining Mountain event in Stay Out. Once you set the current in-game time (the Z anchor), Bear Tracker automatically calculates the upcoming cycles and shows the current in-game time, time until the next Shining, the schedule for upcoming cycles, and a countdown — with a sound alert right when the event starts. Thanks to the automatic calculation, you never have to work out the in-game time yourself.',
    },
    {
      q: 'What are anomaly breaches?',
      a: 'The "Anomaly Breaches" section shows the schedule for the seasonal "Ice Heat" event in Stay Out and automatically calculates the upcoming in-game cycles. Once you set the current in-game time, the service shows the time until the next breach, the preparation phase, the event\'s end time, and a countdown — with a sound alert before preparation begins, so you can get to the right location ahead of time and not miss the start of the event.',
    },
    {
      q: 'How does loot tracking work?',
      a: 'The "Loot Tracking" section is for splitting loot after killing white bears in Stay Out together. For each entry you can list the group\'s participants, the number of hearts and pelts, and the sale price — Bear Tracker automatically works out each participant\'s payout and keeps a sales history for the whole clan, so there is no manual math involved.',
    },
    {
      q: 'How do personal timers work?',
      a: 'The "Timers" section lets you create an unlimited number of personal timers for any Stay Out activity: quest cooldowns, container respawns, farming routes, resource node spawns, or any other event with a fixed interval. Each timer gets its own sound alert, one-tap quick reset, editable settings, and automatic saving.',
    },
    {
      q: 'What does the "Captures" section show?',
      a: 'The "Captures" section shows the current schedule for base and outpost captures in Stay Out, automatically calculating the time until each event starts and ends. For every point you can see the time until the active capture starts and ends, its current status and coordinates, plus search by name or location, favorite points, and individual sound alerts. Bear Tracker automatically accounts for your device\'s time zone, so times display correctly no matter where you are.',
    },
    {
      q: 'How do clans work?',
      a: 'The clan system lets Stay Out players team up to share Bear Tracker\'s features. A clan\'s creator can invite new members with a code, appoint deputies, and manage the clan\'s roster. Once you join, you get access to shared data: white bear and draug timers, the Shining schedule, shared loot tracking, and synced game events — every change becomes available to all clan members instantly.',
    },
    {
      q: 'Where can I see Stay Out achievements?',
      a: 'The "Achievements" section contains the full list of Stay Out achievements with convenient search and a detailed description for each one: name, the conditions to unlock it, the reward, and its requirements. This makes it easy to find a specific achievement and plan your character\'s progression ahead of time.',
    },
    {
      q: 'How does the level calculator work?',
      a: 'The Stay Out level calculator quickly works out how much experience is left until your character\'s next level. Just enter your current level and how much experience you already have, and Bear Tracker calculates how much experience remains until the next level, your overall leveling progress, and how much experience you\'ll need going forward — so you can plan your leveling and gauge how fast you\'re progressing.',
    },
    {
      q: 'How do I activate a promo code?',
      a: 'A Stay Out promo code is entered on the character select screen: click "Enter promo code", type the code, and confirm — the set will appear in your account Storage. Then, in a safe zone, open your inventory (I key), click the box icon in the top-left corner to open Storage, and drag the set into your inventory. Right-click the gift set and choose "Use", then activate the gift premium subscription the same way — it grants 7 days of premium with all its bonuses. Check the "Promo Code" page for current codes and the full bonus list.',
    },
  ],
  footer:
    'Didn\'t find your answer? Check the "Promo Code" section on the home page, or register to use the bear, Shining Mountain, and timer trackers.',
};

export default faq;

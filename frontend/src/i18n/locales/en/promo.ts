import type { PromoContent } from '../ru/promo';

const promo: PromoContent = {
  steamLinkTitle: 'Stay Out on Steam',
  heroTitlePrefix: 'Start your journey in ',
  heroTitleAccent: 'Stay Out',
  heroSubtitle: 'Enter a promo code when creating your character and get survival gear + 7 days of premium subscription',
  copy: 'Copy',
  copied: '✓ Copied',
  codes: [
    { label: 'Promo code #1', hint: 'For a new account' },
    { label: 'Promo code #2', hint: 'For a second account' },
  ],
  seoTitle: '🎮 Stay Out — promo codes and survival in the Zone',
  seoParagraphs: [
    'Stay Out is a popular multiplayer post-apocalyptic survival game, where players explore an irradiated Zone, gather resources, craft gear, and face both anomalies and other survivors. That is exactly why Stay Out promo codes are so valued by players — they give a noticeable head start.',
    'Our Stay Out promo code can be redeemed when creating a new character to get a starter survival kit for the Zone — armor, medkits, food, water, and ammo — plus 7 days of a premium subscription with faster experience gain and other perks. Fresh Stay Out promo codes for 2026 are updated regularly, so check back on this page if an old code stops working.',
    'Besides promo codes, our Bear Tracker community tracks Stay Out clan progress: white bear respawns and their timers, Shining Mountain schedules, and splitting raid boss loot between clan members. All of this helps Stay Out players plan their runs into the Zone more efficiently and stop wasting precious time.',
  ],
  kitTitle: '🎒 What you get from the promo code',
  kitItems: [
    { name: 'Premium account', qty: '7 days' },
    { name: '6B1 body armor', qty: '×1' },
    { name: 'First aid kit', qty: '×1' },
    { name: 'Anti-radiation drug', qty: '×3' },
    { name: 'Antidote', qty: '×1' },
    { name: 'Bandages', qty: '×3' },
    { name: 'Fried meat', qty: '×5' },
    { name: 'Water 0.5L', qty: '×3' },
    { name: '12×70 buckshot', qty: '×100' },
    { name: '7.62×38R rounds', qty: '×150' },
  ],
  bonusTitle: '⭐ Premium bonuses (7 days)',
  bonuses: [
    '×2 experience for everything',
    '−50% on Guide travel fees',
    'Increased loot chance from mobs',
    'Faster parcel delivery',
    '+1 listing slot on the Marketplace',
    '−1% Marketplace commission',
    '+20% trade points from quests',
  ],
  stepsTitle: '📋 How to activate',
  steps: [
    {
      title: 'Enter the promo code',
      text: 'On the character select screen, click [ENTER PROMO CODE], type the code, and hit "Apply". The gift set will appear in your account Storage.',
    },
    {
      title: 'Pick up the set',
      text: 'In a safe zone, open your inventory [I]. Click the box icon in the top-left corner to open Storage, then drag the set into your inventory.',
    },
    {
      title: 'Activate the subscription',
      text: '[Right-click] the Gift Set → "Use". Then [right-click] the Gift Premium Subscription → "Use". Done — 7 days of premium are now active.',
    },
  ],
  trackerSeoTitle: '🧭 Bear Tracker — respawn tracker for bears, Shining Mountain, and timers',
  trackerSeoParagraphs: [
    'A respawn tracker is an online tool that helps players avoid wasting time waiting: it calculates when a mob, boss, or resource node will reappear on the map and signals at exactly the right moment. Trackers like this have long been used in MMOs and survival games — instead of standing over a spawn point with a stopwatch, players can do other things while a sound cue tells them when it is time to return.',
    'In Stay Out, white bears are one of the most valuable loot sources on the map, but a new one only spawns after a fixed amount of time since the previous bear died. Bear Tracker automatically counts down for every bear, shows the exact time of the next spawn, and plays a separate sound alert 5 minutes before it appears — enough time to get there before a rival squad grabs the loot.',
    'Shining Mountain is a location with its own in-game clock that runs faster than real time: one in-game minute takes 8 minutes 45 seconds in the real world. The Shining event triggers four times per in-game day — at 00:00, 06:00, 12:00, and 18:00 in-game time — and lasts one in-game hour. Doing that math in your head is awkward and easy to get wrong, so Bear Tracker converts in-game time to real time itself and plays a sound alert for the clan right as each Shining begins.',
    'Besides game-tied timers, Bear Tracker also has general-purpose custom timers for any recurring task: ability cooldowns, crafting cooldowns, time to the next raid, a clan activity deadline, or anything else outside the game. Set a name and a period — from a minute to several days — and the tracker will count down and play its own sound alert when it is done, even if the browser tab is minimized.',
    'Bear Tracker is free to use, no install required — right in the browser, on phone or desktop. The service was built by Stay Out players for their own clan, but the underlying idea — respawn timers, converting in-game time to real time, personal countdowns with sound alerts — works for any online game or shared task where timing matters.',
  ],
  footer: 'Bear Tracker — a Stay Out player community · This is an unofficial fan project.',
};

export default promo;

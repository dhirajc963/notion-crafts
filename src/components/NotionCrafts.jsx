/* ============================================================
   Notion Crafts — Specimen Edition
   Ported from the Claude Design handoff (HTML/React+Babel prototype)
   into a single React island for Astro. All modules from the
   original bundle live here in dependency order; function
   declarations hoist, so cross-references resolve regardless of
   position. Mounted client-only — uses Date, localStorage, etc.
   ============================================================ */

import React, {
  useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect,
} from 'react';
// The 500+ icon library (~230KB gz) is code-split: it loads on demand the
// first time the Icons gallery is opened, keeping the initial island lean.

/* ============================================================
   DATA
   ============================================================ */

const WIDGETS = [
  {
    id: 'agendaList', name: 'Agenda List', type: 'agendaList', pro: true,
    desc: 'Your next handful of events, listed plain and read-only from a calendar feed.',
    tags: ['planning', 'calendar'], category: 'Planning',
    config: { icalUrl: '', count: 5, range: 'week' },
  },
  {
    id: 'currencyConverter', name: 'Currency Converter', type: 'currencyConverter', pro: true,
    desc: 'Two currencies, live rates, an instant answer.',
    tags: ['finance', 'currency'], category: 'Finance',
    config: { base: 'USD', targets: ['EUR', 'GBP'], amount: 100, showSpark: true },
  },
  {
    id: 'cryptoTicker', name: 'Crypto Ticker', type: 'cryptoTicker', pro: true,
    desc: 'Live prices for the coins you watch, change percent and a quiet sparkline.',
    tags: ['finance', 'crypto'], category: 'Finance',
    config: { symbols: ['BTC', 'ETH', 'SOL'], fiat: 'USD', sparkline: true, refresh: 60 },
  },
  {
    id: 'stockTicker', name: 'Stock Ticker', type: 'stockTicker', pro: true,
    desc: 'A mini watchlist of tickers with daily change and a glance-able trend.',
    tags: ['finance', 'sparkline'], category: 'Finance',
    config: { symbols: ['AAPL', 'MSFT', 'NVDA', 'TSLA'], currency: 'USD', sparkline: true, refresh: 300 },
  },
  {
    id: 'weatherForecast', name: 'Weather Forecast', type: 'weatherForecast', pro: true,
    desc: 'Local conditions, highs and lows, and a clean multi-day outlook.',
    tags: ['weather', 'forecast'], category: 'Daily',
    config: { city: 'Lisbon', units: 'C', days: 4, showHourly: true },
  },
  {
    id: 'onThisDay', name: 'On This Day', type: 'onThisDay', pro: true,
    desc: 'A moment from history that shares today\'s date, refreshed every morning.',
    tags: ['history', 'daily'], category: 'Daily',
    config: { category: 'events', count: 1, language: 'en' },
  },
  {
    id: 'githubHeatmap', name: 'GitHub Heatmap', type: 'githubHeatmap', pro: true,
    desc: 'Your real contribution grid, green squares and current streak, styled to fit the page.',
    tags: ['github', 'heatmap'], category: 'Dev',
    config: { username: 'octocat', scheme: 'github', showStreak: true, year: 2026 },
  },
  {
    id: 'githubStars', name: 'GitHub Stars', type: 'githubStars', pro: true,
    desc: 'A live, animated star count for any repo, with forks and watchers in tow.',
    tags: ['dev', 'github'], category: 'Dev',
    config: { repo: 'facebook/react', showForks: true, animate: true },
  },
  {
    id: 'npmDownloads', name: 'npm Downloads', type: 'npmDownloads', pro: true,
    desc: 'Weekly downloads for a package with a trend arrow and a small bar history.',
    tags: ['dev', 'stats'], category: 'Dev',
    config: { package: 'react', period: 'week', showChart: true },
  },
  {
    id: 'latestRelease', name: 'Latest Release', type: 'latestRelease', pro: true,
    desc: 'The newest version of a repo or package, date and a copyable install line.',
    tags: ['dev', 'release'], category: 'Dev',
    config: { source: 'npm', id: 'astro', installCmd: '', showInstall: true, showNotes: true },
  },
  {
    id: 'buildStatus', name: 'Build Status', type: 'buildStatus', pro: true,
    desc: 'The latest pipeline result — passing, failing or running — with branch and timestamp.',
    tags: ['Dev', 'CI/CD'], category: 'Dev',
    config: { repo: 'acme/payments-api', branch: 'main', provider: 'github', status: 'passing' },
  },
  {
    id: 'uptimeMonitor', name: 'Uptime Monitor', type: 'uptimeMonitor', pro: true,
    desc: 'Green, amber or red dots for the endpoints you watch, with rolling 24-hour uptime.',
    tags: ['dev', 'monitoring'], category: 'Dev',
    config: { title: 'Status', endpoints: ['api.acme.io', 'app.acme.io', 'cdn.acme.io', 'db.acme.io', 'auth.acme.io'], interval: 300, timeout: 5, bars: true },
  },
  {
    id: 'subscriberCount', name: 'Subscriber Count', type: 'subscriberCount', pro: true,
    desc: 'A big live subscriber number with a flip-counter roll and your channel avatar.',
    tags: ['creator', 'social'], category: 'Creator',
    config: { platform: 'youtube', handle: '@channel', style: 'odometer', refresh: 30 },
  },
  {
    id: 'followerGoal', name: 'Follower Goal', type: 'followerGoal', pro: true,
    desc: 'A ring toward your next follower milestone, current and target side by side.',
    tags: ['creator', 'milestone'], category: 'Creator',
    config: { platform: 'youtube', handle: '@channel', goal: 100000, style: 'ring' },
  },
  {
    id: 'twitchStatus', name: 'Twitch Status', type: 'twitchStatus', pro: true,
    desc: 'Whether a channel is live right now, with viewers and the current title.',
    tags: ['creator', 'twitch'], category: 'Creator',
    config: { channel: 'channelname', showViewers: true, offlineMessage: 'Offline' },
  },
  {
    id: 'spotifyEmbed', name: 'Spotify Player', type: 'spotifyEmbed', pro: true,
    desc: 'A playlist, album or track tucked into the page, compact or full.',
    tags: ['creator', 'music'], category: 'Creator',
    config: { url: 'spotify:playlist:37i9dQZF1DX0XUsuxWHRQd', compact: false, theme: 'dark' },
  },
  {
    id: 'hitCounter', name: 'Visit Counter', type: 'hitCounter', pro: true,
    desc: 'A small odometer badge tallying views, ticking up as people land.',
    tags: ['odometer', 'analytics'], category: 'Data',
    config: { id: 'my-page', style: 'odometer', label: 'views', showToday: true, showSpark: true },
  },
  {
    id: 'clock', name: 'World Clock', type: 'clock', pro: false,
    desc: 'A crisp live clock with timezone, 12/24h and optional date.',
    tags: ['Time', 'Dashboard'], category: 'Time',
    config: { tz: 'America/New_York', format: '12', seconds: true, showDate: true, label: '' },
  },
  {
    id: 'countdown', name: 'Countdown', type: 'countdown', pro: false,
    desc: 'Days, hours and minutes ticking down to any moment.',
    tags: ['Time', 'Goals'], category: 'Time',
    config: { target: '', title: 'Launch Day' },
  },
  {
    id: 'pomodoro', name: 'Focus Timer', type: 'pomodoro', pro: false,
    desc: 'A pomodoro timer with work / break cycles and a progress ring.',
    tags: ['Focus', 'Productivity'], category: 'Productivity',
    config: { work: 25, brk: 5, autostart: false },
  },
  {
    id: 'weather', name: 'Weather', type: 'weather', pro: true,
    desc: 'Local conditions, highs & lows and a clean four-day outlook.',
    tags: ['Daily', 'Pro'], category: 'Daily',
    config: { city: 'Lisbon', units: 'C', forecast: true },
  },
  {
    id: 'quote', name: 'Daily Quote', type: 'quote', pro: false,
    desc: 'A rotating line of inspiration, refreshed on demand.',
    tags: ['Daily', 'Calm'], category: 'Daily',
    config: { collection: 'Stoic', author: true },
  },
  {
    id: 'habit', name: 'Habit Streak', type: 'habit', pro: true,
    desc: 'A weekly grid to keep a streak alive, one tap per day.',
    tags: ['Routine', 'Pro'], category: 'Productivity',
    config: { habit: 'Read 20 min', days: 7 },
  },
  {
    id: 'calendar', name: 'Month Calendar', type: 'calendar', pro: false,
    desc: 'The current month at a glance with today highlighted.',
    tags: ['Planning', 'Dashboard'], category: 'Planning',
  },

  {
    id: 'analogClock', name: 'Analog Clock', type: 'analogClock', pro: false,
    desc: 'A sweeping analog face with your timezone, a choice of dials and a single accent.',
    tags: ['time', 'analog'], category: 'Time',
    config: { tz: 'America/New_York', dial: 'minimal', seconds: true, showNumbers: true, label: '' },
  },
  {
    id: 'flipClock', name: 'Flip Clock', type: 'flipClock', pro: false,
    desc: 'A retro split-flap clock that flutters as every minute turns over.',
    tags: ['retro', 'split-flap'], category: 'Time',
    config: { tz: 'local', format: '24', seconds: false, showDate: true },
  },
  {
    id: 'worldClockBoard', name: 'World Clock Board', type: 'worldClockBoard', pro: false,
    desc: 'A row of cities side by side, each with local time and a day-or-night dot.',
    tags: ['time', 'world clock'], category: 'Time',
    config: { cities: ['London', 'New York', 'Tokyo'], format: '12', style: 'digital' },
  },
  {
    id: 'dateCard', name: 'Date Card', type: 'dateCard', pro: false,
    desc: 'A clean lock-screen stack of the day, the date and an optional week number.',
    tags: ['minimal', 'lock-screen'], category: 'Time',
    config: { format: 'long', showWeekNumber: true, showDay: true, accentDay: true },
  },
  {
    id: 'countup', name: 'Count Up', type: 'countup', pro: false,
    desc: 'Days counting up since a date that mattered — sober, together, shipped.',
    tags: ['milestone', 'anniversary'], category: 'Time',
    config: { start: '2023-01-01', title: 'Days together', unit: 'days' },
  },
  {
    id: 'lifeProgress', name: 'Life Progress', type: 'lifeProgress', pro: false,
    desc: 'Quiet bars for the day, week, month, year and life already behind you.',
    tags: ['time', 'progress'], category: 'Time',
    config: { birthDate: '1995-06-01', lifeExpectancy: 85, scopes: ['day', 'week', 'year', 'life'], style: 'bar', title: 'Life in Progress' },
  },
  {
    id: 'yearProgress', name: 'Year Progress', type: 'yearProgress', pro: false,
    desc: 'How much of this year has slipped by, drawn as one honest bar.',
    tags: ['time', 'progress'], category: 'Time',
    config: { scope: 'year', style: 'solid', showPercent: true },
  },
  {
    id: 'lifeInWeeks', name: 'Life in Weeks', type: 'lifeInWeeks', pro: false,
    desc: 'One dot per week of a life, filling in as the weeks quietly pass.',
    tags: ['time', 'mortality'], category: 'Time',
    config: { birthDate: '1995-06-01', lifeExpectancy: 90, filledColor: '#18181a', title: '', showMuted: true },
  },
  {
    id: 'moonPhase', name: 'Moon Phase', type: 'moonPhase', pro: false,
    desc: 'Tonight\'s moon rendered from the sky itself, with phase and illumination.',
    tags: ['astronomy', 'night sky'], category: 'Time',
    config: { hemisphere: 'north', showIllumination: true, showNextPhase: true, style: 'realistic' },
  },
  {
    id: 'dayNightMap', name: 'Day & Night Map', type: 'dayNightMap', pro: false,
    desc: 'A world map shaded by the sun\'s real-time terminator — where it\'s dark right now.',
    tags: ['realtime', 'geography'], category: 'Time',
    config: { mapStyle: 'minimal', showCities: true, twilightBands: false, title: '' },
  },
  {
    id: 'stopwatch', name: 'Stopwatch', type: 'stopwatch', pro: false,
    desc: 'A tap-to-start stopwatch with laps, for anything worth timing.',
    tags: ['time', 'timer'], category: 'Time',
    config: { showLaps: true, format: 'mm:ss.cs' },
  },
  {
    id: 'progressRing', name: 'Goal Ring', type: 'progressRing', pro: false,
    desc: 'A ring that fills toward any number you\'re chasing this week.',
    tags: ['productivity', 'goal'], category: 'Productivity',
    config: { label: 'Pages read', current: 120, target: 300, showPercent: true },
  },
  {
    id: 'progressBar', name: 'Progress Bar', type: 'progressBar', pro: false,
    desc: 'A single clean bar from where you are to where you\'re headed.',
    tags: ['Goals', 'Dashboard'], category: 'Productivity',
    config: { label: 'Q3 goal', current: 40, target: 100, unit: '', style: 'solid', showValues: true },
  },
  {
    id: 'counter', name: 'Tally Counter', type: 'counter', pro: false,
    desc: 'One tap up, one tap down — a counter for reps, cups or wins.',
    tags: ['productivity', 'interactive'], category: 'Productivity',
    config: { label: 'Books', start: 0, step: 1, min: 0, max: null },
  },
  {
    id: 'checklist', name: 'Daily Checklist', type: 'checklist', pro: false,
    desc: 'A short list that ticks off and resets itself every morning.',
    tags: ['productivity', 'interactive'], category: 'Productivity',
    config: { title: 'Today', items: ['Plan day', 'Deep work', 'Inbox zero'], reset: 'daily', showProgress: true },
  },
  {
    id: 'linkButton', name: 'Link Button', type: 'linkButton', pro: false,
    desc: 'A styled button that sends a reader anywhere with one click.',
    tags: ['productivity', 'link'], category: 'Productivity',
    config: { label: 'Book a call', url: 'https://', variant: 'solid', icon: 'bolt', align: 'fill', heading: '', caption: '', showArrow: true, newTab: true },
  },
  {
    id: 'buttonGrid', name: 'Quick Launch', type: 'buttonGrid', pro: false,
    desc: 'A tidy grid of shortcuts that turns a page into a command center.',
    tags: ['launcher', 'shortcuts'], category: 'Productivity',
    config: { title: 'Quick Launch', buttons: [{ label: 'Mail', url: 'https://mail.google.com', icon: 'inbox' }, { label: 'Docs', url: 'https://docs.google.com', icon: 'book' }, { label: 'Calendar', url: 'https://calendar.google.com', icon: 'calendar' }, { label: 'Drive', url: 'https://drive.google.com', icon: 'folder' }, { label: 'Notion', url: 'https://notion.so', icon: 'compass' }, { label: 'GitHub', url: 'https://github.com', icon: 'code' }], columns: 3, layout: 'tile', radius: 14 },
  },
  {
    id: 'focusTimerPro', name: 'Focus Timer Plus', type: 'focusTimerPro', pro: true,
    desc: 'A pomodoro with ambient sound, session counts and a task label to anchor it.',
    tags: ['pomodoro', 'focus'], category: 'Productivity',
    config: { work: 25, brk: 5, longBreak: 15, cycles: 4, sound: 'rain', task: '' },
  },
  {
    id: 'todayHeader', name: 'Day in Progress', type: 'todayHeader', pro: false,
    desc: 'Today, this week, this month and this year, stacked as live bars.',
    tags: ['productivity', 'progress'], category: 'Productivity',
    config: { scopes: ['day', 'week', 'month', 'year'], showPercent: true },
  },
  {
    id: 'miniCalendar', name: 'Mini Calendar', type: 'miniCalendar', pro: false,
    desc: 'A trim month view with today marked and week numbers if you want them.',
    tags: ['calendar', 'month'], category: 'Planning',
    config: { weekStart: 'Mon', showWeekNumbers: false },
  },
  {
    id: 'countdownEvent', name: 'Event Countdown', type: 'countdownEvent', pro: false,
    desc: 'Days, hours and minutes falling toward the date you can\'t wait for.',
    tags: ['countdown', 'planning'], category: 'Planning',
    config: { target: '2026-12-25T00:00', title: 'Holidays', units: ['d','h','m'], showDate: true, doneText: "It's here!" },
  },
  {
    id: 'weekPlanner', name: 'Week Planner', type: 'weekPlanner', pro: false,
    desc: 'Seven columns for the week ahead, each holding a few quick notes.',
    tags: ['planning', 'weekly'], category: 'Planning',
    config: { title: 'This Week', weekStart: 'Mon', notes: {}, accentToday: true },
  },
  {
    id: 'savingsRing', name: 'Savings Goal', type: 'savingsRing', pro: false,
    desc: 'A ring filling toward a savings target, with the finish line in sight.',
    tags: ['finance', 'progress'], category: 'Finance',
    config: { goal: 'Emergency fund', target: 10000, current: 4200, currency: 'USD' },
  },
  {
    id: 'budgetRing', name: 'Budget Ring', type: 'budgetRing', pro: false,
    desc: 'A donut that fills as you spend, turning amber then red near the limit.',
    tags: ['finance', 'budget'], category: 'Finance',
    config: { category: 'Groceries', budget: 600, spent: 410, currency: 'USD', warnAt: 80 },
  },
  {
    id: 'subscriptionCounter', name: 'Subscriptions', type: 'subscriptionCounter', pro: false,
    desc: 'Every recurring charge totalled by month and year, with the next bill close behind.',
    tags: ['finance', 'budget'], category: 'Finance',
    config: { items: [{ name: 'Netflix', amount: 15.49, cycle: 'monthly', day: 5 }, { name: 'Spotify', amount: 11.99, cycle: 'monthly', day: 18 }, { name: 'iCloud+', amount: 2.99, cycle: 'monthly', day: 1 }, { name: 'Adobe CC', amount: 263.88, cycle: 'yearly', day: 22, month: 9 }], currency: 'USD', view: 'monthly' },
  },
  {
    id: 'netWorth', name: 'Net Worth', type: 'netWorth', pro: false,
    desc: 'Assets minus liabilities, traced as a trendline you can feel grow.',
    tags: ['finance', 'trend'], category: 'Finance',
    config: { title: '', assets: [42000, 18500, 9500], liabilities: [12000, 3400], currency: 'USD', range: '12m' },
  },
  {
    id: 'debtPayoff', name: 'Debt Payoff', type: 'debtPayoff', pro: false,
    desc: 'A bar per debt, ordered snowball or avalanche, with the payoff date in view.',
    tags: ['finance', 'planner'], category: 'Finance',
    config: { debts: [{ id: 'd1', name: 'Credit Card', balance: 4200, rate: 22.9, min: 90 }, { id: 'd2', name: 'Car Loan', balance: 8500, rate: 6.4, min: 210 }, { id: 'd3', name: 'Student Loan', balance: 14200, rate: 4.5, min: 160 }], strategy: 'avalanche', extra: 150, currency: 'USD', title: 'Debt Free' },
  },
  {
    id: 'expenseSplitter', name: 'Expense Splitter', type: 'expenseSplitter', pro: false,
    desc: 'Split a bill across friends and see exactly who owes whom.',
    tags: ['finance', 'interactive'], category: 'Finance',
    config: { title: 'Dinner', total: 120, currency: '$', people: ['Alex', 'Bea', 'Cam'], mode: 'even', tip: 10, shares: [1, 1, 1] },
  },
  {
    id: 'habitGrid', name: 'Habit Grid', type: 'habitGrid', pro: true,
    desc: 'A month of squares per habit, each tap building the streak you\'re proud of.',
    tags: ['health', 'tracker'], category: 'Health',
    config: { habits: ['Read', 'Workout', 'Meditate'], period: 'month', showStreak: true },
  },
  {
    id: 'heatmapTracker', name: 'Consistency Heatmap', type: 'heatmapTracker', pro: true,
    desc: 'A GitHub-style grid where color deepens the more consistent you are.',
    tags: ['habits', 'consistency'], category: 'Health',
    config: { label: 'Practice', scheme: 'green', intensity: 4, year: 2026 },
  },
  {
    id: 'waterTracker', name: 'Water Tracker', type: 'waterTracker', pro: false,
    desc: 'Tap to fill each glass toward today\'s goal — it resets at midnight.',
    tags: ['health', 'hydration'], category: 'Health',
    config: { goalGlasses: 8, glassMl: 250, icon: 'droplet' },
  },
  {
    id: 'moodTracker', name: 'Mood Tracker', type: 'moodTracker', pro: false,
    desc: 'One emoji a day builds a calm, colorful map of your month.',
    tags: ['health', 'habit'], category: 'Health',
    config: { title: 'Mood', view: 'calendar', moods: [{ emoji: '😀', label: 'Great', color: '#1F8A5B' }, { emoji: '🙂', label: 'Good', color: '#7BB661' }, { emoji: '😐', label: 'Okay', color: '#E0A800' }, { emoji: '😕', label: 'Low', color: '#E07B39' }, { emoji: '😢', label: 'Bad', color: '#C0455B' }] },
  },
  {
    id: 'sleepTracker', name: 'Sleep Tracker', type: 'sleepTracker', pro: false,
    desc: 'Log bedtime and wake, see hours slept against your goal and any debt owed.',
    tags: ['health', 'sleep'], category: 'Health',
    config: { goalHours: 8, bedtime: '23:00', wakeTime: '07:00', showDebt: true },
  },
  {
    id: 'stepGoal', name: 'Step Goal', type: 'stepGoal', pro: false,
    desc: 'A ring toward your daily steps, with distance and calories worked out for you.',
    tags: ['health', 'fitness'], category: 'Health',
    config: { goal: 10000, current: 6400, stride: 0.75, unit: 'km' },
  },
  {
    id: 'calorieRing', name: 'Calorie Ring', type: 'calorieRing', pro: false,
    desc: 'A move-style ring of calories with the macros broken out beneath.',
    tags: ['health', 'nutrition'], category: 'Health',
    config: { goal: 2200, consumed: 1450, carbs: 160, protein: 110, fat: 55 },
  },
  {
    id: 'fastingTimer', name: 'Fasting Timer', type: 'fastingTimer', pro: false,
    desc: 'A ring for your fasting window — 16:8, 18:6 or your own — counting down to the next meal.',
    tags: ['health', 'fasting'], category: 'Health',
    config: { protocol: '16:8', fastStart: '20:00', showWindow: true },
  },
  {
    id: 'bmiCalculator', name: 'BMI Calculator', type: 'bmiCalculator', pro: false,
    desc: 'Height and weight in, your number placed on a clear, kind scale.',
    tags: ['health', 'calculator'], category: 'Health',
    config: { height: 175, weight: 70, units: 'metric', showScale: true },
  },
  {
    id: 'breathingCircle', name: 'Breathing Circle', type: 'breathingCircle', pro: false,
    desc: 'A circle that grows and shrinks to pace your breath — box, 4-7-8 or your own.',
    tags: ['breathing', 'calm'], category: 'Health',
    config: { pattern: 'box', inhale: 4, hold: 4, exhale: 4, hold2: 0, showLabel: true },
  },
  {
    id: 'workoutStreak', name: 'Workout Streak', type: 'workoutStreak', pro: false,
    desc: 'A flame counter for back-to-back training days, longest streak kept on record.',
    tags: ['fitness', 'streak'], category: 'Health',
    config: { restDaysAllowed: 1, showLongest: true, weekStart: 'Mon' },
  },
  {
    id: 'greetingBanner', name: 'Greeting Banner', type: 'greetingBanner', pro: false,
    desc: 'A warm "Good morning, name" that shifts with the hour, with the date alongside.',
    tags: ['daily', 'greeting'], category: 'Daily',
    config: { name: 'Alex', style: 'timeOfDay', fixedGreeting: 'Hello', tagline: 'Let\'s make it count', showDate: true },
  },
  {
    id: 'affirmation', name: 'Daily Affirmation', type: 'affirmation', pro: false,
    desc: 'One steadying line a day, chosen by the date so it changes each morning.',
    tags: ['daily', 'mindfulness'], category: 'Daily',
    config: { category: 'self-care', rotation: 'daily', showAuthor: false },
  },
  {
    id: 'colorPalette', name: 'Color Palette', type: 'colorPalette', pro: false,
    desc: 'A row of swatches with hex values, each one click-to-copy.',
    tags: ['dev', 'color'], category: 'Dev',
    config: { title: '', colors: ['#2A6FDB', '#1F8A5B', '#E0A93B'], layout: 'row', format: 'hex', copyable: true },
  },
  {
    id: 'contentCalendar', name: 'Content Calendar', type: 'contentCalendar', pro: false,
    desc: 'A month grid dotted with planned and published posts, color-coded by platform.',
    tags: ['creator', 'planning'], category: 'Creator',
    config: { weekStart: 'Mon', entries: [{ date: '2026-06-05', title: 'Summer reel', platform: 'instagram', status: 'published' }, { date: '2026-06-12', title: 'Tutorial drop', platform: 'youtube', status: 'planned' }, { date: '2026-06-12', title: 'Behind the scenes', platform: 'tiktok', status: 'planned' }, { date: '2026-06-18', title: 'Weekly digest', platform: 'newsletter', status: 'planned' }, { date: '2026-06-24', title: 'Case study', platform: 'linkedin', status: 'planned' }], platformColors: {} },
  },
  {
    id: 'postingStreak', name: 'Posting Streak', type: 'postingStreak', pro: false,
    desc: 'A flame for consecutive posting days, current and longest streak kept in view.',
    tags: ['creator', 'streak'], category: 'Creator',
    config: { postDates: [], resetHour: 4, showLongest: true },
  },
  {
    id: 'photoFrame', name: 'Photo Frame', type: 'photoFrame', pro: false,
    desc: 'A framed photo or gentle slideshow from your own image links, Polaroid optional.',
    tags: ['slideshow', 'polaroid'], category: 'Creator',
    config: { images: [], frame: 'polaroid', interval: 6, caption: '' },
  },
  {
    id: 'quoteCard', name: 'Quote Card', type: 'quoteCard', pro: false,
    desc: 'A rotating line of inspiration over a quiet backdrop, refreshed on demand.',
    tags: ['inspiration', 'minimal'], category: 'Fun',
    config: { category: 'motivation', rotation: 'daily', showAuthor: true },
  },
  {
    id: 'diceRoller', name: 'Dice Roller', type: 'diceRoller', pro: false,
    desc: 'Tap to tumble a die or a whole set, with the total tallied for you.',
    tags: ['fun', 'random'], category: 'Fun',
    config: { count: 2, sides: 6, showTotal: true },
  },
  {
    id: 'magic8Ball', name: 'Magic 8-Ball', type: 'magic8Ball', pro: false,
    desc: 'Ask, shake and let the floating triangle deliver its verdict.',
    tags: ['fun', 'interactive'], category: 'Fun',
    config: { answers: ['It is certain', 'Without a doubt', 'Yes definitely', 'Most likely', 'Signs point to yes', 'Reply hazy, try again', 'Ask again later', 'Cannot predict now', "Don't count on it", 'My reply is no', 'Very doubtful', 'Outlook not so good'], ballColor: '#18181a' },
  },
  {
    id: 'asciiBanner', name: 'ASCII Banner', type: 'asciiBanner', pro: false,
    desc: 'Your words rendered as big figlet-style letters in a monospace block.',
    tags: ['banner', 'monospace'], category: 'Fun',
    config: { text: 'HELLO', font: 'standard', align: 'left', showText: false, label: '' },
  },
  {
    id: 'metronome', name: 'Metronome', type: 'metronome', pro: false,
    desc: 'A swinging pendulum at the BPM you set, with an optional click.',
    tags: ['music', 'rhythm'], category: 'Fun',
    config: { bpm: 120, timeSignature: '4/4', sound: true },
  },
  {
    id: 'gradientMesh', name: 'Gradient Mesh', type: 'gradientMesh', pro: true,
    desc: 'A slow, flowing mesh of color — an ambient header that breathes.',
    tags: ['ambient', 'gradient'], category: 'Fun',
    config: { colors: ['#C2417B', '#2A6FDB', '#1F8A5B'], speed: 1, grain: true, dots: true, label: '', sublabel: '' },
  },
  {
    id: 'starfield', name: 'Starfield', type: 'starfield', pro: true,
    desc: 'A drifting field of stars with gentle parallax, light enough to leave running.',
    tags: ['ambient', 'animated'], category: 'Fun',
    config: { particles: 120, starColor: '#ffffff', speed: 0.5, twinkle: true, shooting: true, label: '' },
  },
  {
    id: 'lavaLamp', name: 'Lava Lamp', type: 'lavaLamp', pro: true,
    desc: 'Gooey blobs that rise and fall in a retro lamp, colors entirely yours.',
    tags: ['retro', 'ambient'], category: 'Fun',
    config: { blobColor: '#E0563B', liquidColor: '#3a1a55', blobCount: 6, speed: 1, label: '' },
  },
  {
    id: 'imageGallery', name: 'Image Gallery', type: 'imageGallery', pro: false,
    desc: 'An album of your images as a grid, carousel or slideshow.',
    tags: ['album', 'carousel'], category: 'Fun',
    config: { images: [], layout: 'carousel', autoplay: true, captions: false, speed: 4 },
  },
  {
    id: 'visitedMap', name: 'Visited Places', type: 'visitedMap', pro: true,
    desc: 'A world map lighting up every country you\'ve set foot in, with a running count.',
    tags: ['map', 'travel'], category: 'Fun',
    config: { countries: [], highlight: '#1F8A5B', showCount: true },
  },
  {
    id: 'ambientPlayer', name: 'Ambient Player', type: 'ambientPlayer', pro: true,
    desc: 'Cozy soundscapes — café, rain, city — looped to set the working mood.',
    tags: ['audio', 'focus'], category: 'Fun',
    config: { title: 'Ambient', mix: ['cafe', 'rain'], volume: 0.6, theme: 'warm' },
  },
  {
    id: 'calculator', name: 'Calculator', type: 'calculator', pro: false,
    desc: 'A neat little calculator — basic, percentage, tip — right where you need it.',
    tags: ['data', 'tools'], category: 'Data',
    config: { mode: 'basic', precision: 2, currency: '$', defaultTip: 18 },
  },
  {
    id: 'unitConverter', name: 'Unit Converter', type: 'unitConverter', pro: false,
    desc: 'Switch between length, weight, temperature and more in a tap.',
    tags: ['data', 'tools'], category: 'Data',
    config: { category: 'length', from: 'km', to: 'mi', amount: 1, showCategories: true },
  },
];

const WIDGET_CATEGORIES = ['All', 'Time', 'Productivity', 'Daily', 'Planning', 'Finance', 'Health', 'Dev', 'Creator', 'Fun', 'Data'];

const TIMEZONES = [
  { v: 'America/Los_Angeles', l: 'Los Angeles' },
  { v: 'America/New_York', l: 'New York' },
  { v: 'America/Sao_Paulo', l: 'São Paulo' },
  { v: 'Europe/London', l: 'London' },
  { v: 'Europe/Lisbon', l: 'Lisbon' },
  { v: 'Europe/Berlin', l: 'Berlin' },
  { v: 'Africa/Nairobi', l: 'Nairobi' },
  { v: 'Asia/Dubai', l: 'Dubai' },
  { v: 'Asia/Kolkata', l: 'Mumbai' },
  { v: 'Asia/Singapore', l: 'Singapore' },
  { v: 'Asia/Tokyo', l: 'Tokyo' },
  { v: 'Australia/Sydney', l: 'Sydney' },
];

const FONTS = [
  { v: 'sans', l: 'Hanken Sans', stack: "'Hanken Grotesk', system-ui, sans-serif" },
  { v: 'serif', l: 'Newsreader', stack: "'Newsreader', Georgia, serif" },
  { v: 'mono', l: 'Geist Mono', stack: "'Geist Mono', monospace" },
  { v: 'rounded', l: 'Quicksand', stack: "'Quicksand', system-ui, sans-serif" },
  { v: 'display', l: 'Fraunces', stack: "'Fraunces', Georgia, serif" },
];

const ACCENTS = ['#18181a', '#E0603A', '#2A6FDB', '#1F8A5B', '#6D4FD6', '#C2417B', '#0E9DA6', '#B07D2E'];

const QUOTES = {
  Stoic: [
    { t: 'We suffer more often in imagination than in reality.', a: 'Seneca' },
    { t: 'You have power over your mind — not outside events.', a: 'Marcus Aurelius' },
    { t: 'No man is free who is not master of himself.', a: 'Epictetus' },
    { t: 'Waste no more time arguing what a good person should be. Be one.', a: 'Marcus Aurelius' },
  ],
  Focus: [
    { t: 'It is not enough to be busy; the question is what we are busy about.', a: 'Henry David Thoreau' },
    { t: 'Concentrate all your thoughts upon the work at hand.', a: 'Alexander Graham Bell' },
    { t: 'Simplicity is the soul of efficiency.', a: 'Austin Freeman' },
  ],
  Calm: [
    { t: 'Almost everything will work again if you unplug it for a few minutes.', a: 'Anne Lamott' },
    { t: 'Nature does not hurry, yet everything is accomplished.', a: 'Lao Tzu' },
    { t: 'Quiet the mind and the soul will speak.', a: 'Ma Jaya' },
  ],
};

const WEATHER_DATA = {
  Lisbon: { cond: 'Clear', icon: 'sun', c: 23, hi: 25, lo: 16, fc: [['Mon', 'sun', 25], ['Tue', 'cloud', 22], ['Wed', 'rain', 19], ['Thu', 'sun', 24]] },
  London: { cond: 'Light rain', icon: 'rain', c: 14, hi: 16, lo: 9, fc: [['Mon', 'rain', 15], ['Tue', 'cloud', 16], ['Wed', 'cloud', 14], ['Thu', 'sun', 18]] },
  Tokyo: { cond: 'Cloudy', icon: 'cloud', c: 19, hi: 21, lo: 13, fc: [['Mon', 'cloud', 20], ['Tue', 'sun', 23], ['Wed', 'sun', 24], ['Thu', 'rain', 18]] },
  'New York': { cond: 'Sunny', icon: 'sun', c: 21, hi: 24, lo: 12, fc: [['Mon', 'sun', 24], ['Tue', 'sun', 26], ['Wed', 'cloud', 22], ['Thu', 'rain', 17]] },
};
const WEATHER_CITIES = Object.keys(WEATHER_DATA);

const ICON_SET = [
  { k: 'home', l: 'Home' }, { k: 'star', l: 'Star' }, { k: 'heart', l: 'Heart' },
  { k: 'calendar', l: 'Calendar' }, { k: 'clock', l: 'Clock' }, { k: 'target', l: 'Target' },
  { k: 'rocket', l: 'Rocket' }, { k: 'book', l: 'Notebook' }, { k: 'folder', l: 'Folder' },
  { k: 'bolt', l: 'Energy' }, { k: 'leaf', l: 'Leaf' }, { k: 'flame', l: 'Streak' },
  { k: 'moon', l: 'Moon' }, { k: 'sun', l: 'Sun' }, { k: 'cloud', l: 'Cloud' },
  { k: 'check', l: 'Tasks' }, { k: 'inbox', l: 'Inbox' }, { k: 'compass', l: 'Compass' },
  { k: 'gem', l: 'Gem' }, { k: 'coffee', l: 'Coffee' }, { k: 'music', l: 'Music' },
  { k: 'camera', l: 'Camera' }, { k: 'globe', l: 'Globe' }, { k: 'pin', l: 'Place' },
  { k: 'tag', l: 'Tag' }, { k: 'bell', l: 'Reminders' }, { k: 'bookmark', l: 'Saved' },
  { k: 'chart', l: 'Metrics' }, { k: 'wallet', l: 'Budget' }, { k: 'dumbbell', l: 'Fitness' },
  { k: 'palette', l: 'Design' }, { k: 'code', l: 'Code' }, { k: 'lightbulb', l: 'Ideas' },
  { k: 'gift', l: 'Gifts' }, { k: 'plane', l: 'Travel' }, { k: 'flag', l: 'Goals' },
];

const ICON_STYLES = [
  { v: 'outline', l: 'Outline' },
  { v: 'filled', l: 'Filled' },
  { v: 'duotone', l: 'Duotone' },
  { v: 'gradient', l: 'Gradient' },
];

const PACKS = [
  {
    id: 'student', name: 'Student Dashboard', kicker: 'For focused semesters',
    desc: 'Everything to run a term — a class calendar, a focus timer, and a reading streak that keeps you honest.',
    accent: '#2A6FDB', icons: ['book', 'calendar', 'clock', 'check', 'target', 'coffee'],
    widgets: ['calendar', 'pomodoro', 'habit'], pro: false,
  },
  {
    id: 'founder', name: 'Founder OS', kicker: 'Run the company from one page',
    desc: 'Timezones for a distributed team, a countdown to launch, and metrics you check before coffee.',
    accent: '#18181a', icons: ['rocket', 'chart', 'globe', 'bolt', 'flag', 'wallet'],
    widgets: ['clock', 'countdown', 'weather'],
  },
  {
    id: 'habit', name: 'Habit System', kicker: 'Small reps, every day',
    desc: 'A calm system for routines — streaks, a daily line of inspiration, and a timer to start before you think.',
    accent: '#1F8A5B', icons: ['flame', 'leaf', 'check', 'dumbbell', 'heart', 'sun'],
    widgets: ['habit', 'quote', 'pomodoro'], pro: false,
  },
  {
    id: 'creator', name: 'Creator Studio', kicker: 'Ship the calendar',
    desc: 'A content rhythm: a posting countdown, a month view, and a quote to break the blank page.',
    accent: '#C2417B', icons: ['camera', 'palette', 'music', 'bolt', 'star', 'gem'],
    widgets: ['countdown', 'calendar', 'quote'],
  },
];

/* ============================================================
   ICON LIBRARY
   Each icon = { body:[closed fillable paths], detail:[lines on top] }
   Variants: outline · filled · duotone · gradient
   ============================================================ */

const ICON_PATHS = {
  home: { body: ['M3.7 11 L12 4 L20.3 11 V19.5 a1.2 1.2 0 0 1 -1.2 1.2 H4.9 A1.2 1.2 0 0 1 3.7 19.5 Z'], detail: ['M9.6 20.7 V14 h4.8 v6.7'] },
  star: { body: ['M12 3 L14.6 8.7 L20.8 9.5 L16.2 13.8 L17.5 20 L12 16.8 L6.5 20 L7.8 13.8 L3.2 9.5 L9.4 8.7 Z'] },
  heart: { body: ['M12 20.3 C12 20.3 3.8 14.7 3.8 9.2 A4.4 4.4 0 0 1 12 6.8 A4.4 4.4 0 0 1 20.2 9.2 C20.2 14.7 12 20.3 12 20.3 Z'] },
  calendar: { body: ['M4 7.2 a1.6 1.6 0 0 1 1.6-1.6 h12.8 a1.6 1.6 0 0 1 1.6 1.6 V19.4 a1.6 1.6 0 0 1 -1.6 1.6 H5.6 A1.6 1.6 0 0 1 4 19.4 Z'], detail: ['M4 10.4 H20', 'M8.2 4 V7.2', 'M15.8 4 V7.2'] },
  clock: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M12 7.4 V12 L15.6 13.9'] },
  target: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M12 16.6 a4.6 4.6 0 1 1 0.01 0', 'M12 12.2 h0.01'] },
  rocket: { body: ['M12 3.2 C15.4 5.2 16.9 9.2 16.4 14 L13 16.8 H11 L7.6 14 C7.1 9.2 8.6 5.2 12 3.2 Z'], detail: ['M12 9.6 a1.7 1.7 0 1 0 0.01 0', 'M11 16.8 L9 21', 'M13 16.8 L15 21'] },
  book: { body: ['M6 3.8 H17 a1.5 1.5 0 0 1 1.5 1.5 V20.2 H7.5 A1.5 1.5 0 0 1 6 18.7 Z'], detail: ['M9 3.8 V20.2', 'M11.6 8.4 H15.8', 'M11.6 11.6 H15.8'] },
  folder: { body: ['M3.5 7 a1.5 1.5 0 0 1 1.5-1.5 h4 l2 2 h7.5 a1.5 1.5 0 0 1 1.5 1.5 V18 a1.5 1.5 0 0 1 -1.5 1.5 H5 A1.5 1.5 0 0 1 3.5 18 Z'] },
  bolt: { body: ['M13 2.5 L5 13 h5 l-1 8.5 L19 11 h-5 Z'] },
  leaf: { body: ['M4.5 19.5 C4.5 11 10 5 20 4.5 C20 14 14.5 19.5 4.5 19.5 Z'], detail: ['M4.5 19.5 C8 15 12 11.5 16.5 9'] },
  flame: { body: ['M12 21 C8.4 21 6 18.5 6 15 C6 11 9 9 9.5 5 C12 7 13 8.5 13 10.5 C14 9.5 14.5 8.5 14.5 7 C16.5 9 18 12 18 15 C18 18.5 15.6 21 12 21 Z'] },
  moon: { body: ['M20 14.5 A8.5 8.5 0 1 1 10 4 A6.8 6.8 0 0 0 20 14.5 Z'] },
  sun: { body: ['M12 16.5 a4.5 4.5 0 1 1 0.01 0 Z'], detail: ['M12 2.5 V5', 'M12 19 V21.5', 'M2.5 12 H5', 'M19 12 H21.5', 'M5.2 5.2 L7 7', 'M17 17 L18.8 18.8', 'M18.8 5.2 L17 7', 'M7 17 L5.2 18.8'] },
  cloud: { body: ['M7 19 a4.2 4.2 0 0 1 -0.4 -8.4 A5 5 0 0 1 16.4 9.4 A3.8 3.8 0 0 1 16.8 19 Z'] },
  check: { body: ['M5 12 a7 7 0 1 1 0.01 0 Z'], detail: ['M8.5 12.2 L11 14.7 L15.6 9.6'] },
  inbox: { body: ['M3.6 13 L6.4 5.4 a1.5 1.5 0 0 1 1.4-1 h8.4 a1.5 1.5 0 0 1 1.4 1 L20.4 13 V18.5 a1.5 1.5 0 0 1 -1.5 1.5 H5.1 A1.5 1.5 0 0 1 3.6 18.5 Z'], detail: ['M3.6 13 H8 a1 1 0 0 1 1 1 a3 3 0 0 0 6 0 a1 1 0 0 1 1 -1 H20.4'] },
  compass: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z'] },
  gem: { body: ['M6 4.5 H18 L21.5 9.5 L12 21 L2.5 9.5 Z'], detail: ['M2.5 9.5 H21.5', 'M9 4.5 L7.5 9.5 L12 21', 'M15 4.5 L16.5 9.5 L12 21'] },
  coffee: { body: ['M5 8.5 H17 V15 a4 4 0 0 1 -4 4 H9 a4 4 0 0 1 -4 -4 Z'], detail: ['M17 9.5 h1.8 a2.6 2.6 0 0 1 0 5.2 H17', 'M8.5 3 V5', 'M12 3 V5'] },
  music: { body: ['M9 18 a2.5 2.5 0 1 1 -0.01 0 Z', 'M18 15.5 a2.5 2.5 0 1 1 -0.01 0 Z'], detail: ['M11.5 18 V6 L20.5 4 V15.5', 'M11.5 9 L20.5 7'] },
  camera: { body: ['M3.6 8.5 a1.5 1.5 0 0 1 1.5-1.5 H8 l1.5-2 h5 L16 7 h3 a1.5 1.5 0 0 1 1.5 1.5 V18 a1.5 1.5 0 0 1 -1.5 1.5 H5.1 A1.5 1.5 0 0 1 3.6 18 Z'], detail: ['M12 16.8 a3.6 3.6 0 1 1 0.01 0'] },
  globe: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M3.2 12 H20.8', 'M12 3 C8 6 8 18 12 21 C16 18 16 6 12 3 Z'] },
  pin: { body: ['M12 21.5 C7 16.5 5.5 13 5.5 9.8 A6.5 6.5 0 0 1 18.5 9.8 C18.5 13 17 16.5 12 21.5 Z'], detail: ['M12 12.3 a2.6 2.6 0 1 1 0.01 0'] },
  tag: { body: ['M4 11 V4.8 a1 1 0 0 1 1-1 H11 L20 12.8 a1.4 1.4 0 0 1 0 2 L14.8 20 a1.4 1.4 0 0 1 -2 0 Z'], detail: ['M8 8 h0.01'] },
  bell: { body: ['M6 17.5 C6.8 16.5 7.5 15 7.5 12 C7.5 8 9.5 5.5 12 5.5 C14.5 5.5 16.5 8 16.5 12 C16.5 15 17.2 16.5 18 17.5 Z'], detail: ['M10 20 a2 2 0 0 0 4 0', 'M12 3.2 V5.5'] },
  bookmark: { body: ['M6 3.8 h12 a0.8 0.8 0 0 1 0.8 0.8 V20.5 L12 16.5 L5.2 20.5 V4.6 A0.8 0.8 0 0 1 6 3.8 Z'] },
  chart: { body: ['M5 19 V11 h3.5 V19 Z', 'M10.2 19 V5 h3.5 V19 Z', 'M15.5 19 V14 H19 V19 Z'] },
  wallet: { body: ['M4 7.5 a1.6 1.6 0 0 1 1.6-1.6 h11.8 a1.6 1.6 0 0 1 1.6 1.6 V18 a1.6 1.6 0 0 1 -1.6 1.6 H5.6 A1.6 1.6 0 0 1 4 18 Z'], detail: ['M15.5 11 a1.6 1.6 0 0 0 0 3.2 H20.5 V11 Z', 'M16.8 12.6 h0.01'] },
  dumbbell: { body: ['M3 9.5 h2.5 v5 H3 Z', 'M18.5 9.5 H21 v5 h-2.5 Z', 'M6.5 8.5 h2 v7 h-2 Z', 'M15.5 8.5 h2 v7 h-2 Z'], detail: ['M8.5 12 H15.5'] },
  palette: { body: ['M12 21 C6.8 21 3 17 3 12 A9 9 0 0 1 21 12 C21 14.8 18.8 16 17 16 H15 a1.5 1.5 0 0 0 -1 2.6 A2 2 0 0 1 12 21 Z'], detail: ['M7.5 12 h0.01', 'M9.5 8 h0.01', 'M14 7.5 h0.01', 'M16.5 11 h0.01'] },
  code: { body: [], detail: ['M9 7 L4 12 L9 17', 'M15 7 L20 12 L15 17', 'M13 4.5 L11 19.5'] },
  lightbulb: { body: ['M8 14.5 C6.2 13.2 5 11.2 5 9 A7 7 0 0 1 19 9 C19 11.2 17.8 13.2 16 14.5 V17 H8 Z'], detail: ['M9.5 20 H14.5', 'M10 17 H14'] },
  gift: { body: ['M4.5 10 H19.5 V20 a1 1 0 0 1 -1 1 H5.5 a1 1 0 0 1 -1 -1 Z'], detail: ['M4 7 a1 1 0 0 1 1-1 H19 a1 1 0 0 1 1 1 V10 H4 Z', 'M12 6 V21', 'M12 6 C12 6 10 2.5 8 3.5 C6 4.5 8.5 6 12 6 Z', 'M12 6 C12 6 14 2.5 16 3.5 C18 4.5 15.5 6 12 6 Z'] },
  plane: { body: ['M21 6 a1.6 1.6 0 0 0 -2.2 -1.5 L13 7 L5 4.5 L3.2 6.3 L9 10 L6 13 H3.5 L2.5 14.8 L6.5 16.5 L8.2 20.5 L10 19.5 V17 L13 14 L16.7 19.8 L18.5 18 L16 10 Z'] },
  flag: { body: ['M6 21 V4 a1 1 0 0 1 1-1 h11.5 a0.6 0.6 0 0 1 0.5 1 L17 7 l2 3 a0.6 0.6 0 0 1 -0.5 1 H6 Z'], detail: ['M6 13 H18.5'] },
};

function lighten(hex, amt) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  let r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function luminance(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16) / 255, g = parseInt(n.slice(2, 4), 16) / 255, b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function onColor(hex) { return luminance(hex) > 0.62 ? '#1a1a18' : '#ffffff'; }

let __gid = 0;
function Icon({ name, color = '#18181a', variant = 'outline', size = 24, sw = 1.7 }) {
  const spec = ICON_PATHS[name] || ICON_PATHS.star;
  const body = spec.body || [], detail = spec.detail || [];
  const gid = useMemo(() => 'ig' + (++__gid), []);
  const onc = onColor(color);
  let bodyFill = 'none', bodyStroke = color, detailStroke = color, defs = null;

  if (variant === 'filled') { bodyFill = color; detailStroke = onc; }
  else if (variant === 'duotone') { bodyFill = color; bodyStroke = color; detailStroke = onc; defs = null; }
  else if (variant === 'gradient') {
    bodyFill = `url(#${gid})`; detailStroke = onc; bodyStroke = 'none';
    defs = (
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lighten(color, 0.28)} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
    );
  }

  const isDuo = variant === 'duotone';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {defs}
      {isDuo && body.map((d, i) => <path key={'soft' + i} d={d} fill={color} opacity="0.18" />)}
      {body.map((d, i) => (
        <path key={'b' + i} d={d}
          fill={isDuo ? 'none' : bodyFill}
          stroke={variant === 'outline' || isDuo ? color : (variant === 'gradient' ? 'none' : 'none')}
          strokeWidth={sw} />
      ))}
      {detail.map((d, i) => (
        <path key={'d' + i} d={d} fill="none" stroke={variant === 'outline' || isDuo ? color : detailStroke} strokeWidth={sw} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------
   LibIcon — renders the generated 500+ library (Phosphor/Tabler).
   Each icon carries per-weight inner SVG markup (o/f/d) on its own
   viewBox; we recolor via CSS `color` (markup uses currentColor) and
   derive the gradient style from the fill markup. Kept separate from
   the legacy hand-authored `Icon` so the widgets never regress.
   ------------------------------------------------------------ */
function LibIcon({ icon, color = '#18181a', variant = 'outline', size = 38 }) {
  const ic = icon;
  const gid = useMemo(() => 'lg' + (++__gid), []);
  if (!ic) return null;
  let inner, useColor = color;
  if (variant === 'filled') inner = ic.f;
  else if (variant === 'duotone') inner = ic.d;
  else if (variant === 'gradient') {
    const grad = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${lighten(color, 0.3)}"/><stop offset="100%" stop-color="${color}"/></linearGradient></defs>`;
    inner = grad + ic.f.replaceAll('currentColor', `url(#${gid})`);
  } else inner = ic.o;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${ic.vb} ${ic.vb}`}
      style={{ display: 'block', color: useColor }}
      dangerouslySetInnerHTML={{ __html: inner }} />
  );
}

/* ============================================================
   LIVE WIDGET RENDERERS
   ============================================================ */

function useNow(active = true, ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

function WeatherGlyph({ kind, size = 40, color }) {
  const c = color || 'currentColor';
  if (kind === 'sun') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" fill={c} stroke="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return <line key={a} x1={12 + Math.cos(r) * 7.4} y1={12 + Math.sin(r) * 7.4} x2={12 + Math.cos(r) * 9.4} y2={12 + Math.sin(r) * 9.4} />; })}
    </svg>
  );
  if (kind === 'cloud') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={c} stroke="none">
      <path d="M7 18 a4 4 0 0 1 -0.4 -8 A5 5 0 0 1 16.4 8.6 A3.7 3.7 0 0 1 16.8 18 Z" />
    </svg>
  );
  return ( // rain
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 15 a4 4 0 0 1 -0.4 -8 A5 5 0 0 1 16.4 5.6 A3.7 3.7 0 0 1 16.8 15 Z" fill={c} />
      <g stroke={c} strokeWidth="1.7" strokeLinecap="round" opacity="0.65">
        <line x1="9" y1="17.5" x2="8" y2="20.5" /><line x1="13" y1="17.5" x2="12" y2="20.5" /><line x1="17" y1="17.5" x2="16" y2="20.5" />
      </g>
    </svg>
  );
}

function fmtTime(date, tz, format, seconds) {
  try {
    const o = { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: format === '12' };
    if (seconds) o.second = '2-digit';
    let s = new Intl.DateTimeFormat('en-US', o).format(date);
    return s.replace(/\s?(AM|PM)/i, '');
  } catch (e) { return '—'; }
}
function fmtAmPm(date, tz, format) {
  if (format !== '12') return '';
  try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: true }).format(date).replace(/[\d\s]/g, ''); }
  catch (e) { return ''; }
}
function fmtDate(date, tz) {
  try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }).format(date); }
  catch (e) { return ''; }
}

/* ---------------- CLOCK ---------------- */
function ClockW({ config: c, accent, s, mini }) {
  const now = useNow(true, c.seconds ? 1000 : 1000);
  const ampm = fmtAmPm(now, c.tz, c.format);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 * s, padding: 18 * s }}>
      {c.label ? <div style={{ fontSize: 12 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginBottom: 2 * s }}>{c.label}</div> : null}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s }}>
        <div style={{ fontSize: 52 * s, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(now, c.tz, c.format, c.seconds)}</div>
        {ampm ? <div style={{ fontSize: 17 * s, fontWeight: 600, color: accent }}>{ampm}</div> : null}
      </div>
      {c.showDate ? <div style={{ fontSize: 13.5 * s, color: 'var(--w-mut)', marginTop: 4 * s }}>{fmtDate(now, c.tz)}</div> : null}
    </div>
  );
}

/* ---------------- COUNTDOWN ---------------- */
function CountdownW({ config: c, accent, s }) {
  const now = useNow(true, 1000);
  const target = useMemo(() => c.target ? new Date(c.target + 'T00:00:00') : new Date(Date.now() + 32 * 864e5), [c.target]);
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff / 864e5); diff -= d * 864e5;
  const h = Math.floor(diff / 36e5); diff -= h * 36e5;
  const m = Math.floor(diff / 6e4); diff -= m * 6e4;
  const sec = Math.floor(diff / 1000);
  const cell = (n, l) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 * s }}>
      <div style={{ fontSize: 34 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{String(n).padStart(2, '0')}</div>
      <div style={{ fontSize: 10 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{l}</div>
    </div>
  );
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 * s, padding: 18 * s }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
        <span style={{ width: 7 * s, height: 7 * s, borderRadius: 99, background: accent }} />
        <div style={{ fontSize: 14 * s, fontWeight: 600, letterSpacing: '-0.01em' }}>{c.title || 'Countdown'}</div>
      </div>
      <div style={{ display: 'flex', gap: 14 * s }}>
        {cell(d, 'days')}<Sep s={s} />{cell(h, 'hrs')}<Sep s={s} />{cell(m, 'min')}<Sep s={s} />{cell(sec, 'sec')}
      </div>
    </div>
  );
}
function Sep({ s }) { return <div style={{ fontSize: 28 * s, fontWeight: 300, color: 'var(--w-line)', lineHeight: 1, alignSelf: 'flex-start', marginTop: 2 * s }}>:</div>; }

/* ---------------- POMODORO ---------------- */
function PomodoroW({ config: c, accent, s, mini }) {
  const [mode, setMode] = useState('focus');
  const [left, setLeft] = useState(c.work * 60);
  const [run, setRun] = useState(false);
  useEffect(() => { setLeft((mode === 'focus' ? c.work : c.brk) * 60); }, [c.work, c.brk, mode]);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setLeft(l => {
      if (l <= 1) { const nm = mode === 'focus' ? 'break' : 'focus'; setMode(nm); return (nm === 'focus' ? c.work : c.brk) * 60; }
      return l - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [run, mode, c.work, c.brk]);
  const total = (mode === 'focus' ? c.work : c.brk) * 60;
  const pct = 1 - left / total;
  const R = 52, C = 2 * Math.PI * R;
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 16 * s }}>
      <div style={{ position: 'relative', width: 132 * s, height: 132 * s }}>
        <svg width={132 * s} height={132 * s} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="8" />
          <circle cx="64" cy="64" r={R} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * s }}>
          <div style={{ fontSize: 30 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{mm}:{ss}</div>
          <div style={{ fontSize: 10 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>{mode}</div>
        </div>
      </div>
      {!mini && (
        <div style={{ display: 'flex', gap: 8 * s }}>
          <button onClick={() => setRun(r => !r)} style={{ height: 34 * s, padding: `0 ${16 * s}px`, borderRadius: 8 * s, background: accent, color: onColor(accent), fontSize: 13 * s, fontWeight: 600 }}>{run ? 'Pause' : 'Start'}</button>
          <button onClick={() => { setRun(false); setMode('focus'); setLeft(c.work * 60); }} style={{ height: 34 * s, padding: `0 ${14 * s}px`, borderRadius: 8 * s, background: 'var(--w-line)', color: 'var(--w-fg)', fontSize: 13 * s, fontWeight: 600 }}>Reset</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- WEATHER ---------------- */
function WeatherW({ config: c, accent, s }) {
  const d = WEATHER_DATA[c.city] || WEATHER_DATA.Lisbon;
  const conv = t => c.units === 'F' ? Math.round(t * 9 / 5 + 32) : t;
  const u = c.units === 'F' ? '°F' : '°C';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 * s, padding: 20 * s }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14 * s, fontWeight: 600 }}>{c.city}</div>
          <div style={{ fontSize: 12 * s, color: 'var(--w-mut)' }}>{d.cond}</div>
        </div>
        <div style={{ color: accent }}><WeatherGlyph kind={d.icon} size={44 * s} color={accent} /></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 * s }}>
        <div style={{ fontSize: 48 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{conv(d.c)}<span style={{ fontSize: 20 * s, fontWeight: 600, color: 'var(--w-mut)' }}>{u}</span></div>
        <div style={{ fontSize: 12.5 * s, color: 'var(--w-mut)' }}>H {conv(d.hi)}°&nbsp;&nbsp;L {conv(d.lo)}°</div>
      </div>
      {c.forecast && (
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--w-line)', paddingTop: 12 * s }}>
          {d.fc.map(([day, ic, t]) => (
            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 * s }}>
              <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{day}</div>
              <WeatherGlyph kind={ic} size={20 * s} color="var(--w-fg)" />
              <div style={{ fontSize: 12 * s, fontWeight: 600 }}>{conv(t)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- QUOTE ---------------- */
function QuoteW({ config: c, accent, s, fontStack }) {
  const list = QUOTES[c.collection] || QUOTES.Stoic;
  const [i, setI] = useState(0);
  const q = list[i % list.length];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 * s, padding: 22 * s, position: 'relative' }}>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 40 * s, lineHeight: 0.6, color: accent, height: 16 * s }}>“</div>
      <div style={{ fontSize: 17 * s, lineHeight: 1.45, fontWeight: 500, letterSpacing: '-0.01em', textWrap: 'pretty' }}>{q.t}</div>
      {c.author ? <div style={{ fontSize: 12.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>— {q.a}</div> : null}
      <button onClick={() => setI(i + 1)} title="New quote" style={{ position: 'absolute', top: 14 * s, right: 14 * s, width: 28 * s, height: 28 * s, borderRadius: 8 * s, display: 'grid', placeItems: 'center', color: 'var(--w-mut)', border: '1px solid var(--w-line)' }}>
        <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
      </button>
    </div>
  );
}

/* ---------------- HABIT ---------------- */
function HabitW({ config: c, accent, s }) {
  const D = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const [done, setDone] = useState(() => [true, true, true, false, false, false, false]);
  const streak = (() => { let n = 0; for (const x of done) { if (x) n++; else break; } return n; })();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 * s, padding: 20 * s }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14.5 * s, fontWeight: 600 }}>{c.habit}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, color: accent, fontWeight: 700, fontSize: 13 * s }}>
          <Icon name="flame" color={accent} variant="filled" size={15 * s} /> {streak}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 * s }}>
        {D.map((dl, i) => (
          <button key={i} onClick={() => setDone(p => p.map((v, j) => j === i ? !v : v))}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * s }}>
            <span style={{ width: 30 * s, height: 30 * s, borderRadius: 99, display: 'grid', placeItems: 'center',
              background: done[i] ? accent : 'transparent', border: `1.5px solid ${done[i] ? accent : 'var(--w-line)'}`, transition: 'all 0.2s var(--ease)' }}>
              {done[i] && <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke={onColor(accent)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>}
            </span>
            <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{dl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- CALENDAR ---------------- */
function CalendarW({ accent, s }) {
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), today = now.getDate();
  const first = new Date(y, mo, 1).getDay();
  const offset = (first + 6) % 7; // Monday-first
  const days = new Date(y, mo + 1, 0).getDate();
  const cells = []; for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: 18 * s }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 * s }}>
        <div style={{ fontSize: 15 * s, fontWeight: 700 }}>{monthName}</div>
        <div style={{ fontSize: 13 * s, color: 'var(--w-mut)' }}>{y}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 * s }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 600, paddingBottom: 3 * s }}>{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11.5 * s, padding: `${4.5 * s}px 0`, borderRadius: 7 * s, fontWeight: d === today ? 700 : 500,
            color: d === today ? onColor(accent) : (d ? 'var(--w-fg)' : 'transparent'), background: d === today ? accent : 'transparent', fontVariantNumeric: 'tabular-nums' }}>{d || '·'}</div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ANALOG CLOCK ---------------- */
function AnalogClockW({ config: c, accent, s, fontStack, mini }) {
  const dial = c.dial || 'minimal';
  const showSeconds = c.seconds !== false;
  const showNumbers = c.showNumbers !== false;
  const tz = c.tz || 'America/New_York';
  const now = useNow(true, showSeconds ? 1000 : 15000);

  const parts = useMemo(() => {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const map = {};
      dtf.formatToParts(now).forEach(p => { if (p.type !== 'literal') map[p.type] = p.value; });
      return { h: +map.hour % 12, m: +map.minute, sec: +map.second };
    } catch (e) {
      return { h: now.getHours() % 12, m: now.getMinutes(), sec: now.getSeconds() };
    }
  }, [now, tz]);

  const tzLabel = useMemo(() => {
    if (c.label) return c.label;
    try { return tz.split('/').pop().replace(/_/g, ' '); } catch (e) { return ''; }
  }, [tz, c.label]);

  const secAngle = parts.sec * 6;
  const minAngle = parts.m * 6 + parts.sec * 0.1;
  const hourAngle = parts.h * 30 + parts.m * 0.5;

  const VB = 200, CX = 100, CY = 100;
  const polar = (cx, cy, r, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const tickColor = 'var(--w-line)';
  const numColor = 'var(--w-mut)';

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const isHour = i % 5 === 0;
    if (dial === 'minimal' && !isHour) continue;
    const ang = i * 6;
    const outer = polar(CX, CY, 92, ang);
    const inner = polar(CX, CY, isHour ? (dial === 'roman' ? 84 : 82) : 88, ang);
    ticks.push(
      <line key={'t' + i} x1={outer[0]} y1={outer[1]} x2={inner[0]} y2={inner[1]}
        stroke={tickColor} strokeWidth={isHour ? 2 : 1} strokeLinecap="round"
        opacity={isHour ? 1 : 0.55} />
    );
  }

  const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  const numbers = [];
  if (showNumbers && dial !== 'minimal') {
    for (let i = 0; i < 12; i++) {
      const ang = i * 30;
      const r = dial === 'roman' ? 70 : 73;
      const [x, y] = polar(CX, CY, r, ang);
      const label = dial === 'roman' ? roman[i] : (i === 0 ? 12 : i);
      numbers.push(
        <text key={'n' + i} x={x} y={y} fill={numColor}
          fontSize={dial === 'roman' ? 11 : 13} fontWeight={600}
          textAnchor="middle" dominantBaseline="central"
          fontFamily={fontStack} style={{ letterSpacing: dial === 'roman' ? '0.02em' : 0 }}>
          {label}
        </text>
      );
    }
  }

  const [hx, hy] = polar(CX, CY, 50, hourAngle);
  const [hbx, hby] = polar(CX, CY, -14, hourAngle);
  const [mx, my] = polar(CX, CY, 72, minAngle);
  const [mbx, mby] = polar(CX, CY, -18, minAngle);
  const [sx, sy] = polar(CX, CY, 80, secAngle);
  const [sbx, sby] = polar(CX, CY, -20, secAngle);

  const size = mini ? 132 : 168;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 16 * s, fontFamily: fontStack }}>
      <div style={{ position: 'relative', width: size * s, height: size * s }}>
        <svg width={size * s} height={size * s} viewBox={`0 0 ${VB} ${VB}`}>
          <circle cx={CX} cy={CY} r="96" fill="none" stroke="var(--w-line)" strokeWidth="1" opacity="0.6" />
          {ticks}
          {numbers}
          <line x1={hbx} y1={hby} x2={hx} y2={hy} stroke="var(--w-fg)" strokeWidth="5" strokeLinecap="round" />
          <line x1={mbx} y1={mby} x2={mx} y2={my} stroke="var(--w-fg)" strokeWidth="3" strokeLinecap="round" />
          {showSeconds && (
            <line x1={sbx} y1={sby} x2={sx} y2={sy} stroke={accent} strokeWidth="1.5" strokeLinecap="round"
              style={{ transition: parts.sec === 0 ? 'none' : 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)' }} />
          )}
          <circle cx={CX} cy={CY} r="5" fill="var(--w-fg)" />
          <circle cx={CX} cy={CY} r="2.4" fill={showSeconds ? accent : 'var(--w-fg)'} />
        </svg>
      </div>
      {tzLabel ? (
        <div style={{ fontSize: 11 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{tzLabel}</div>
      ) : null}
    </div>
  );
}

/* ---------------- FLIP CLOCK ---------------- */
function FlipClockW({ config: c, accent, s, fontStack, mini }) {
  const tz = c.tz && c.tz !== 'local' ? c.tz : undefined;
  const format = c.format === '12' ? '12' : '24';
  const seconds = !!c.seconds;
  const now = useNow(true, 1000);

  const parts = useMemo(() => {
    try {
      const o = { hour: '2-digit', minute: '2-digit', hour12: format === '12', hourCycle: format === '12' ? 'h12' : 'h23' };
      if (tz) o.timeZone = tz;
      if (seconds) o.second = '2-digit';
      const dp = new Intl.DateTimeFormat('en-US', o).formatToParts(now);
      const get = (t) => { const p = dp.find(x => x.type === t); return p ? p.value : ''; };
      let hh = get('hour');
      if (format === '24' && hh === '24') hh = '00';
      const out = [String(hh).padStart(2, '0'), String(get('minute')).padStart(2, '0')];
      if (seconds) out.push(String(get('second')).padStart(2, '0'));
      const dn = get('dayPeriod');
      return { units: out, ampm: format === '12' ? (dn || '').toUpperCase() : '' };
    } catch (e) {
      return { units: ['--', '--'], ampm: '' };
    }
  }, [now, tz, format, seconds]);

  const dateStr = useMemo(() => {
    try {
      const o = { weekday: 'short', month: 'short', day: 'numeric' };
      if (tz) o.timeZone = tz;
      return new Intl.DateTimeFormat('en-US', o).format(now);
    } catch (e) { return ''; }
  }, [now, tz]);

  const onAcc = onColor(accent);

  // ---- Single split-flap digit (top + bottom halves of one centered glyph) ----
  function FlipDigit({ value }) {
    const W = 38 * s, H = 56 * s, rad = 7 * s, gap = 1.4 * s;
    const fontSize = 38 * s;
    const fg = onAcc;
    const split = lighten(accent, luminance(accent) > 0.5 ? -0.16 : 0.18);
    const half = { position: 'absolute', left: 0, width: W, height: H / 2, overflow: 'hidden', background: accent };
    const numBase = {
      position: 'absolute', left: 0, width: W, height: H, display: 'flex',
      alignItems: 'center', justifyContent: 'center', lineHeight: 1,
      fontSize: fontSize, fontWeight: 700, color: fg, fontVariantNumeric: 'tabular-nums',
    };
    return (
      <div style={{ position: 'relative', width: W, height: H, fontFamily: fontStack }}>
        {/* top half: full-height glyph pinned to top, clipped to its upper half */}
        <div style={{ ...half, top: 0, borderTopLeftRadius: rad, borderTopRightRadius: rad, borderBottom: `${gap}px solid ${split}` }}>
          <div style={{ ...numBase, top: 0 }}>{value}</div>
        </div>
        {/* bottom half: same glyph shifted up so its centre lands on the split, clipped to its lower half */}
        <div style={{ ...half, top: H / 2, borderBottomLeftRadius: rad, borderBottomRightRadius: rad }}>
          <div style={{ ...numBase, top: -H / 2 }}>{value}</div>
        </div>
      </div>
    );
  }

  function Group({ chars }) {
    return (
      <div style={{ display: 'flex', gap: 3 * s }}>
        {chars.map((ch, i) => <FlipDigit key={i} value={ch} />)}
      </div>
    );
  }

  function Colon() {
    const dot = { width: 4 * s, height: 4 * s, borderRadius: 99, background: 'var(--w-mut)' };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: `0 ${4 * s}px` }}>
        <span style={dot} /><span style={dot} />
      </div>
    );
  }

  const groups = parts.units;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 18 * s, fontFamily: fontStack }}>
      <style>{`
        @keyframes ncFlipTop { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(-90deg); } }
        @keyframes ncFlipBot { 0% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 * s }}>
        {groups.map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 * s }}>
            {i > 0 ? <Colon /> : null}
            <Group chars={String(g).split('')} />
          </div>
        ))}
        {parts.ampm ? (
          <div style={{ marginLeft: 7 * s, fontSize: 13 * s, fontWeight: 700, letterSpacing: '0.08em', color: accent, alignSelf: 'flex-start', paddingTop: 4 * s }}>{parts.ampm}</div>
        ) : null}
      </div>
      {c.showDate && dateStr ? (
        <div style={{ fontSize: 12.5 * s, letterSpacing: '0.06em', color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{dateStr}</div>
      ) : null}
    </div>
  );
}

/* ---------------- WORLD CLOCK BOARD ---------------- */
function WorldClockBoardW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 1000);

  const ZONES = {
    'London': 'Europe/London',
    'New York': 'America/New_York',
    'Los Angeles': 'America/Los_Angeles',
    'Chicago': 'America/Chicago',
    'Toronto': 'America/Toronto',
    'Sao Paulo': 'America/Sao_Paulo',
    'Paris': 'Europe/Paris',
    'Berlin': 'Europe/Berlin',
    'Madrid': 'Europe/Madrid',
    'Lisbon': 'Europe/Lisbon',
    'Amsterdam': 'Europe/Amsterdam',
    'Dublin': 'Europe/Dublin',
    'Moscow': 'Europe/Moscow',
    'Dubai': 'Asia/Dubai',
    'Mumbai': 'Asia/Kolkata',
    'Delhi': 'Asia/Kolkata',
    'Bangkok': 'Asia/Bangkok',
    'Singapore': 'Asia/Singapore',
    'Hong Kong': 'Asia/Hong_Kong',
    'Shanghai': 'Asia/Shanghai',
    'Tokyo': 'Asia/Tokyo',
    'Seoul': 'Asia/Seoul',
    'Sydney': 'Australia/Sydney',
    'Auckland': 'Pacific/Auckland',
    'San Francisco': 'America/Los_Angeles',
    'Mexico City': 'America/Mexico_City'
  };

  const resolveZone = (name) => {
    if (!name) return 'UTC';
    if (ZONES[name]) return ZONES[name];
    const hit = Object.keys(ZONES).find(k => k.toLowerCase() === String(name).trim().toLowerCase());
    return hit ? ZONES[hit] : 'UTC';
  };

  const fmt = '12';
  const format = c.format === '24' ? '24' : '12';

  const partsFor = (tz) => {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: false });
      const parts = dtf.formatToParts(now);
      let h = 0, m = 0;
      parts.forEach(p => { if (p.type === 'hour') h = parseInt(p.value, 10); if (p.type === 'minute') m = parseInt(p.value, 10); });
      if (h === 24) h = 0;
      return { h, m };
    } catch (e) { return { h: 0, m: 0 }; }
  };

  const fmtTimeStr = (tz) => {
    try {
      const t = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: format === '12' }).format(now);
      return format === '12' ? t.replace(/\s?(AM|PM)/i, '').trim() : t;
    } catch (e) { return '--:--'; }
  };

  const ampmStr = (tz) => {
    try {
      const t = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: true }).format(now);
      const mm = t.match(/(AM|PM)/i);
      return mm ? mm[0].toUpperCase() : '';
    } catch (e) { return ''; }
  };

  const weekdayStr = (tz) => {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now); }
    catch (e) { return ''; }
  };

  const dayOffset = (tz) => {
    try {
      const localDay = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, day: '2-digit' }).format(now), 10);
      const hereDay = now.getDate();
      if (localDay === hereDay) return 0;
      const diff = localDay - hereDay;
      if (diff === 1 || diff < -25) return 1;
      if (diff === -1 || diff > 25) return -1;
      return diff > 0 ? 1 : -1;
    } catch (e) { return 0; }
  };

  const cities = useMemo(() => {
    let raw = c.cities;
    if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 5);
    if (typeof raw === 'string' && raw.trim()) return raw.split(',').map(x => x.trim()).filter(Boolean).slice(0, 5);
    return ['London', 'New York', 'Tokyo'];
  }, [c.cities]);

  const style = c.style === 'analog' ? 'analog' : 'digital';

  // day/night judgement: dawn 6, dusk 18 (simple, readable)
  const isDay = (h) => h >= 6 && h < 18;

  const SunIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="4.2" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const rad = a * Math.PI / 180;
        const x1 = 12 + Math.cos(rad) * 7.2, y1 = 12 + Math.sin(rad) * 7.2;
        const x2 = 12 + Math.cos(rad) * 9.4, y2 = 12 + Math.sin(rad) * 9.4;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.7" strokeLinecap="round" />;
      })}
    </svg>
  );

  const MoonIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill={color} />
    </svg>
  );

  const AnalogClock = ({ h, m, sz, day }) => {
    const r = 50;
    const hourAng = ((h % 12) + m / 60) * 30 - 90;
    const minAng = m * 6 - 90;
    const hx = 50 + Math.cos(hourAng * Math.PI / 180) * 26;
    const hy = 50 + Math.sin(hourAng * Math.PI / 180) * 26;
    const mx = 50 + Math.cos(minAng * Math.PI / 180) * 38;
    const my = 50 + Math.sin(minAng * Math.PI / 180) * 38;
    return (
      <svg width={sz} height={sz} viewBox="0 0 100 100" style={{ display: 'block' }}>
        <circle cx="50" cy="50" r={r - 2} fill="none" stroke="var(--w-line)" strokeWidth="2.5" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
          const a = i * 30 * Math.PI / 180;
          const inr = i % 3 === 0 ? 40 : 43;
          const x1 = 50 + Math.cos(a) * inr, y1 = 50 + Math.sin(a) * inr;
          const x2 = 50 + Math.cos(a) * 46, y2 = 50 + Math.sin(a) * 46;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--w-line)" strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />;
        })}
        <line x1="50" y1="50" x2={hx} y2={hy} stroke="var(--w-fg)" strokeWidth="3.4" strokeLinecap="round" />
        <line x1="50" y1="50" x2={mx} y2={my} stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3" fill={accent} />
      </svg>
    );
  };

  const colW = mini ? 96 : 116;

  const Cell = ({ name }) => {
    const tz = resolveZone(name);
    const { h, m } = partsFor(tz);
    const day = isDay(h);
    const off = dayOffset(tz);
    const dotSz = (mini ? 11 : 13) * s;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: (style === 'analog' ? 9 : 7) * s, flex: 1, minWidth: 0,
        padding: `0 ${4 * s}px`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, maxWidth: '100%' }}>
          {day
            ? <SunIcon size={dotSz} color={accent} />
            : <MoonIcon size={dotSz} color="var(--w-mut)" />}
          <span style={{
            fontSize: (mini ? 10.5 : 12) * s, fontWeight: 600, color: 'var(--w-fg)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em'
          }}>{name}</span>
        </div>

        {style === 'analog'
          ? <AnalogClock h={h} m={m} sz={(mini ? 56 : 70) * s} day={day} />
          : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 * s }}>
              <span style={{ fontSize: (mini ? 21 : 27) * s, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)' }}>{fmtTimeStr(tz)}</span>
              {format === '12' && <span style={{ fontSize: (mini ? 9 : 10.5) * s, fontWeight: 600, color: 'var(--w-mut)', letterSpacing: '0.04em' }}>{ampmStr(tz)}</span>}
            </div>
          )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, fontSize: (mini ? 9.5 : 10.5) * s, color: 'var(--w-mut)', fontWeight: 600, letterSpacing: '0.02em' }}>
          <span>{weekdayStr(tz)}</span>
          {off !== 0 && (
            <span style={{
              fontSize: (mini ? 8.5 : 9.5) * s, fontWeight: 700, padding: `${1.5 * s}px ${4.5 * s}px`, borderRadius: 99,
              background: off > 0 ? accent : 'var(--w-line)', color: off > 0 ? onColor(accent) : 'var(--w-mut)',
              letterSpacing: '0.02em'
            }}>{off > 0 ? '+1' : '-1'}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: `${(mini ? 14 : 20) * s}px ${(mini ? 10 : 16) * s}px`, fontFamily: fontStack, width: '100%', boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', width: '100%' }}>
        {cities.map((name, i) => (
          <React.Fragment key={name + i}>
            {i > 0 && <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--w-line)', margin: `${6 * s}px 0`, flex: '0 0 auto' }} />}
            <Cell name={name} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------------- DATE CARD ---------------- */
function DateCardW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 30000);
  const format = c.format || 'long';
  const showDay = c.showDay !== false;
  const showWeek = c.showWeekNumber !== false;
  const accentDay = c.accentDay !== false;

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const dow = now.getDay();
  const dayName = DAYS[dow];
  const dnum = now.getDate();
  const mon = now.getMonth();
  const yr = now.getFullYear();

  const ord = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
  };

  const weekNo = useMemo(() => {
    const d = new Date(Date.UTC(yr, mon, dnum));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }, [yr, mon, dnum]);

  const dateLine = useMemo(() => {
    if (format === 'numeric') {
      const mm = String(mon + 1).padStart(2, '0');
      const dd = String(dnum).padStart(2, '0');
      return mm + '.' + dd + '.' + yr;
    }
    if (format === 'short') {
      return MON[mon].slice(0, 3) + ' ' + dnum + ', ' + yr;
    }
    return MON[mon] + ' ' + dnum;
  }, [format, mon, dnum, yr]);

  const isLong = format === 'long';
  const dayColor = accentDay ? accent : 'var(--w-fg)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: 22 * s, fontFamily: fontStack, textAlign: 'center' }}>
      {showDay ? (
        <div style={{ fontSize: 12.5 * s, letterSpacing: '0.22em', textTransform: 'uppercase', color: dayColor, fontWeight: 700, marginBottom: 10 * s }}>{dayName}</div>
      ) : null}

      {isLong ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
          <div style={{ fontSize: 72 * s, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.9, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'flex-start' }}>
            <span>{dnum}</span>
            <span style={{ fontSize: 22 * s, fontWeight: 600, marginTop: 6 * s, marginLeft: 2 * s, color: 'var(--w-mut)' }}>{ord(dnum)}</span>
          </div>
          <div style={{ fontSize: 16 * s, fontWeight: 600, letterSpacing: '0.01em', color: 'var(--w-fg)', marginTop: 6 * s }}>{MON[mon]} {yr}</div>
        </div>
      ) : (
        <div style={{ fontSize: 30 * s, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{dateLine}</div>
      )}

      {showWeek ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s, marginTop: 14 * s }}>
          <span style={{ flex: 'none', width: 18 * s, height: 1, background: 'var(--w-line)' }} />
          <span style={{ fontSize: 10.5 * s, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Week {weekNo}</span>
          <span style={{ flex: 'none', width: 18 * s, height: 1, background: 'var(--w-line)' }} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- COUNT UP ---------------- */
function CountupW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 1000);
  const start = useMemo(() => {
    const d = c.start ? new Date(c.start + 'T00:00:00') : new Date(Date.now() - 365 * 864e5);
    return isNaN(d) ? new Date(Date.now() - 365 * 864e5) : d;
  }, [c.start]);
  const unit = c.unit || 'days';
  const title = c.title || 'Days together';

  const future = start > now;
  const ms = Math.abs(now - start);

  const counts = useMemo(() => {
    const totalDays = Math.floor(ms / 864e5);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = Math.floor(ms / 36e5);
    // calendar-accurate years / months remainder
    let y = now.getFullYear() - start.getFullYear();
    let mo = now.getMonth() - start.getMonth();
    let da = now.getDate() - start.getDate();
    if (da < 0) {
      mo -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      da += prevMonth;
    }
    if (mo < 0) { y -= 1; mo += 12; }
    if (future) { y = 0; mo = 0; da = totalDays; }
    const totalMonths = y * 12 + mo;
    return { totalDays, totalWeeks, totalHours, totalMonths, y, mo, da };
  }, [ms, now, start, future]);

  const bigValue = (() => {
    if (unit === 'weeks') return counts.totalWeeks;
    if (unit === 'months') return counts.totalMonths;
    if (unit === 'hours') return counts.totalHours;
    return counts.totalDays;
  })();

  const unitLabel = (() => {
    const map = { days: 'days', weeks: 'weeks', months: 'months', hours: 'hours' };
    const w = map[unit] || 'days';
    return bigValue === 1 ? w.slice(0, -1) : w;
  })();

  const fmt = (n) => n.toLocaleString('en-US');

  // breakdown chips: years / months / days
  const chips = [];
  if (counts.y > 0) chips.push([counts.y, counts.y === 1 ? 'yr' : 'yrs']);
  if (counts.mo > 0 || counts.y > 0) chips.push([counts.mo, 'mo']);
  chips.push([counts.da, counts.da === 1 ? 'day' : 'days']);

  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const Chip = ({ n, l }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 * s }}>
      <span style={{ fontSize: 17 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)' }}>{n}</span>
      <span style={{ fontSize: 9.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{l}</span>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 22 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s }}>
        <span style={{ width: 5 * s, height: 5 * s, borderRadius: 99, background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 12 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 * s }}>
        <span style={{ fontSize: 58 * s, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.9, color: accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(bigValue)}</span>
        <span style={{ fontSize: 16 * s, fontWeight: 600, color: 'var(--w-mut)' }}>{unitLabel}</span>
      </div>

      {!mini && chips.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 * s, padding: `${9 * s}px ${16 * s}px`, borderRadius: 10 * s, border: '1px solid var(--w-line)' }}>
          {chips.map((ch, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ width: 1, height: 18 * s, background: 'var(--w-line)' }} />}
              <Chip n={ch[0]} l={ch[1]} />
            </React.Fragment>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>
        {future ? 'starting ' : 'since '}{startLabel}
      </div>
    </div>
  );
}

/* ---------------- LIFE PROGRESS ---------------- */
function LifeProgressW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 60000);

  const scopes = (c.scopes && c.scopes.length ? c.scopes : ['day', 'week', 'year', 'life']);
  const birth = useMemo(() => {
    const b = c.birthDate ? new Date(c.birthDate + 'T00:00:00') : new Date('1995-06-01T00:00:00');
    return isNaN(b) ? new Date('1995-06-01T00:00:00') : b;
  }, [c.birthDate]);
  const expectancy = Math.max(1, c.lifeExpectancy || 85);

  const pcts = useMemo(() => {
    const t = now.getTime();

    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const day = (t - dayStart.getTime()) / 864e5;

    const wkStart = new Date(now); wkStart.setHours(0, 0, 0, 0);
    const dow = (wkStart.getDay() + 6) % 7;
    wkStart.setDate(wkStart.getDate() - dow);
    const week = (t - wkStart.getTime()) / (7 * 864e5);

    const moStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const moEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const month = (t - moStart.getTime()) / (moEnd.getTime() - moStart.getTime());

    const yrStart = new Date(now.getFullYear(), 0, 1);
    const yrEnd = new Date(now.getFullYear() + 1, 0, 1);
    const year = (t - yrStart.getTime()) / (yrEnd.getTime() - yrStart.getTime());

    const lifeEnd = new Date(birth); lifeEnd.setFullYear(birth.getFullYear() + expectancy);
    const life = (t - birth.getTime()) / (lifeEnd.getTime() - birth.getTime());

    const clamp = (v) => Math.min(1, Math.max(0, v));
    return { day: clamp(day), week: clamp(week), month: clamp(month), year: clamp(year), life: clamp(life) };
  }, [now, birth, expectancy]);

  const meta = {
    day: { label: 'Day', sub: () => 'today' },
    week: { label: 'Week', sub: () => { const dow = (now.getDay() + 6) % 7; return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dow]; } },
    month: { label: 'Month', sub: () => now.toLocaleDateString(undefined, { month: 'long' }) },
    year: { label: 'Year', sub: () => String(now.getFullYear()) },
    life: { label: 'Life', sub: () => { const age = (now.getTime() - birth.getTime()) / (365.25 * 864e5); return age >= 0 && age < 200 ? Math.floor(age) + ' yrs' : ''; } }
  };

  const rows = scopes.filter(k => meta[k]);
  const dense = rows.length >= 4;

  const Bar = ({ k }) => {
    const pct = pcts[k];
    const m = meta[k];
    const isLife = k === 'life';
    const segs = 28;
    const filled = Math.round(pct * segs);
    const sub = m.sub();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: (dense ? 5 : 7) * s }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 * s }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s, minWidth: 0 }}>
            <span style={{ fontSize: 12.5 * s, fontWeight: 600, letterSpacing: '-0.01em' }}>{m.label}</span>
            {sub ? <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span> : null}
          </div>
          <span style={{ fontSize: 11.5 * s, fontWeight: 600, color: isLife ? accent : 'var(--w-mut)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(pct * 100)}%</span>
        </div>
        {c.style === 'dots' ? (
          <div style={{ display: 'flex', gap: 3 * s }}>
            {Array.from({ length: segs }).map((_, i) => (
              <span key={i} style={{ flex: 1, height: 4 * s, borderRadius: 99, background: i < filled ? accent : 'var(--w-line)', opacity: i < filled ? 1 : 0.6, transition: 'background 0.3s' }} />
            ))}
          </div>
        ) : (
          <div style={{ position: 'relative', height: (dense ? 6 : 7) * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, width: (pct * 100) + '%', background: accent, borderRadius: 99, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 * s, padding: (mini ? 16 : 22) * s, fontFamily: fontStack }}>
      {c.title !== false && !mini ? (
        <div style={{ fontSize: 10.5 * s, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginBottom: 8 * s }}>
          {c.title || 'Life in Progress'}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: (dense ? 13 : 16) * s }}>
        {rows.map(k => <Bar key={k} k={k} />)}
      </div>
    </div>
  );
}

/* ---------------- YEAR PROGRESS ---------------- */
function YearProgressW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 30000);
  const scope = c.scope || 'year';
  const style = c.style || 'solid';
  const showPercent = c.showPercent !== false;

  const meta = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth();
    if (scope === 'month') {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 1);
      const label = now.toLocaleString(undefined, { month: 'long' });
      return { start, end, label, sub: 'this month' };
    }
    if (scope === 'week') {
      const day = now.getDay();
      const mondayOffset = (day + 6) % 7;
      const start = new Date(y, m, now.getDate() - mondayOffset);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 7 * 864e5);
      return { start, end, label: 'This Week', sub: 'Mon to Sun' };
    }
    if (scope === 'day') {
      const start = new Date(y, m, now.getDate());
      const end = new Date(start.getTime() + 864e5);
      return { start, end, label: 'Today', sub: now.toLocaleDateString(undefined, { weekday: 'long' }) };
    }
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);
    return { start, end, label: String(y), sub: 'this year' };
  }, [now, scope]);

  const total = meta.end - meta.start;
  const elapsed = Math.min(total, Math.max(0, now - meta.start));
  const frac = total > 0 ? elapsed / total : 0;
  const pct = frac * 100;
  const remaining = Math.max(0, total - elapsed);

  const remainingLabel = useMemo(() => {
    const days = remaining / 864e5;
    if (scope === 'day') {
      const hrs = remaining / 36e5;
      if (hrs >= 1) return Math.ceil(hrs) + ' hrs left';
      return Math.ceil(remaining / 6e4) + ' min left';
    }
    if (scope === 'week') {
      const d = Math.ceil(days);
      return d + (d === 1 ? ' day left' : ' days left');
    }
    const d = Math.ceil(days);
    return d + (d === 1 ? ' day left' : ' days left');
  }, [remaining, scope]);

  const segCount = scope === 'year' ? 12 : scope === 'month' ? 10 : scope === 'week' ? 7 : 12;
  const segs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < segCount; i++) {
      const segStart = i / segCount;
      const segEnd = (i + 1) / segCount;
      let fill = 0;
      if (frac >= segEnd) fill = 1;
      else if (frac > segStart) fill = (frac - segStart) / (segEnd - segStart);
      arr.push(fill);
    }
    return arr;
  }, [frac, segCount]);

  const barH = 14 * s;
  const radius = barH / 2;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: 22 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s, minWidth: 0 }}>
          <div style={{ fontSize: 15 * s, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.label}</div>
          <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500 }}>{remainingLabel}</div>
        </div>
        {showPercent && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, color: accent, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            <span style={{ fontSize: 30 * s, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct < 10 ? pct.toFixed(1) : Math.round(pct)}</span>
            <span style={{ fontSize: 15 * s, fontWeight: 600 }}>%</span>
          </div>
        )}
      </div>

      {style === 'segments' ? (
        <div style={{ display: 'flex', gap: 4 * s, alignItems: 'center' }}>
          {segs.map((fill, i) => (
            <div key={i} style={{ flex: 1, height: barH, borderRadius: 3 * s, background: 'var(--w-line)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, width: (fill * 100) + '%', background: accent, transition: 'width 0.6s ease' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ position: 'relative', height: barH, borderRadius: radius, background: 'var(--w-line)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: Math.max(frac * 100, frac > 0 ? 2 : 0) + '%', borderRadius: radius, background: style === 'gradient' ? `linear-gradient(90deg, ${lighten(accent, 0.18)}, ${accent})` : accent, transition: 'width 0.6s ease' }} />
        </div>
      )}

      {!mini && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500, letterSpacing: '0.02em' }}>
          <span>{Math.round(elapsed / 864e5) >= 0 ? meta.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
          <span>{new Date(meta.end - 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- LIFE IN WEEKS ---------------- */
function LifeInWeeksW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 60000);
  const birth = c.birthDate || '1995-06-01';
  const life = Math.max(1, Math.min(120, c.lifeExpectancy || 90));
  const fill = c.filledColor || accent;

  const stats = React.useMemo(() => {
    const b = new Date(birth + 'T00:00:00');
    const totalWeeks = Math.round(life * 52.1775);
    let lived = Math.floor((now - b) / (7 * 864e5));
    if (isNaN(lived) || lived < 0) lived = 0;
    lived = Math.min(lived, totalWeeks);
    const cols = 52;
    const rows = Math.ceil(totalWeeks / cols);
    const pct = totalWeeks ? lived / totalWeeks : 0;
    const ageYears = Math.max(0, (now - b) / (365.25 * 864e5));
    return { totalWeeks, lived, cols, rows, pct, ageYears, valid: !isNaN(b.getTime()) };
  }, [birth, life, now]);

  if (!stats.valid) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 * s, fontSize: 13 * s, color: 'var(--w-mut)', fontFamily: fontStack }}>
        Set a birth date
      </div>
    );
  }

  const muted = c.showMuted !== false;
  const weeksLeft = stats.totalWeeks - stats.lived;
  const fmtN = (n) => n.toLocaleString();

  // Condensed grid: each cell = one YEAR (not one week). life years -> compact grid.
  const cols = 15;
  const totalYears = life;
  const livedYears = Math.min(totalYears, Math.floor(stats.ageYears));
  const rows = Math.ceil(totalYears / cols);
  const dot = 8.5;
  const gap = 3.2;
  const step = dot + gap;
  const gridW = cols * step - gap;
  const gridH = rows * step - gap;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: '14px 16px', fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s, minWidth: 0 }}>
          <div style={{ fontSize: 10.5 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title || 'Life in Weeks'}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 * s }}>
            <span style={{ fontSize: 22 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: fill }}>{Math.floor(stats.ageYears)}</span>
            <span style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500 }}>yrs</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{Math.round(stats.pct * 100)}%</div>
          <div style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 500, marginTop: 2 * s }}>elapsed</div>
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${gridW} ${gridH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', maxHeight: 96 * s, overflow: 'visible' }}
        shapeRendering="geometricPrecision"
      >
        {Array.from({ length: totalYears }).map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const isFilled = i < livedYears;
          const isCurrent = i === livedYears;
          const x = col * step;
          const y = row * step;
          let fillColor, op;
          if (isCurrent) {
            fillColor = fill;
            op = 1;
          } else if (isFilled) {
            fillColor = fill;
            op = 1;
          } else {
            fillColor = 'var(--w-line)';
            op = muted ? 0.5 : 0.85;
          }
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={dot}
              height={dot}
              rx={2}
              fill={fillColor}
              fillOpacity={op}
              stroke={isCurrent ? (luminance(fill) < 0.5 ? lighten(fill, 0.45) : fill) : 'none'}
              strokeWidth={isCurrent ? 1 : 0}
            >
              {isCurrent ? <animate attributeName="fill-opacity" values="1;0.45;1" dur="2.4s" repeatCount="indefinite" /> : null}
            </rect>
          );
        })}
      </svg>

      {!mini ? (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          <span><span style={{ color: 'var(--w-fg)', fontWeight: 600 }}>{fmtN(stats.lived)}</span> weeks lived</span>
          <span style={{ width: 3 * s, height: 3 * s, borderRadius: 99, background: 'var(--w-line)' }} />
          <span><span style={{ color: 'var(--w-fg)', fontWeight: 600 }}>{fmtN(weeksLeft)}</span> ahead</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- MOON PHASE ---------------- */
function MoonPhaseW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 60000);
  const hemisphere = c.hemisphere || 'north';
  const showIllumination = c.showIllumination !== false;
  const showNextPhase = c.showNextPhase !== false;
  const style = c.style || 'realistic';

  // --- astronomy ---
  const SYN = 29.530588853;
  const REF = Date.UTC(2000, 0, 6, 18, 14, 0); // known new moon

  const moonAge = (d) => {
    let a = (((d.getTime() - REF) / 86400000) % SYN);
    if (a < 0) a += SYN;
    return a;
  };

  const phaseInfo = (age) => {
    const phase = age / SYN; // 0..1
    // illuminated fraction
    const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    const waxing = phase < 0.5;
    let name;
    if (age < 1.0) name = 'New Moon';
    else if (age < 6.38) name = 'Waxing Crescent';
    else if (age < 8.38) name = 'First Quarter';
    else if (age < 13.77) name = 'Waxing Gibbous';
    else if (age < 15.77) name = 'Full Moon';
    else if (age < 21.15) name = 'Waning Gibbous';
    else if (age < 23.15) name = 'Last Quarter';
    else if (age < 28.53) name = 'Waning Crescent';
    else name = 'New Moon';
    return { phase, illum, waxing, name };
  };

  const age = moonAge(now);
  const info = phaseInfo(age);

  // next principal phase
  const principals = [
    { name: 'New Moon', at: 0 },
    { name: 'First Quarter', at: SYN * 0.25 },
    { name: 'Full Moon', at: SYN * 0.5 },
    { name: 'Last Quarter', at: SYN * 0.75 },
  ];
  const nextPhase = useMemo(() => {
    let best = null;
    for (let k = 0; k < principals.length + 1; k++) {
      const p = principals[k % principals.length];
      const cyc = Math.floor(k / principals.length);
      let daysTo = p.at + cyc * SYN - age;
      if (daysTo > 0.02 && (best === null || daysTo < best.daysTo)) {
        best = { name: p.name, daysTo };
      }
    }
    if (!best) best = { name: 'Full Moon', daysTo: SYN - age };
    const dt = new Date(now.getTime() + best.daysTo * 86400000);
    return { name: best.name, daysTo: best.daysTo, date: dt };
  }, [age, now]);

  const fmtIn = (days) => {
    if (days < 1) {
      const hrs = Math.round(days * 24);
      return hrs <= 1 ? 'in 1 hr' : 'in ' + hrs + ' hrs';
    }
    const d = Math.round(days);
    return 'in ' + d + (d === 1 ? ' day' : ' days');
  };

  // --- moon SVG geometry ---
  // We draw a unit circle of radius R. The terminator is an ellipse whose
  // horizontal semi-axis = R*cos(2π·phase). We fill lit region with light,
  // shadow region with dark, against the sky.
  const R = 50;
  const cx = 60, cy = 60;
  const phaseAngle = 2 * Math.PI * info.phase; // 0=new .. π=full .. 2π=new
  // x-extent of terminator ellipse; sign tells which side
  const term = Math.cos(phaseAngle); // 1 at new, -1 at full
  const semi = Math.abs(term) * R;
  const sweepLeftLit = info.waxing; // waxing: right side lit (north)

  // Build moon path: outer circle split by terminator ellipse.
  // We render a "lit" shape via two arcs.
  const moonShape = () => {
    // Two halves: left semicircle + terminator ellipse half.
    // Determine, for north hemisphere, which side is lit.
    // Lit side: waxing => right; waning => left.
    const top = cy - R, bot = cy + R;
    // full circle border in two arcs through top and bottom
    // Lit region path: from top, outer arc down the lit side to bottom,
    // then terminator ellipse arc back to top.
    const litRight = info.waxing; // before flip
    // outer arc sweep: going from top to bottom on the right side = sweep 1
    const outerSweep = litRight ? 1 : 0;
    // terminator ellipse: from bottom to top. Its bulge direction depends on phase.
    // ellipse rx = semi. sweep flag controls bulge.
    // When |phase-0.5|... if term>0 (crescent side, <half lit) terminator bulges toward shadow.
    let ellipseSweep;
    if (litRight) {
      ellipseSweep = term > 0 ? 1 : 0;
    } else {
      ellipseSweep = term > 0 ? 0 : 1;
    }
    const rx = semi < 0.4 ? 0.4 : semi;
    return 'M ' + cx + ' ' + top +
      ' A ' + R + ' ' + R + ' 0 0 ' + outerSweep + ' ' + cx + ' ' + bot +
      ' A ' + rx + ' ' + R + ' 0 0 ' + ellipseSweep + ' ' + cx + ' ' + top + ' Z';
  };

  const litPath = moonShape();
  const flip = hemisphere === 'south';

  const surface = '#e9e7e0';
  const surfaceDark = '#1f2030';
  const sky = '#0c0e1a';

  const dim = 132 * s;
  const isFlat = style === 'flat';

  // craters for realism
  const craters = [
    { x: 44, y: 46, r: 7, o: 0.10 },
    { x: 72, y: 40, r: 4.5, o: 0.08 },
    { x: 58, y: 66, r: 9, o: 0.09 },
    { x: 78, y: 72, r: 5, o: 0.07 },
    { x: 46, y: 78, r: 4, o: 0.08 },
    { x: 66, y: 52, r: 3, o: 0.06 },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ position: 'relative', width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox="0 0 120 120" style={{ transform: flip ? 'scaleX(-1)' : 'none', display: 'block' }}>
          <defs>
            <radialGradient id="ncmoon_sky" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor={lighten(accent, 0.06)} />
              <stop offset="60%" stopColor={accent} />
              <stop offset="100%" stopColor={isFlat ? accent : '#0a0b14'} />
            </radialGradient>
            <radialGradient id="ncmoon_lit" cx="38%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#fbfaf5" />
              <stop offset="70%" stopColor={surface} />
              <stop offset="100%" stopColor="#cbc8bd" />
            </radialGradient>
            <clipPath id="ncmoon_clip"><circle cx={cx} cy={cy} r={R} /></clipPath>
          </defs>

          {/* sky disc */}
          <circle cx={cx} cy={cy} r={R + 8} fill={isFlat ? 'var(--w-line)' : 'url(#ncmoon_sky)'} opacity={isFlat ? 0.35 : 1} />

          {/* shadow side base (full dark disc) */}
          <circle cx={cx} cy={cy} r={R} fill={isFlat ? 'var(--w-line)' : surfaceDark} opacity={isFlat ? 0.55 : 1} />

          {/* lit region */}
          <path d={litPath} fill={isFlat ? accent : 'url(#ncmoon_lit)'} />

          {/* craters (only on realistic, clipped to disc) */}
          {!isFlat && (
            <g clipPath="url(#ncmoon_clip)">
              {craters.map((cr, i) => (
                <circle key={i} cx={cr.x} cy={cr.y} r={cr.r} fill="#000" opacity={cr.o} />
              ))}
            </g>
          )}

          {/* subtle inner shadow rim for depth */}
          {!isFlat && (
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1.2" />
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 * s }}>
        <div style={{ fontSize: 15 * s, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--w-fg)' }}>{info.name}</div>
        {showIllumination && (
          <div style={{ fontSize: 12 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(info.illum * 100)}% illuminated
          </div>
        )}
      </div>

      {showNextPhase && !mini && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s, marginTop: 1 * s, padding: `${5 * s}px ${11 * s}px`, borderRadius: 99, border: '1px solid var(--w-line)' }}>
          <span style={{ width: 5 * s, height: 5 * s, borderRadius: 99, background: accent, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500 }}>
            {nextPhase.name} <span style={{ color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{fmtIn(nextPhase.daysTo)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------- DAY & NIGHT MAP ---------------- */
function DayNightMapW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 60000);
  const mapStyle = c.mapStyle || 'minimal';
  const showCities = c.showCities !== false;
  const twilightBands = !!c.twilightBands;

  const W = 360, H = 180;

  // ---- Solar geometry ----
  const sun = useMemo(() => {
    const d = now;
    const ms = d.getTime();
    // days since J2000.0
    const n = ms / 86400000 - 10957.5;
    const rad = Math.PI / 180;
    // mean longitude & anomaly of the sun
    const L = (280.46 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * rad;
    // ecliptic longitude
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
    const eps = 23.439 * rad;
    // declination
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    // equation of time (minutes)
    const Lr = L * rad;
    const eqTime = 4 * (Lr - 0.0057183 - Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda))) / rad;
    // subsolar longitude: where local solar time = noon
    const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
    let subLon = -(utcMin + eqTime - 720) / 4;
    subLon = ((subLon + 540) % 360) - 180;
    return { dec, subLat: dec / rad, subLon };
  }, [now]);

  // project lon/lat -> svg x/y (equirectangular)
  const project = (lon, lat) => ({
    x: (lon + 180) / 360 * W,
    y: (90 - lat) / 180 * H
  });

  // solar altitude (degrees) for a given lon/lat
  const altitude = (lon, lat) => {
    const rad = Math.PI / 180;
    const dec = sun.dec;
    // hour angle
    let ha = (lon - sun.subLon) * rad;
    const phi = lat * rad;
    const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha);
    return Math.asin(Math.max(-1, Math.min(1, sinAlt))) / rad;
  };

  // ---- Terminator polygon (night region) ----
  // For each x column, find the latitude where altitude crosses a given threshold.
  const nightPath = useMemo(() => {
    const rad = Math.PI / 180;
    const dec = sun.dec;
    const cols = 121;
    const buildEdge = (thresh) => {
      const top = []; // latitude of boundary per longitude
      for (let i = 0; i < cols; i++) {
        const lon = -180 + (360 * i) / (cols - 1);
        const ha = (lon - sun.subLon) * rad;
        // solve sin(thresh) = sin(phi)sin(dec)+cos(phi)cos(dec)cos(ha)
        // => A sin(phi) + B cos(phi) = sinThresh
        const A = Math.sin(dec);
        const B = Math.cos(dec) * Math.cos(ha);
        const Rm = Math.sqrt(A * A + B * B);
        const st = Math.sin(thresh * rad);
        let latDeg;
        if (Rm < 1e-9) { latDeg = 0; }
        else {
          let v = st / Rm;
          v = Math.max(-1, Math.min(1, v));
          const phi = Math.asin(v) - Math.atan2(B, A);
          latDeg = phi / rad;
          // normalize into [-90,90]
          while (latDeg > 90) latDeg -= 180;
          while (latDeg < -90) latDeg += 180;
        }
        top.push({ lon, lat: latDeg });
      }
      return top;
    };
    const edge = buildEdge(0);
    // Determine whether night is toward the north or south pole at the boundary.
    // Sample a point clearly at north pole: if north pole is dark, fill upward.
    const northDark = altitude(0, 89) < 0;
    // Build a closed polygon covering the dark hemisphere.
    let pts = edge.map(p => project(p.lon, p.lat));
    let d;
    if (northDark) {
      // fill from boundary up to top edge
      d = 'M ' + pts.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' L ');
      d += ' L ' + W + ' 0 L 0 0 Z';
    } else {
      d = 'M ' + pts.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' L ');
      d += ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z';
    }
    // twilight band paths (civil ~ -6, astronomical ~ -18)
    const bandPath = (thresh) => {
      const e = buildEdge(thresh);
      const pp = e.map(p => project(p.lon, p.lat));
      let dd;
      const dark = altitude(0, 89) < thresh;
      if (dark) {
        dd = 'M ' + pp.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' L ');
        dd += ' L ' + W + ' 0 L 0 0 Z';
      } else {
        dd = 'M ' + pp.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' L ');
        dd += ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z';
      }
      return dd;
    };
    return { night: d, civil: twilightBands ? bandPath(-6) : null, astro: twilightBands ? bandPath(-18) : null };
  }, [sun, twilightBands]);

  const sunPos = project(sun.subLon, sun.subLat);
  // antipode (midnight point)
  const moonLon = ((sun.subLon + 360) % 360) - 180;
  const moonPos = project(moonLon, -sun.subLat);

  // ---- Cities ----
  const cities = useMemo(() => ([
    { n: 'New York', lon: -74, lat: 40.7 },
    { n: 'London', lon: -0.1, lat: 51.5 },
    { n: 'Tokyo', lon: 139.7, lat: 35.7 },
    { n: 'Sydney', lon: 151.2, lat: -33.9 },
    { n: 'São Paulo', lon: -46.6, lat: -23.5 },
    { n: 'Dubai', lon: 55.3, lat: 25.2 },
    { n: 'Los Angeles', lon: -118.2, lat: 34.1 },
    { n: 'Lagos', lon: 3.4, lat: 6.5 }
  ]), []);

  // Simplified continent outlines (very low-poly, equirectangular lon/lat).
  const continents = useMemo(() => ([
    // North America
    [[-158,21],[-130,55],[-95,70],[-82,68],[-60,47],[-70,42],[-81,25],[-97,18],[-105,22],[-114,28],[-124,40],[-125,48],[-140,60],[-158,21]],
    // South America
    [[-80,8],[-60,10],[-50,-2],[-35,-7],[-48,-25],[-58,-35],[-66,-46],[-73,-52],[-71,-30],[-78,-12],[-81,-4],[-80,8]],
    // Europe + W Asia
    [[-10,36],[-9,43],[-2,49],[4,60],[18,70],[30,68],[40,66],[55,68],[60,55],[48,45],[40,42],[28,40],[22,38],[15,40],[3,43],[-6,36],[-10,36]],
    // Africa
    [[-16,15],[-5,5],[10,4],[10,-2],[14,-12],[20,-34],[26,-34],[33,-26],[40,-15],[51,12],[44,11],[33,30],[20,32],[10,37],[-6,36],[-16,28],[-16,15]],
    // Asia
    [[40,42],[48,45],[60,55],[75,72],[100,78],[140,73],[160,62],[145,50],[135,35],[122,40],[120,25],[108,16],[98,8],[80,8],[72,20],[60,25],[50,30],[45,38],[40,42]],
    // Australia
    [[113,-22],[122,-18],[131,-12],[142,-11],[150,-22],[153,-28],[146,-38],[138,-35],[129,-32],[115,-34],[114,-26],[113,-22]]
  ]), []);

  // theme colors
  const dayFill = mapStyle === 'satellite' ? lighten(accent, 0.55) : 'var(--w-line)';
  const landStroke = mapStyle === 'minimal' ? 'var(--w-mut)' : 'none';
  const landFill = mapStyle === 'minimal' ? 'transparent' : (mapStyle === 'satellite' ? lighten(accent, 0.42) : 'var(--w-line)');
  const nightFill = accent;

  // current UTC label
  const utcStr = (() => {
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    return h + ':' + m;
  })();

  const isDark = (lon, lat) => altitude(lon, lat) < 0;
  const lit = cities.filter(c2 => !isDark(c2.lon, c2.lat)).length;

  const gid = useMemo(() => 'dn' + Math.random().toString(36).slice(2, 8), []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 16 * s, fontFamily: fontStack }}>
      {!mini ? (
        <div style={{ width: '100%', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', maxWidth: 380 * s }}>
          <div style={{ fontSize: 13.5 * s, fontWeight: 600, color: 'var(--w-fg)' }}>{c.title || 'Day & Night'}</div>
          <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{utcStr} UTC</div>
        </div>
      ) : null}

      <div style={{ width: '100%', maxWidth: 380 * s, borderRadius: 10 * s, overflow: 'hidden', position: 'relative', border: '1px solid var(--w-line)' }}>
        <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gid + 'sky'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mapStyle === 'satellite' ? lighten(accent, 0.62) : 'transparent'} />
              <stop offset="1" stopColor={mapStyle === 'satellite' ? lighten(accent, 0.5) : 'transparent'} />
            </linearGradient>
            <radialGradient id={gid + 'glow'} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={lighten(accent, 0.85)} stopOpacity="0.9" />
              <stop offset="1" stopColor={lighten(accent, 0.85)} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* day base */}
          <rect x="0" y="0" width={W} height={H} fill={mapStyle === 'satellite' ? 'url(#' + gid + 'sky)' : dayFill} opacity={mapStyle === 'satellite' ? 1 : 0.35} />

          {/* graticule */}
          {mapStyle !== 'satellite' ? [-120,-60,0,60,120].map(g => (
            <line key={'mx' + g} x1={(g + 180) / 360 * W} y1="0" x2={(g + 180) / 360 * W} y2={H} stroke="var(--w-line)" strokeWidth="0.4" opacity="0.5" />
          )) : null}
          {mapStyle !== 'satellite' ? [-60,-30,0,30,60].map(g => (
            <line key={'my' + g} x1="0" y1={(90 - g) / 180 * H} x2={W} y2={(90 - g) / 180 * H} stroke="var(--w-line)" strokeWidth="0.4" opacity="0.5" />
          )) : null}

          {/* continents */}
          {continents.map((poly, i) => (
            <polygon key={'c' + i}
              points={poly.map(([lo, la]) => { const p = project(lo, la); return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ')}
              fill={landFill} stroke={landStroke} strokeWidth="0.9" strokeLinejoin="round" opacity={mapStyle === 'satellite' ? 1 : 0.85} />
          ))}

          {/* twilight bands */}
          {twilightBands && nightPath.astro ? <path d={nightPath.astro} fill={nightFill} opacity="0.18" /> : null}
          {twilightBands && nightPath.civil ? <path d={nightPath.civil} fill={nightFill} opacity="0.16" /> : null}

          {/* night overlay */}
          <path d={nightPath.night} fill={nightFill} opacity={mapStyle === 'satellite' ? 0.62 : 0.48} />
          <path d={nightPath.night} fill="none" stroke={accent} strokeWidth="0.8" opacity="0.9" />

          {/* sun glow + marker */}
          <circle cx={sunPos.x} cy={sunPos.y} r="26" fill={'url(#' + gid + 'glow)'} />
          <circle cx={sunPos.x} cy={sunPos.y} r="3.4" fill={mapStyle === 'satellite' ? '#fff' : 'var(--w-fg)'} />
          <circle cx={sunPos.x} cy={sunPos.y} r="3.4" fill="none" stroke={accent} strokeWidth="1" />
          {/* midnight / moon marker */}
          <circle cx={moonPos.x} cy={moonPos.y} r="2.4" fill={lighten(accent, 0.7)} opacity="0.9" />

          {/* cities */}
          {showCities ? cities.map((ct, i) => {
            const p = project(ct.lon, ct.lat);
            const dark = isDark(ct.lon, ct.lat);
            return (
              <g key={'ct' + i}>
                <circle cx={p.x} cy={p.y} r="2" fill={dark ? lighten(accent, 0.6) : (mapStyle === 'satellite' ? '#fff' : 'var(--w-fg)')} stroke={dark ? accent : 'none'} strokeWidth="0.6" />
                {dark ? <circle cx={p.x} cy={p.y} r="3.6" fill="none" stroke={lighten(accent, 0.6)} strokeWidth="0.5" opacity="0.5" /> : null}
              </g>
            );
          }) : null}
        </svg>
      </div>

      {!mini ? (
        <div style={{ width: '100%', maxWidth: 380 * s, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 * s, color: 'var(--w-mut)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s }}>
            <span style={{ width: 8 * s, height: 8 * s, borderRadius: 99, background: mapStyle === 'satellite' ? lighten(accent, 0.85) : 'var(--w-fg)', display: 'inline-block', opacity: 0.85 }} />
            <span>Daylight</span>
            <span style={{ width: 8 * s, height: 8 * s, borderRadius: 99, background: accent, display: 'inline-block', marginLeft: 8 * s }} />
            <span>Night</span>
          </div>
          {showCities ? <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)' }}>{lit}/{cities.length} in daylight</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- STOPWATCH ---------------- */
function StopwatchW({ config: c, accent, s, fontStack, mini }) {
  const showLaps = c.showLaps !== false;
  const format = c.format || 'mm:ss.cs';

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    setElapsed(Date.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed;
      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [running]);

  const start = () => setRunning(true);
  const stop = () => setRunning(false);
  const reset = () => { setRunning(false); setElapsed(0); setLaps([]); };
  const lap = () => setLaps(p => [...p, elapsed]);

  const fmt = (ms) => {
    const totalCs = Math.floor(ms / 10);
    const cs = totalCs % 100;
    const totalS = Math.floor(totalCs / 100);
    const sec = totalS % 60;
    const totalM = Math.floor(totalS / 60);
    const min = totalM % 60;
    const hr = Math.floor(totalM / 60);
    const p2 = (n) => String(n).padStart(2, '0');
    if (format === 'hh:mm:ss') return hr + ':' + p2(min) + ':' + p2(sec);
    if (format === 'mm:ss') return p2(hr > 0 ? min + hr * 60 : min) + ':' + p2(sec);
    return p2(hr > 0 ? min + hr * 60 : min) + ':' + p2(sec) + '.' + p2(cs);
  };

  const splits = useMemo(() => {
    return laps.map((t, i) => ({ total: t, split: t - (i > 0 ? laps[i - 1] : 0) }));
  }, [laps]);

  const fastest = useMemo(() => {
    if (splits.length < 2) return -1;
    let mi = 0;
    for (let i = 1; i < splits.length; i++) if (splits[i].split < splits[mi].split) mi = i;
    return mi;
  }, [splits]);

  const slowest = useMemo(() => {
    if (splits.length < 2) return -1;
    let mi = 0;
    for (let i = 1; i < splits.length; i++) if (splits[i].split > splits[mi].split) mi = i;
    return mi;
  }, [splits]);

  const isZero = elapsed === 0 && !running;

  const btn = (label, onClick, variant) => {
    const filled = variant === 'accent';
    return (
      <button onClick={onClick} style={{
        height: 36 * s,
        minWidth: 36 * s,
        padding: `0 ${17 * s}px`,
        borderRadius: 99,
        background: filled ? accent : 'transparent',
        color: filled ? onColor(accent) : 'var(--w-fg)',
        border: filled ? 'none' : `1.5px solid var(--w-line)`,
        fontSize: 13 * s,
        fontWeight: 600,
        letterSpacing: '0.01em',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6 * s,
        transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
      }}>{label}</button>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 * s, padding: 20 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * s }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7 * s,
          fontSize: 10.5 * s, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--w-mut)', fontWeight: 600,
        }}>
          <span style={{
            width: 6 * s, height: 6 * s, borderRadius: 99,
            background: running ? accent : 'var(--w-line)',
            boxShadow: running ? `0 0 0 ${3 * s}px ${lighten(accent, 0.82)}` : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
          }} />
          {running ? 'Running' : isZero ? 'Stopwatch' : 'Paused'}
        </div>
        <div style={{
          fontSize: 46 * s, fontWeight: 700, lineHeight: 1,
          letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          color: isZero ? 'var(--w-mut)' : 'var(--w-fg)',
          transition: 'color 0.2s',
        }}>{fmt(elapsed)}</div>
      </div>

      {!mini && (
        <div style={{ display: 'flex', gap: 9 * s, alignItems: 'center' }}>
          {running
            ? btn('Stop', stop, 'accent')
            : btn(isZero ? 'Start' : 'Resume', start, 'accent')}
          {showLaps && running
            ? btn('Lap', lap, 'ghost')
            : btn('Reset', reset, 'ghost')}
        </div>
      )}

      {showLaps && !mini && splits.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 240 * s,
          maxHeight: 110 * s, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 1 * s,
          borderTop: `1px solid var(--w-line)`,
          paddingTop: 8 * s,
        }}>
          {splits.slice().reverse().map((sp, ri) => {
            const i = splits.length - 1 - ri;
            const isFast = i === fastest;
            const isSlow = i === slowest;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: `${5 * s}px ${2 * s}px`,
                fontSize: 12.5 * s,
                fontVariantNumeric: 'tabular-nums',
              }}>
                <span style={{ color: 'var(--w-mut)', fontWeight: 600, fontSize: 11 * s, width: 44 * s }}>
                  Lap {i + 1}
                </span>
                <span style={{
                  color: isFast ? accent : isSlow ? 'var(--w-mut)' : 'var(--w-fg)',
                  fontWeight: isFast || isSlow ? 600 : 500,
                  flex: 1, textAlign: 'right', paddingRight: 12 * s,
                }}>
                  {fmt(sp.split)}
                </span>
                <span style={{ color: 'var(--w-mut)', fontWeight: 500, width: 64 * s, textAlign: 'right' }}>
                  {fmt(sp.total)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- GOAL RING ---------------- */
function ProgressRingW({ config: c, accent, s, fontStack, mini }) {
  const label = c.label || 'Pages read';
  const current = Number.isFinite(+c.current) ? +c.current : 120;
  const target = (Number.isFinite(+c.target) && +c.target > 0) ? +c.target : 300;
  const showPercent = c.showPercent !== false;

  const raw = target > 0 ? current / target : 0;
  const pct = Math.max(0, Math.min(1, raw));
  const complete = current >= target && target > 0;

  const animRef = useRef(0);
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = animRef.current;
    const dur = 700;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const val = from + (pct - from) * eased;
      animRef.current = val;
      setAnim(val);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pct]);

  const fmt = (n) => {
    const r = Math.round(n);
    return r.toLocaleString();
  };

  const R = 52, C = 2 * Math.PI * R;
  const dim = 124 * s;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9 * s, padding: 12 * s, fontFamily: fontStack }}>
      <div style={{ fontSize: 11 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>

      <div style={{ position: 'relative', width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="9" />
          <circle
            cx="64" cy="64" r={R}
            fill="none"
            stroke={accent}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - anim)}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * s }}>
          {showPercent ? (
            <>
              <div style={{ fontSize: 28 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: complete ? accent : 'var(--w-fg)' }}>
                {Math.round(pct * 100)}<span style={{ fontSize: 15 * s, fontWeight: 600 }}>%</span>
              </div>
              <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(current)} / {fmt(target)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 25 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: complete ? accent : 'var(--w-fg)' }}>
                {fmt(current)}
              </div>
              <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                of {fmt(target)}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11.5 * s, fontWeight: 600, color: complete ? accent : 'var(--w-mut)', display: 'flex', alignItems: 'center', gap: 5 * s }}>
        {complete ? (
          <>
            <Icon name="check" color={accent} size={13 * s} />
            <span>Goal reached</span>
          </>
        ) : (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(Math.max(0, target - current))} to go</span>
        )}
      </div>
    </div>
  );
}

/* ---------------- PROGRESS BAR ---------------- */
function ProgressBarW({ config: c, accent, s, fontStack, mini }) {
  const current = Number.isFinite(+c.current) ? +c.current : 40;
  const target = Number.isFinite(+c.target) && +c.target !== 0 ? +c.target : 100;
  const label = c.label || 'Progress';
  const style = c.style || 'solid';
  const showValues = c.showValues !== false;

  const raw = target === 0 ? 0 : current / target;
  const pct = Math.max(0, Math.min(1, raw));
  const display = useNow(true, 16);

  const animRef = useRef({ v: 0, last: 0 });
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = animRef.current.v;
    const dur = 700;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const val = from + (pct - from) * eased;
      animRef.current.v = val;
      setShown(val);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pct]);

  const fmt = (n) => {
    const r = Math.round(n * 100) / 100;
    return (Number.isInteger(r) ? r.toString() : r.toFixed(2).replace(/\.?0+$/, '')) ;
  };
  const pctText = Math.round(shown * 100);
  const complete = pct >= 1;

  const barH = (style === 'thin' ? 8 : style === 'striped' ? 16 : 14) * s;
  const radius = barH / 2;

  const fillBg = style === 'gradient'
    ? `linear-gradient(90deg, ${lighten(accent, 0.18)}, ${accent})`
    : accent;

  const stripeStyle = style === 'striped'
    ? {
        backgroundImage: `repeating-linear-gradient(45deg, ${onColor(accent) === '#fff' || onColor(accent).toLowerCase() === '#ffffff' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'} 0 ${7 * s}px, transparent ${7 * s}px ${14 * s}px)`,
        backgroundSize: `${28 * s}px ${28 * s}px`
      }
    : {};

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: 22 * s, fontFamily: fontStack, color: 'var(--w-fg)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ fontSize: 14.5 * s, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, flexShrink: 0 }}>
          {complete ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18 * s, height: 18 * s, borderRadius: 99, background: accent }}>
              <svg width={11 * s} height={11 * s} viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2L5 8.7L9.5 3.5" stroke={onColor(accent)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : null}
          <span style={{ fontSize: 17 * s, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: complete ? accent : 'var(--w-fg)' }}>{pctText}%</span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: barH, borderRadius: radius, background: 'var(--w-line)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${shown * 100}%`, minWidth: shown > 0 ? barH : 0, background: fillBg, borderRadius: radius, ...stripeStyle }} />
      </div>

      {showValues ? (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 12 * s, color: 'var(--w-mut)', fontWeight: 500 }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)', fontWeight: 600 }}>{fmt(current)}{c.unit ? ' ' + c.unit : ''}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>of {fmt(target)}{c.unit ? ' ' + c.unit : ''}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- TALLY COUNTER ---------------- */
function CounterW({ config: c, accent, s, fontStack, mini }) {
  const label = c.label || 'Count';
  const start = Number.isFinite(c.start) ? c.start : 0;
  const step = Number.isFinite(c.step) && c.step > 0 ? c.step : 1;
  const hasMin = Number.isFinite(c.min);
  const hasMax = Number.isFinite(c.max);

  const storeKey = 'nc_counter_' + (c.label || 'count').toLowerCase().replace(/[^a-z0-9]+/g, '_');

  const [count, setCount] = useState(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw !== null) { const n = parseFloat(raw); if (Number.isFinite(n)) return n; }
    } catch (e) {}
    return start;
  });
  const [pulse, setPulse] = useState(0);

  useEffect(() => { try { localStorage.setItem(storeKey, String(count)); } catch (e) {} }, [count, storeKey]);

  const clamp = (n) => {
    if (hasMin && n < c.min) n = c.min;
    if (hasMax && n > c.max) n = c.max;
    return n;
  };

  const bump = (dir) => {
    setCount((p) => {
      const next = clamp(p + dir * step);
      if (next !== p) setPulse(dir);
      return next;
    });
    if (typeof window !== 'undefined') window.setTimeout(() => setPulse(0), 200);
  };

  const reset = () => setCount(clamp(start));

  const atMin = hasMin && count <= c.min;
  const atMax = hasMax && count >= c.max;

  const disp = Math.round(count * 1000) / 1000;
  const digits = String(Math.abs(Math.trunc(disp))).length;
  const numSize = (digits >= 5 ? 40 : digits >= 4 ? 48 : 56) * s;

  const fg = 'var(--w-fg)';
  const onAcc = onColor(accent);

  const RoundBtn = ({ dir, disabled }) => {
    const sz = 46 * s;
    return (
      <button
        onClick={() => !disabled && bump(dir)}
        disabled={disabled}
        aria-label={dir > 0 ? 'increment' : 'decrement'}
        style={{
          width: sz, height: sz, borderRadius: 99,
          display: 'grid', placeItems: 'center',
          flex: 'none',
          background: dir > 0 ? accent : 'transparent',
          border: dir > 0 ? '1.5px solid ' + accent : '1.5px solid var(--w-line)',
          color: dir > 0 ? onAcc : fg,
          opacity: disabled ? 0.32 : 1,
          cursor: disabled ? 'default' : 'pointer',
          transition: 'transform 0.12s cubic-bezier(.34,1.56,.64,1), opacity 0.15s',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.9)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width={18 * s} height={18 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          {dir > 0 ? <line x1="12" y1="5" x2="12" y2="19" /> : null}
        </svg>
      </button>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 * s, padding: 14 * s, fontFamily: fontStack, position: 'relative', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 12 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 'none' }}>{label}</div>

      <div style={{
        fontSize: numSize, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em',
        fontVariantNumeric: 'tabular-nums',
        color: pulse > 0 ? accent : fg,
        transform: pulse !== 0 ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1), color 0.25s',
        flex: 'none'
      }}>{disp}</div>

      {(hasMin || hasMax) ? (
        <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginTop: -4 * s, flex: 'none' }}>
          {hasMin && hasMax ? c.min + ' – ' + c.max : hasMax ? 'max ' + c.max : 'min ' + c.min}
        </div>
      ) : null}

      {!mini ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 * s, marginTop: 2 * s, flex: 'none' }}>
          <RoundBtn dir={-1} disabled={atMin} />
          <button
            onClick={reset}
            aria-label="reset"
            style={{
              width: 32 * s, height: 32 * s, borderRadius: 99, display: 'grid', placeItems: 'center',
              background: 'transparent', border: 'none', color: 'var(--w-mut)', cursor: 'pointer',
              transition: 'color 0.15s, transform 0.4s', flex: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--w-fg)'; e.currentTarget.style.transform = 'rotate(-90deg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--w-mut)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >
            <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v4h4" />
            </svg>
          </button>
          <RoundBtn dir={1} disabled={atMax} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- DAILY CHECKLIST ---------------- */
function ChecklistW({ config: c, accent, s, fontStack, mini }) {
  const items = useMemo(() => {
    const arr = Array.isArray(c.items) ? c.items.filter(x => x && String(x).trim()) : [];
    return arr.length ? arr.map(String) : ['Plan day', 'Deep work', 'Inbox zero'];
  }, [c.items]);
  const reset = c.reset || 'daily';
  const showProgress = c.showProgress !== false;
  const title = c.title || 'Today';

  const periodKey = (d) => {
    if (reset === 'never') return 'fixed';
    if (reset === 'weekly') {
      const t = new Date(d); const day = (t.getDay() + 6) % 7;
      t.setDate(t.getDate() - day);
      return 'w' + t.getFullYear() + '-' + t.getMonth() + '-' + t.getDate();
    }
    return 'd' + d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  };

  const storeKey = 'nc_checklist_state';
  const now = useNow(true, 30000);
  const curPeriod = periodKey(now);

  const load = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(storeKey) || '{}');
      if (raw.period === curPeriod && Array.isArray(raw.done)) return raw.done;
    } catch (e) {}
    return [];
  };

  const [done, setDone] = useState(load);
  const [period, setPeriod] = useState(curPeriod);

  useEffect(() => {
    if (period !== curPeriod) { setDone([]); setPeriod(curPeriod); }
  }, [curPeriod, period]);

  useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify({ period: curPeriod, done })); } catch (e) {}
  }, [done, curPeriod]);

  const isDone = (i) => done.indexOf(i) !== -1;
  const toggle = (i) => setDone(p => p.indexOf(i) !== -1 ? p.filter(x => x !== i) : p.concat(i));

  const total = items.length;
  const completed = items.reduce((n, _, i) => n + (isDone(i) ? 1 : 0), 0);
  const pct = total ? completed / total : 0;
  const allDone = total > 0 && completed === total;

  const resetLabel = reset === 'weekly' ? 'Resets weekly' : reset === 'never' ? 'No reset' : 'Resets daily';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 13 * s, padding: 20 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 * s, minWidth: 0 }}>
          <div style={{ fontSize: 15 * s, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {reset !== 'never' && (
            <div style={{ fontSize: 9.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, whiteSpace: 'nowrap' }}>{resetLabel}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, flexShrink: 0 }}>
          {allDone && <Icon name="check" color={accent} variant="filled" size={14 * s} />}
          <div style={{ fontSize: 12.5 * s, fontWeight: 700, color: allDone ? accent : 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>{completed}/{total}</div>
        </div>
      </div>

      {showProgress && (
        <div style={{ height: 5 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: (pct * 100) + '%', borderRadius: 99, background: accent, transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s }}>
        {items.map((label, i) => {
          const d = isDone(i);
          return (
            <button key={i} onClick={() => toggle(i)} disabled={mini}
              style={{ display: 'flex', alignItems: 'center', gap: 11 * s, padding: `${6.5 * s}px ${4 * s}px`, background: 'transparent', border: 'none', textAlign: 'left', cursor: mini ? 'default' : 'pointer', width: '100%' }}>
              <span style={{ width: 20 * s, height: 20 * s, flexShrink: 0, borderRadius: 6 * s, display: 'grid', placeItems: 'center', background: d ? accent : 'transparent', border: `1.5px solid ${d ? accent : 'var(--w-line)'}`, transition: 'all 0.2s var(--ease)' }}>
                {d && <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="none" stroke={onColor(accent)} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>}
              </span>
              <span style={{ fontSize: 13.5 * s, fontWeight: 500, lineHeight: 1.3, color: d ? 'var(--w-mut)' : 'var(--w-fg)', textDecoration: d ? 'line-through' : 'none', textDecorationColor: 'var(--w-mut)', transition: 'color 0.2s var(--ease)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- LINK BUTTON ---------------- */
function LinkButtonW({ config: c, accent, s, fontStack, mini }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  const label = c.label || 'Open link';
  const rawUrl = (c.url || '').trim();
  const variant = c.variant || 'solid';
  const align = c.align || 'fill';
  const icon = c.icon || 'none';
  const newTab = c.newTab !== false;
  const showArrow = c.showArrow !== false;

  const safeUrl = useMemo(() => {
    if (!rawUrl || rawUrl === 'https://' || rawUrl === 'http://') return '';
    if (/^(https?:|mailto:|tel:)/i.test(rawUrl)) return rawUrl;
    return 'https://' + rawUrl.replace(/^\/+/, '');
  }, [rawUrl]);

  const host = useMemo(() => {
    if (!safeUrl) return '';
    try {
      if (/^mailto:/i.test(safeUrl)) return safeUrl.slice(7);
      if (/^tel:/i.test(safeUrl)) return safeUrl.slice(4);
      const u = new URL(safeUrl);
      return (u.hostname || '').replace(/^www\./, '') + (u.pathname && u.pathname !== '/' ? u.pathname : '');
    } catch (e) { return safeUrl.replace(/^https?:\/\//i, ''); }
  }, [safeUrl]);

  const disabled = !safeUrl;

  // variant styling
  let bg, fg, border, iconColor, subColor, shadow;
  if (variant === 'outline') {
    bg = hover ? lighten(accent, 0.9) : 'transparent';
    fg = accent;
    iconColor = accent;
    subColor = accent;
    border = `1.5px solid ${accent}`;
    shadow = 'none';
  } else if (variant === 'soft') {
    bg = hover ? lighten(accent, 0.82) : lighten(accent, 0.88);
    fg = accent;
    iconColor = accent;
    subColor = accent;
    border = `1px solid ${lighten(accent, 0.72)}`;
    shadow = 'none';
  } else { // solid
    bg = hover ? lighten(accent, 0.1) : accent;
    fg = onColor(accent);
    iconColor = onColor(accent);
    subColor = onColor(accent);
    border = '1px solid transparent';
    shadow = hover
      ? `0 ${10 * s}px ${26 * s}px ${accent}38, 0 ${2 * s}px ${4 * s}px ${accent}24`
      : `0 ${4 * s}px ${12 * s}px ${accent}24`;
  }

  const lift = disabled ? 0 : (press ? 0 : hover ? -2 * s : 0);
  const fullWidth = align === 'fill';

  const Arrow = (
    <svg width={17 * s} height={17 * s} viewBox="0 0 24 24" fill="none"
      stroke={iconColor} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', transform: `translateX(${hover && !disabled ? 2 * s : 0}px)`, transition: 'transform .25s cubic-bezier(.2,.8,.2,1)', flexShrink: 0 }}>
      <path d="M5 12 H18" opacity={hover && !disabled ? 0.95 : 0.55} />
      <path d="M13 6.5 L18.5 12 L13 17.5" />
    </svg>
  );

  const inner = (
    <span style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10 * s, width: '100%', minWidth: 0,
    }}>
      {icon !== 'none' ? (
        <span style={{ display: 'flex', flexShrink: 0 }}>
          <Icon name={icon} color={iconColor} variant={variant === 'solid' ? 'outline' : 'outline'} size={18 * s} sw={1.9} />
        </span>
      ) : null}
      <span style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        minWidth: 0, lineHeight: 1.15,
      }}>
        <span style={{
          fontSize: 15 * s, fontWeight: 650, letterSpacing: '-0.01em',
          color: fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
        }}>{disabled ? 'Set a link' : label}</span>
        {host && !disabled ? (
          <span style={{
            fontSize: 10.5 * s, fontWeight: 500, marginTop: 3 * s,
            color: subColor, opacity: 0.62, whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis', maxWidth: '100%', letterSpacing: '0.01em',
            fontVariantNumeric: 'tabular-nums',
          }}>{host}</span>
        ) : null}
      </span>
      {showArrow ? Arrow : null}
    </span>
  );

  const sharedStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box',
    width: fullWidth ? '100%' : 'auto',
    maxWidth: '100%',
    padding: `${13 * s}px ${18 * s}px`,
    borderRadius: 13 * s,
    background: disabled ? 'transparent' : bg,
    border: disabled ? `1.5px dashed var(--w-line)` : border,
    boxShadow: disabled ? 'none' : shadow,
    cursor: disabled ? 'default' : 'pointer',
    textDecoration: 'none',
    fontFamily: fontStack || 'inherit',
    transform: `translateY(${lift}px) scale(${press && !disabled ? 0.985 : 1})`,
    transition: 'transform .22s cubic-bezier(.2,.8,.2,1), background .2s ease, box-shadow .25s ease',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const handleEnter = () => !disabled && setHover(true);
  const handleLeave = () => { setHover(false); setPress(false); };

  const content = disabled ? (
    <div style={sharedStyle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
        <Icon name="globe" color="var(--w-mut)" variant="outline" size={17 * s} sw={1.8} />
        <span style={{ fontSize: 14 * s, fontWeight: 600, color: 'var(--w-mut)' }}>Set a link</span>
      </span>
    </div>
  ) : (
    <a
      href={safeUrl}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={sharedStyle}
    >
      {inner}
    </a>
  );

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 8 * s, padding: 18 * s,
    }}>
      {c.heading ? (
        <div style={{
          fontSize: 11 * s, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--w-mut)', fontWeight: 600, marginBottom: 2 * s, textAlign: 'center',
        }}>{c.heading}</div>
      ) : null}
      <div style={{ width: '100%', display: 'flex', justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}>
        {content}
      </div>
      {c.caption && !disabled ? (
        <div style={{
          fontSize: 11.5 * s, color: 'var(--w-mut)', textAlign: 'center',
          marginTop: 2 * s, maxWidth: '90%', lineHeight: 1.4,
        }}>{c.caption}</div>
      ) : null}
    </div>
  );
}

/* ---------------- QUICK LAUNCH ---------------- */
function ButtonGridW({ config: c, accent, s, fontStack, mini }) {
  const ICONS = ['rocket', 'inbox', 'book', 'folder', 'calendar', 'globe', 'compass', 'bolt', 'chart', 'wallet', 'music', 'camera', 'coffee', 'palette', 'code', 'bell', 'star', 'heart', 'home', 'gem', 'flag', 'tag', 'bookmark', 'lightbulb'];
  const fallback = useMemo(() => [
    { label: 'Mail', url: 'https://', icon: 'inbox' },
    { label: 'Docs', url: 'https://', icon: 'book' },
    { label: 'Calendar', url: 'https://', icon: 'calendar' }
  ], []);
  const cfgButtons = Array.isArray(c.buttons) && c.buttons.length ? c.buttons : fallback;
  const cols = Math.max(1, Math.min(6, c.columns || 3));
  const radius = c.radius == null ? 12 : c.radius;
  const layout = c.layout || 'tile';

  const safeIcon = (name) => ICONS.indexOf(name) >= 0 ? name : 'rocket';
  const cleanUrl = (u) => {
    if (!u) return null;
    let t = String(u).trim();
    if (!t || t === 'https://' || t === 'http://') return null;
    if (!/^https?:\/\//i.test(t)) t = 'https://' + t;
    return t;
  };
  const open = (u) => { const t = cleanUrl(u); if (t) { try { window.open(t, '_blank', 'noopener'); } catch (e) {} } };
  const hostOf = (u) => { try { return new URL(cleanUrl(u)).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

  const [hover, setHover] = useState(-1);

  // Budget-aware caps: tile rows must fit ~222px height.
  // With title (~22px) + padding (~28px) + gap, we have room for a single tile row,
  // or two compact rows. List: cap at 3 rows (mini 2).
  const isList = layout === 'list';
  const maxItems = isList
    ? (mini ? 2 : 3)
    : (mini ? cols : cols * 2);
  const list = cfgButtons.slice(0, maxItems);

  const Tile = (b, i) => {
    const active = hover === i;
    const live = !!cleanUrl(b.url);
    return (
      <button
        key={i}
        onClick={() => open(b.url)}
        onMouseEnter={() => setHover(i)}
        onMouseLeave={() => setHover(-1)}
        title={cleanUrl(b.url) || b.label}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: isList ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: isList ? 'flex-start' : 'center',
          gap: isList ? 11 * s : 7 * s,
          padding: isList ? `${9 * s}px ${12 * s}px` : `${11 * s}px ${8 * s}px`,
          borderRadius: radius * s,
          border: '1px solid var(--w-line)',
          background: active ? lighten(accent, 0.86) : 'var(--w-card, transparent)',
          cursor: live ? 'pointer' : 'default',
          textAlign: isList ? 'left' : 'center',
          transition: 'background 0.16s ease, border-color 0.16s ease, transform 0.16s ease',
          borderColor: active ? lighten(accent, 0.4) : 'var(--w-line)',
          transform: active ? 'translateY(-1px)' : 'none',
          overflow: 'hidden',
          minWidth: 0
        }}
      >
        <span style={{
          flexShrink: 0,
          width: (isList ? 32 : 36) * s,
          height: (isList ? 32 : 36) * s,
          borderRadius: (radius - 4) * s,
          display: 'grid',
          placeItems: 'center',
          background: active ? accent : lighten(accent, 0.82),
          transition: 'background 0.16s ease'
        }}>
          <Icon name={safeIcon(b.icon)} color={active ? onColor(accent) : accent} variant="outline" size={(isList ? 18 : 20) * s} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1 * s, minWidth: 0, alignItems: isList ? 'flex-start' : 'center' }}>
          <span style={{
            fontSize: (isList ? 13 : 12) * s,
            fontWeight: 600,
            color: 'var(--w-fg)',
            letterSpacing: '-0.01em',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.15
          }}>{b.label || 'Untitled'}</span>
          {isList && hostOf(b.url) ? <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{hostOf(b.url)}</span> : null}
        </span>
        {isList ? (
          <span style={{ marginLeft: 'auto', flexShrink: 0, opacity: active ? 1 : 0.35, transition: 'opacity 0.16s ease' }}>
            <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="var(--w-mut)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 * s, padding: 15 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      {c.title ? (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 * s, paddingInline: 2 * s }}>
          <span style={{ fontSize: 12.5 * s, fontWeight: 700, color: 'var(--w-fg)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{c.title}</span>
          <span style={{ fontSize: 10 * s, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{list.length}</span>
        </div>
      ) : null}
      {isList ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * s }}>
          {list.map((b, i) => Tile(b, i))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8 * s }}>
          {list.map((b, i) => Tile(b, i))}
        </div>
      )}
    </div>
  );
}

/* ---------------- FOCUS TIMER PLUS ---------------- */
function FocusTimerProW({ config: c, accent, s, fontStack, mini }) {
  const work = Math.max(1, c.work || 25);
  const brk = Math.max(1, c.brk || 5);
  const longBreak = Math.max(1, c.longBreak || 15);
  const cycles = Math.max(1, c.cycles || 4);
  const sound = c.sound || 'off';
  const task = c.task || '';

  const PHASES = useMemo(() => ({
    work: { label: 'Focus', mins: work, tint: accent },
    brk: { label: 'Break', mins: brk, tint: lighten(accent, 0.28) },
    longBreak: { label: 'Long Break', mins: longBreak, tint: lighten(accent, 0.45) },
  }), [work, brk, longBreak, accent]);

  const [phase, setPhase] = useState('work');
  const [left, setLeft] = useState(work * 60);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(() => {
    try { return Math.max(0, parseInt(localStorage.getItem('nc_focusTimerPro_round')) || 0); } catch (e) { return 0; }
  });
  const [done, setDone] = useState(() => {
    try { return Math.max(0, parseInt(localStorage.getItem('nc_focusTimerPro_done')) || 0); } catch (e) { return 0; }
  });

  useEffect(() => { try { localStorage.setItem('nc_focusTimerPro_round', String(round)); } catch (e) {} }, [round]);
  useEffect(() => { try { localStorage.setItem('nc_focusTimerPro_done', String(done)); } catch (e) {} }, [done]);

  const total = PHASES[phase].mins * 60;
  const endRef = useRef(null);
  const audioRef = useRef(null);
  const oscRef = useRef(null);

  const phaseKeyRef = useRef(phase);
  useEffect(() => {
    if (!running) { setLeft(PHASES[phase].mins * 60); }
    phaseKeyRef.current = phase;
  }, [phase, work, brk, longBreak]);

  function ensureCtx() {
    if (typeof window === 'undefined') return null;
    if (!audioRef.current) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioRef.current = new AC();
      } catch (e) { return null; }
    }
    return audioRef.current;
  }
  function stopSound() {
    const node = oscRef.current;
    oscRef.current = null;
    if (!node) return;
    try {
      node.gain.gain.cancelScheduledValues(node.ctx.currentTime);
      node.gain.gain.setTargetAtTime(0.0001, node.ctx.currentTime, 0.15);
      const srcs = node.srcs;
      setTimeout(() => { srcs.forEach(sr => { try { sr.stop(); } catch (e) {} }); }, 400);
    } catch (e) {}
  }
  function startSound() {
    if (sound === 'off') return;
    const ctx = ensureCtx();
    if (!ctx) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    if (oscRef.current) return;
    try {
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      gain.connect(ctx.destination);
      const srcs = [];
      const target = 0.05;
      if (sound === 'rain' || sound === 'waves' || sound === 'noise') {
        const len = 2 * ctx.sampleRate;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 3.2;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = sound === 'rain' ? 1400 : sound === 'waves' ? 600 : 8000;
        src.connect(filt); filt.connect(gain);
        if (sound === 'waves') {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 0.12; lfoGain.gain.value = target * 0.6;
          gain.gain.value = target * 0.4;
          lfo.connect(lfoGain); lfoGain.connect(gain.gain);
          lfo.start(); srcs.push(lfo);
        }
        src.start(); srcs.push(src);
      } else if (sound === 'tone') {
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.value = 174;
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine'; osc2.frequency.value = 261.6;
        const g2 = ctx.createGain(); g2.gain.value = 0.4;
        osc.connect(gain); osc2.connect(g2); g2.connect(gain);
        osc.start(); osc2.start(); srcs.push(osc, osc2);
      }
      gain.gain.setTargetAtTime(target, ctx.currentTime, 0.4);
      oscRef.current = { ctx, gain, srcs };
    } catch (e) {}
  }
  function chime() {
    const ctx = ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [880, 1174].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + i * 0.14);
        g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.14 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.5);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.14); o.stop(now + i * 0.14 + 0.55);
      });
    } catch (e) {}
  }

  function nextPhase() {
    chime();
    if (phase === 'work') {
      const nr = round + 1;
      setDone(d => d + 1);
      if (nr >= cycles) {
        setRound(0);
        setPhase('longBreak');
        setLeft(PHASES.longBreak.mins * 60);
      } else {
        setRound(nr);
        setPhase('brk');
        setLeft(PHASES.brk.mins * 60);
      }
    } else {
      setPhase('work');
      setLeft(PHASES.work.mins * 60);
    }
  }
  const nextRef = useRef(nextPhase); nextRef.current = nextPhase;

  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const rem = Math.round((endRef.current - Date.now()) / 1000);
      if (rem <= 0) {
        clearInterval(id);
        nextRef.current();
        endRef.current = null;
        return;
      }
      setLeft(rem);
    }, 250);
    return () => clearInterval(id);
  }, [running, phase]);

  useEffect(() => {
    if (running && sound !== 'off') startSound(); else stopSound();
    return () => {};
  }, [running, sound]);

  useEffect(() => () => { stopSound(); }, []);

  function toggle() {
    if (mini) return;
    setRunning(r => {
      if (!r) ensureCtx();
      return !r;
    });
  }
  function reset() {
    setRunning(false);
    setLeft(PHASES[phase].mins * 60);
  }
  function skip() {
    setRunning(false);
    setLeft(0);
    setTimeout(() => nextRef.current(), 0);
  }

  const pct = total > 0 ? 1 - left / total : 0;
  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const cur = PHASES[phase];
  const tint = cur.tint;

  const R = 54, CIRC = 2 * Math.PI * R;
  const ring = 104;

  const SOUND_ICON = {
    rain: 'M7 16a4 4 0 0 1-.5-7.97A5 5 0 0 1 16 7a3.5 3.5 0 0 1 1 6.86M8 18l-1 2M12 18l-1 2M16 18l-1 2',
    waves: 'M2 12c2-2 3-2 5 0s3 2 5 0 3-2 5 0 3 2 5 0M2 17c2-2 3-2 5 0s3 2 5 0 3-2 5 0 3 2 5 0',
    noise: 'M4 13v-2M8 16V8M12 19V5M16 16V8M20 13v-2',
    tone: 'M9 18V5l10-2v13M9 13l10-2M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 * s, padding: `${14 * s}px ${16 * s}px`, fontFamily: fontStack }}>
      <div style={{ position: 'relative', width: ring * s, height: ring * s, flexShrink: 0 }}>
        <svg width={ring * s} height={ring * s} viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="66" cy="66" r={R} fill="none" stroke="var(--w-line)" strokeWidth="7" />
          <circle cx="66" cy="66" r={R} fill="none" stroke={tint} strokeWidth="7" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * s }}>
          <div style={{ fontSize: 26 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
          </div>
          <div style={{ display: 'flex', gap: 4 * s, marginTop: 2 * s }}>
            {Array.from({ length: Math.min(cycles, 6) }).map((_, i) => (
              <span key={i} style={{ width: 4.5 * s, height: 4.5 * s, borderRadius: 99, background: i < round ? accent : (i === round && phase === 'work') ? tint : 'var(--w-line)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s }}>
          <span style={{ width: 7 * s, height: 7 * s, borderRadius: 99, background: tint, boxShadow: running ? `0 0 0 ${3 * s}px ${tint}33` : 'none', transition: 'box-shadow 0.3s' }} />
          <span style={{ fontSize: 11.5 * s, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 700 }}>{cur.label}</span>
        </div>

        {task ? (
          <div style={{ fontSize: 13 * s, fontWeight: 600, color: 'var(--w-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task}</div>
        ) : null}

        {!mini ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
            <button onClick={reset} aria-label="Reset" style={{ width: 32 * s, height: 32 * s, borderRadius: 99, display: 'grid', placeItems: 'center', background: 'transparent', border: `1.5px solid var(--w-line)`, color: 'var(--w-mut)', cursor: 'pointer' }}>
              <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
            <button onClick={toggle} style={{ height: 36 * s, padding: `0 ${18 * s}px`, borderRadius: 99, display: 'flex', alignItems: 'center', gap: 7 * s, background: running ? 'transparent' : accent, border: running ? `1.5px solid ${accent}` : 'none', color: running ? accent : onColor(accent), fontSize: 13 * s, fontWeight: 700, cursor: 'pointer', fontFamily: fontStack }}>
              {running ? (
                <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5Z" /></svg>
              )}
              {running ? 'Pause' : 'Start'}
            </button>
            <button onClick={skip} aria-label="Skip" style={{ width: 32 * s, height: 32 * s, borderRadius: 99, display: 'grid', placeItems: 'center', background: 'transparent', border: `1.5px solid var(--w-line)`, color: 'var(--w-mut)', cursor: 'pointer' }}>
              <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4l10 8-10 8z" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
            </button>
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 * s, fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 600 }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{done} done</span>
          {sound !== 'off' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 * s, opacity: running ? 1 : 0.5 }}>
              <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={SOUND_ICON[sound] || SOUND_ICON.noise} /></svg>
              <span style={{ textTransform: 'capitalize' }}>{sound}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------- DAY IN PROGRESS ---------------- */
function TodayHeaderW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 30000);
  const scopes = Array.isArray(c.scopes) && c.scopes.length ? c.scopes : ['day', 'week', 'month', 'year'];
  const showPercent = c.showPercent !== false;

  const META = {
    day:   { label: 'Today' },
    week:  { label: 'This Week' },
    month: { label: 'This Month' },
    year:  { label: 'This Year' },
  };

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  const calc = (scope) => {
    const ms = now.getTime();
    let start, end, sub;
    const y = now.getFullYear(), mo = now.getMonth();
    if (scope === 'day') {
      const d0 = new Date(y, mo, now.getDate()).getTime();
      start = d0; end = d0 + 864e5;
      const h = now.getHours();
      sub = (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? ' AM' : ' PM');
    } else if (scope === 'week') {
      // Monday-start week
      const dow = (now.getDay() + 6) % 7;
      const d0 = new Date(y, mo, now.getDate() - dow).getTime();
      start = d0; end = d0 + 7 * 864e5;
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      sub = names[dow];
    } else if (scope === 'month') {
      start = new Date(y, mo, 1).getTime();
      end = new Date(y, mo + 1, 1).getTime();
      sub = now.getDate() + ' / ' + daysInMonth(y, mo);
    } else {
      start = new Date(y, 0, 1).getTime();
      end = new Date(y + 1, 0, 1).getTime();
      const total = isLeap(y) ? 366 : 365;
      const dayOfYear = Math.floor((ms - start) / 864e5) + 1;
      sub = dayOfYear + ' / ' + total;
    }
    const frac = Math.min(1, Math.max(0, (ms - start) / (end - start)));
    return { frac, sub };
  };

  const Row = ({ scope, idx }) => {
    const m = META[scope];
    if (!m) return null;
    const { frac, sub } = calc(scope);
    const pct = Math.round(frac * 100);
    const trackH = 7 * s;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * s }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 * s }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 * s, minWidth: 0 }}>
            <span style={{ fontSize: 12.5 * s, fontWeight: 600, color: 'var(--w-fg)', letterSpacing: '-0.01em' }}>{m.label}</span>
            <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sub}</span>
          </div>
          {showPercent ? (
            <span style={{ fontSize: 12 * s, fontWeight: 700, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{pct}<span style={{ fontSize: 9 * s, fontWeight: 600, color: 'var(--w-mut)', marginLeft: 1 * s }}>%</span></span>
          ) : null}
        </div>
        <div style={{ position: 'relative', height: trackH, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: (frac * 100) + '%',
            minWidth: frac > 0 ? trackH : 0,
            borderRadius: 99,
            background: 'linear-gradient(90deg, ' + lighten(accent, 0.12) + ', ' + accent + ')',
            boxShadow: '0 0 ' + (6 * s) + 'px ' + accent + '55',
            transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 15 * s, padding: 20 * s, fontFamily: fontStack }}>
      {scopes.map((sc, i) => <Row key={sc + i} scope={sc} idx={i} />)}
    </div>
  );
}

/* ---------------- MINI CALENDAR ---------------- */
function MiniCalendarW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 60000);
  const weekStart = c.weekStart === 'Sun' ? 0 : 1;
  const showWeekNumbers = !!c.showWeekNumbers;

  const today = useMemo(() => {
    const d = new Date(now);
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
  }, [now]);

  const [view, setView] = useState(() => ({ y: today.y, m: today.m }));

  useEffect(() => {
    setView(v => v.y === today.y && v.m === today.m ? v : v);
  }, [today.y, today.m]);

  const monthName = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(view.y, view.m, 1));
    } catch (e) {
      return ['January','February','March','April','May','June','July','August','September','October','November','December'][view.m];
    }
  }, [view.y, view.m]);

  const dayLabels = useMemo(() => {
    const base = ['S','M','T','W','T','F','S'];
    const out = [];
    for (let i = 0; i < 7; i++) out.push(base[(weekStart + i) % 7]);
    return out;
  }, [weekStart]);

  const isoWeek = (y, m, day) => {
    const dt = new Date(Date.UTC(y, m, day));
    const dayNum = (dt.getUTCDay() + 6) % 7;
    dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
    return 1 + Math.round((dt - firstThursday) / 6048e5);
  };

  const weeks = useMemo(() => {
    const firstDow = new Date(view.y, view.m, 1).getDay();
    const lead = (firstDow - weekStart + 7) % 7;
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      const row = cells.slice(i, i + 7);
      const firstReal = row.find(x => x != null) || 1;
      rows.push({ days: row, wk: isoWeek(view.y, view.m, firstReal) });
    }
    return rows;
  }, [view.y, view.m, weekStart]);

  const shift = (dir) => setView(v => {
    let m = v.m + dir, y = v.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    return { y, m };
  });

  const goToday = () => setView({ y: today.y, m: today.m });
  const isCurrentView = view.y === today.y && view.m === today.m;

  const cols = showWeekNumbers ? 8 : 7;
  const cellSize = 26 * s;
  const gap = 2 * s;

  const NavBtn = ({ dir, label }) => (
    <button onClick={() => shift(dir)} aria-label={label} style={{ display: 'grid', placeItems: 'center', width: 22 * s, height: 22 * s, borderRadius: 6 * s, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--w-mut)' }}>
      <svg width={11 * s} height={11 * s} viewBox="0 0 12 12" fill="none" style={{ transform: dir < 0 ? 'rotate(180deg)' : 'none' }}>
        <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s, maxWidth: (cols * (cellSize + gap)) + 8 * s }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s, minWidth: 0 }}>
          <span style={{ fontSize: 15 * s, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--w-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{monthName}</span>
          <span style={{ fontSize: 12 * s, fontWeight: 500, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>{view.y}</span>
        </div>
        {!mini && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 * s }}>
            {!isCurrentView && (
              <button onClick={goToday} style={{ fontSize: 10.5 * s, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: accent, background: 'transparent', border: 'none', cursor: 'pointer', padding: `0 ${6 * s}px`, height: 22 * s }}>Today</button>
            )}
            <NavBtn dir={-1} label="Previous month" />
            <NavBtn dir={1} label="Next month" />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: `${gap}px`, justifyContent: 'center' }}>
        {showWeekNumbers ? <div style={{ width: cellSize, height: 20 * s }} /> : null}
        {dayLabels.map((d, i) => (
          <div key={'h' + i} style={{ width: cellSize, height: 20 * s, display: 'grid', placeItems: 'center', fontSize: 10.5 * s, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--w-mut)' }}>{d}</div>
        ))}

        {weeks.map((row, ri) => (
          <React.Fragment key={'r' + ri}>
            {showWeekNumbers ? (
              <div style={{ width: cellSize, height: cellSize, display: 'grid', placeItems: 'center', fontSize: 9.5 * s, fontWeight: 500, color: 'var(--w-line)', fontVariantNumeric: 'tabular-nums' }}>{row.wk}</div>
            ) : null}
            {row.days.map((day, di) => {
              const isToday = isCurrentView && day === today.d;
              return (
                <div key={'c' + ri + '-' + di} style={{ width: cellSize, height: cellSize, display: 'grid', placeItems: 'center', position: 'relative' }}>
                  {day != null && (
                    <span style={{
                      width: cellSize - 4 * s,
                      height: cellSize - 4 * s,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 99,
                      fontSize: 12.5 * s,
                      fontWeight: isToday ? 700 : 500,
                      fontVariantNumeric: 'tabular-nums',
                      color: isToday ? onColor(accent) : 'var(--w-fg)',
                      background: isToday ? accent : 'transparent',
                      letterSpacing: '-0.01em',
                      transition: 'background 0.15s ease'
                    }}>{day}</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------------- EVENT COUNTDOWN ---------------- */
function CountdownEventW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 1000);
  const units = (c.units && c.units.length) ? c.units : ['d', 'h', 'm'];
  const title = c.title || 'Holidays';

  const target = useMemo(() => {
    const t = c.target ? new Date(c.target) : new Date(Date.now() + 30 * 864e5);
    return isNaN(t.getTime()) ? new Date(Date.now() + 30 * 864e5) : t;
  }, [c.target]);

  const totalMs = target - now;
  const past = totalMs <= 0;
  let diff = Math.max(0, totalMs);

  const d = Math.floor(diff / 864e5); diff -= d * 864e5;
  const h = Math.floor(diff / 36e5); diff -= h * 36e5;
  const m = Math.floor(diff / 6e4); diff -= m * 6e4;
  const sec = Math.floor(diff / 1e3);

  const vals = { d: d, h: h, m: m, s: sec };
  const labels = { d: d === 1 ? 'day' : 'days', h: 'hrs', m: 'min', s: 'sec' };

  const fmtDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(target);
    } catch (e) { return ''; }
  }, [target]);

  const cell = (key) => {
    const isFlip = key === 's' || key === 'm';
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 * s, minWidth: 52 * s }}>
        <div style={{
          fontSize: 38 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)',
          fontFeatureSettings: '"tnum"'
        }}>
          {String(vals[key]).padStart(2, '0')}
        </div>
        <div style={{
          fontSize: 9.5 * s, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--w-mut)', fontWeight: 600
        }}>
          {labels[key]}
        </div>
      </div>
    );
  };

  const sep = (i) => (
    <div key={'sep' + i} style={{
      fontSize: 30 * s, fontWeight: 300, lineHeight: 1, color: 'var(--w-line)',
      alignSelf: 'flex-start', marginTop: 3 * s, fontVariantNumeric: 'tabular-nums'
    }}>:</div>
  );

  const cells = [];
  units.forEach((u, i) => {
    if (i > 0) cells.push(sep(i));
    cells.push(cell(u));
  });

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18 * s, padding: 20 * s,
      fontFamily: fontStack
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * s }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7 * s
        }}>
          <span style={{
            width: 6 * s, height: 6 * s, borderRadius: 99, background: accent,
            boxShadow: `0 0 ${8 * s}px ${accent}`
          }} />
          <span style={{ fontSize: 15 * s, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--w-fg)' }}>{title}</span>
        </div>
        {c.showDate !== false && fmtDate ? (
          <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500, letterSpacing: '0.01em' }}>{fmtDate}</div>
        ) : null}
      </div>

      {past ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8 * s,
          padding: `${9 * s}px ${16 * s}px`, borderRadius: 99,
          background: accent, color: onColor(accent),
          fontSize: 14 * s, fontWeight: 600, letterSpacing: '0.01em'
        }}>
          <Icon name="check" color={onColor(accent)} size={15 * s} />
          {c.doneText || "It's here!"}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          gap: 8 * s
        }}>
          {cells}
        </div>
      )}
    </div>
  );
}

/* ---------------- WEEK PLANNER ---------------- */
function WeekPlannerW({ config: c, accent, s, fontStack, mini }) {
  const WEEK_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEK_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const start = c.weekStart === 'Sun' ? 'Sun' : 'Mon';
  const accentToday = c.accentToday !== false;
  const days = start === 'Sun' ? WEEK_SUN : WEEK_MON;

  // JS getDay(): 0=Sun..6=Sat. Map to our column order.
  const now = useNow(false, 60000);
  const jsDay = now.getDay();
  const todayIdx = start === 'Sun' ? jsDay : (jsDay + 6) % 7;

  // Monday/Sunday date for each column header number.
  const colDates = useMemo(() => {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + (i - todayIdx));
      out.push(d.getDate());
    }
    return out;
  }, [now.getFullYear(), now.getMonth(), now.getDate(), todayIdx]);

  const KEY = 'nc_weekPlanner_notes';
  const seed = c.notes && typeof c.notes === 'object' ? c.notes : {};
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return seed;
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) {} }, [notes]);

  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (editing != null && inputRef.current) inputRef.current.focus(); }, [editing]);

  const colNotes = (dk) => (Array.isArray(notes[dk]) ? notes[dk] : []);

  const addNote = (dk) => {
    const t = draft.trim();
    if (t) setNotes(p => ({ ...p, [dk]: [...colNotes(dk), t] }));
    setDraft('');
    setEditing(null);
  };
  const removeNote = (dk, i) => {
    setNotes(p => ({ ...p, [dk]: colNotes(dk).filter((_, j) => j !== i) }));
  };

  const dot = (col) => (accentToday && col === todayIdx ? accent : 'var(--w-mut)');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 14 * s, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 * s, paddingLeft: 2 * s, paddingRight: 2 * s }}>
        <div style={{ fontSize: 14 * s, fontWeight: 700, letterSpacing: '-0.01em' }}>{c.title || 'This Week'}</div>
        <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {now.toLocaleString('en-US', { month: 'short' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 * s, alignItems: 'stretch' }}>
        {days.map((dl, col) => {
          const dk = String(col);
          const isToday = accentToday && col === todayIdx;
          const list = colNotes(dk);
          const isEd = editing === col;
          return (
            <div key={col} style={{
              display: 'flex', flexDirection: 'column', gap: 5 * s,
              background: isToday ? lighten(accent, 0.86) : 'transparent',
              border: `1px solid ${isToday ? lighten(accent, 0.55) : 'var(--w-line)'}`,
              borderRadius: 9 * s, padding: 7 * s, minHeight: 78 * s,
              transition: 'background 0.2s var(--ease)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * s, marginBottom: 2 * s }}>
                <div style={{
                  fontSize: 9.5 * s, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: isToday ? accent : 'var(--w-mut)'
                }}>{dl}</div>
                <div style={{
                  fontSize: 12.5 * s, fontWeight: isToday ? 800 : 600, lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  color: isToday ? accent : 'var(--w-fg)'
                }}>{colDates[col]}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * s, flex: 1 }}>
                {list.map((n, i) => (
                  <button key={i}
                    onClick={() => !mini && removeNote(dk, i)}
                    title={mini ? n : 'Click to remove'}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 3 * s, textAlign: 'left',
                      width: '100%', padding: `${3.5 * s}px ${4 * s}px`, borderRadius: 6 * s,
                      background: 'var(--w-card, rgba(127,127,127,0.06))',
                      border: 'none', cursor: mini ? 'default' : 'pointer',
                      fontFamily: fontStack, lineHeight: 1.25
                    }}>
                    <span style={{ width: 4 * s, height: 4 * s, borderRadius: 99, background: dot(col), marginTop: 4.5 * s, flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5 * s, color: 'var(--w-fg)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{n}</span>
                  </button>
                ))}

                {!mini && isEd && (
                  <input ref={inputRef} value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={() => addNote(dk)}
                    onKeyDown={e => { if (e.key === 'Enter') addNote(dk); if (e.key === 'Escape') { setDraft(''); setEditing(null); } }}
                    placeholder="note…"
                    style={{
                      width: '100%', boxSizing: 'border-box', border: `1px solid ${accent}`,
                      borderRadius: 6 * s, padding: `${3 * s}px ${4 * s}px`, fontSize: 9.5 * s,
                      background: 'var(--w-bg, transparent)', color: 'var(--w-fg)',
                      outline: 'none', fontFamily: fontStack
                    }} />
                )}

                {!mini && !isEd && (
                  <button onClick={() => { setDraft(''); setEditing(col); }}
                    title="Add note"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', padding: `${2.5 * s}px 0`, borderRadius: 6 * s,
                      border: `1px dashed ${isToday ? lighten(accent, 0.4) : 'var(--w-line)'}`,
                      background: 'transparent', cursor: 'pointer', color: 'var(--w-mut)',
                      marginTop: list.length ? 1 * s : 0, opacity: 0.85
                    }}>
                    <svg width={9 * s} height={9 * s} viewBox="0 0 24 24" fill="none" stroke={isToday ? accent : 'var(--w-mut)'} strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- SAVINGS GOAL ---------------- */
function SavingsRingW({ config: c, accent, s, fontStack, mini }) {
  const goal = c.goal || 'Savings goal';
  const target = Math.max(1, Number(c.target) || 10000);
  const current = Math.max(0, Number(c.current) || 0);
  const currency = c.currency || 'USD';

  const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', AUD: '$', CAD: '$', CNY: '¥' };
  const sym = symbols[currency] || '';

  const raw = Math.min(1, current / target);
  const pct = Math.round(raw * 100);
  const reached = current >= target;
  const remaining = Math.max(0, target - current);

  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = 0;
    const dur = 900;
    const tick = (t) => {
      const e = Math.min(1, (t - start) / dur);
      const ease = 1 - Math.pow(1 - e, 3);
      setShown(from + (raw - from) * ease);
      if (e < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [raw]);

  const fmt = (n) => {
    const abs = Math.abs(n);
    if (currency === 'JPY' || currency === 'CNY') {
      return sym + Math.round(n).toLocaleString('en-US');
    }
    if (abs >= 1000) return sym + Math.round(n).toLocaleString('en-US');
    return sym + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const R = 52, C = 2 * Math.PI * R;
  const offset = C * (1 - shown);

  // finish line ticks around the ring
  const ringSize = (mini ? 110 : 138) * s;
  const numFs = (reached ? 26 : 30) * s;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 * s }}>
        <div style={{ fontSize: 13.5 * s, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'center', maxWidth: 200 * s, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal}</div>
        <div style={{ fontSize: 10.5 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{currency}</div>
      </div>

      <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="srg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={lighten(accent, 0.22)} />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="9" />
          <circle cx="64" cy="64" r={R} fill="none" stroke="url(#srg)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} />
        </svg>

        {/* finish line marker at top (the goal post) */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0 }}>
          <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" style={{ position: 'absolute', top: -1 * s, left: -8 * s }}>
            <g fill={reached ? accent : 'var(--w-mut)'}>
              <rect x="5" y="2" width="1.6" height="20" rx="0.6" />
              <path d="M7 3 h10 v3 h-5 v3 h5 v3 h-10 z" opacity="0.9" />
            </g>
          </svg>
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * s }}>
          <div style={{ fontSize: numFs, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: reached ? accent : 'var(--w-fg)' }}>{pct}%</div>
          {reached
            ? <div style={{ fontSize: 9.5 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>Reached</div>
            : <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(remaining)} to go</div>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 * s, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontSize: 17 * s, fontWeight: 700, color: 'var(--w-fg)', letterSpacing: '-0.01em' }}>{fmt(current)}</span>
        <span style={{ fontSize: 12 * s, color: 'var(--w-mut)', fontWeight: 500 }}>/ {fmt(target)}</span>
      </div>
    </div>
  );
}

/* ---------------- BUDGET RING ---------------- */
function BudgetRingW({ config: c, accent, s, fontStack, mini }) {
  const category = c.category || 'Budget';
  const budget = Math.max(0, Number(c.budget) || 0);
  const spent = Math.max(0, Number(c.spent) || 0);
  const currency = c.currency || 'USD';
  const warnAt = Math.min(100, Math.max(0, Number(c.warnAt) || 80));

  const fmtMoney = (n) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
    } catch (e) {
      return '$' + Math.round(n).toLocaleString();
    }
  };

  const rawPct = budget > 0 ? (spent / budget) * 100 : 0;
  const pct = Math.min(100, rawPct);
  const over = spent > budget;
  const remaining = budget - spent;

  // color states: accent -> amber -> red
  const amber = '#E0A93B';
  const red = '#E0563B';
  let ringColor = accent;
  let state = 'on';
  if (over || rawPct >= 100) { ringColor = red; state = 'over'; }
  else if (rawPct >= warnAt) { ringColor = amber; state = 'warn'; }

  const R = 52, CIRC = 2 * Math.PI * R;
  const dash = CIRC * (1 - pct / 100);

  const statusLabel = state === 'over' ? 'Over budget' : state === 'warn' ? 'Nearing limit' : 'On track';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 * s }}>
        <div style={{ fontSize: 12 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{category}</div>
      </div>

      <div style={{ position: 'relative', width: 132 * s, height: 132 * s }}>
        <svg width={132 * s} height={132 * s} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="9" />
          <circle cx="64" cy="64" r={R} fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dash} style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 * s }}>
          <div style={{ fontSize: 28 * s, fontWeight: 700, lineHeight: 1, color: ringColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{Math.round(rawPct)}%</div>
          <div style={{ fontSize: 10 * s, fontWeight: 600, color: 'var(--w-mut)', letterSpacing: '0.04em' }}>spent</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 * s }}>
        <div style={{ fontSize: 15 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
          <span style={{ color: 'var(--w-fg)' }}>{fmtMoney(spent)}</span>
          <span style={{ color: 'var(--w-mut)', fontWeight: 500 }}> / {fmtMoney(budget)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, fontSize: 11.5 * s, fontWeight: 600 }}>
          <span style={{ width: 7 * s, height: 7 * s, borderRadius: 99, background: ringColor, flexShrink: 0 }} />
          <span style={{ color: ringColor }}>{statusLabel}</span>
          <span style={{ color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {over ? fmtMoney(Math.abs(remaining)) + ' over' : fmtMoney(remaining) + ' left'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SUBSCRIPTIONS ---------------- */
function SubscriptionCounterW({ config: c, accent, s, fontStack, mini }) {
  const items = Array.isArray(c.items) && c.items.length ? c.items : [{ name: 'Netflix', amount: 15.49, cycle: 'monthly' }];
  const currency = c.currency || 'USD';
  const view = c.view === 'yearly' ? 'yearly' : 'monthly';
  const now = useNow(false, 60000);

  const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$', BRL: 'R$' };
  const sym = symbols[currency] || '$';

  const toMonthly = (it) => {
    const a = Number(it.amount) || 0;
    const cy = it.cycle || 'monthly';
    if (cy === 'yearly') return a / 12;
    if (cy === 'weekly') return a * 52 / 12;
    if (cy === 'quarterly') return a / 3;
    return a;
  };

  const monthlyTotal = useMemo(() => items.reduce((sum, it) => sum + toMonthly(it), 0), [items]);
  const total = view === 'yearly' ? monthlyTotal * 12 : monthlyTotal;

  const fmt = (n) => {
    const d = (n % 1 === 0 && n >= 1000) ? 0 : 2;
    try {
      return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
    } catch (e) {
      return n.toFixed(d);
    }
  };

  const nextCycleDay = (it) => {
    const cy = it.cycle || 'monthly';
    const anchor = Number(it.day) > 0 ? Math.min(31, Number(it.day)) : 1;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    if (cy === 'weekly') {
      const next = new Date(today);
      next.setDate(today.getDate() + 7);
      return next;
    }
    const mkOnMonth = (mOffset) => {
      const y = today.getFullYear();
      const m = today.getMonth() + mOffset;
      const lastDay = new Date(y, m + 1, 0).getDate();
      return new Date(y, m, Math.min(anchor, lastDay));
    };
    if (cy === 'yearly') {
      let cand = new Date(today.getFullYear(), (Number(it.month) || 1) - 1, Math.min(anchor, 28));
      if (cand < today) cand = new Date(today.getFullYear() + 1, (Number(it.month) || 1) - 1, Math.min(anchor, 28));
      return cand;
    }
    const step = cy === 'quarterly' ? 3 : 1;
    let off = 0;
    let cand = mkOnMonth(0);
    while (cand < today && off < 24) { off += step; cand = mkOnMonth(off); }
    return cand;
  };

  const upcoming = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let best = null;
    items.forEach((it) => {
      const d = nextCycleDay(it);
      const days = Math.round((d - today) / 864e5);
      if (best === null || days < best.days) best = { it, date: d, days };
    });
    return best;
  }, [items, now]);

  const relDay = (days) => {
    if (days <= 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days < 7) return 'in ' + days + ' days';
    if (days < 14) return 'in 1 week';
    if (days < 31) return 'in ' + Math.round(days / 7) + ' weeks';
    return 'in ' + Math.round(days / 30) + ' mo';
  };

  const sorted = useMemo(() => items.map((it, i) => ({ it, i, m: toMonthly(it) })).sort((a, b) => b.m - a.m), [items]);
  const maxM = sorted.length ? sorted[0].m : 1;
  const rowCount = mini ? 2 : 3;
  const shown = sorted.slice(0, rowCount);
  const moreCount = sorted.length - shown.length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: `${15 * s}px ${16 * s}px`, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s, minWidth: 0 }}>
          <div style={{ fontSize: 10 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>
            {view === 'yearly' ? 'Per year' : 'Per month'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 * s }}>
            <span style={{ fontSize: 16 * s, fontWeight: 600, color: 'var(--w-mut)', alignSelf: 'flex-start', marginTop: 3 * s }}>{sym}</span>
            <span style={{ fontSize: 33 * s, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>
          </div>
        </div>
        {upcoming ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 * s, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, padding: `${4 * s}px ${8 * s}px`, borderRadius: 99, background: lighten(accent, 0.88), border: `1px solid ${lighten(accent, 0.7)}` }}>
              <span style={{ width: 6 * s, height: 6 * s, borderRadius: 99, background: accent, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5 * s, fontWeight: 600, color: 'var(--w-fg)', whiteSpace: 'nowrap', maxWidth: 110 * s, overflow: 'hidden', textOverflow: 'ellipsis' }}>{upcoming.it.name || 'Next bill'}</span>
            </div>
            <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {sym}{fmt(Number(upcoming.it.amount) || 0)} · {relDay(upcoming.days)}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 * s, flexShrink: 0 }}>
            <div style={{ fontSize: 18 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: accent }}>{items.length}</div>
            <div style={{ fontSize: 9 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{items.length === 1 ? 'plan' : 'plans'}</div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--w-line)', flexShrink: 0 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 * s }}>
        {shown.map(({ it, i, m }) => {
          const dispAmt = view === 'yearly' ? m * 12 : m;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
              <span style={{ fontSize: 12 * s, fontWeight: 500, color: 'var(--w-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0, width: 88 * s }}>{it.name || 'Subscription'}</span>
              <div style={{ flex: 1, height: 4 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.max(4, (m / (maxM || 1)) * 100) + '%', borderRadius: 99, background: accent, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: 12 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)', flexShrink: 0, textAlign: 'right', width: 56 * s }}>{sym}{fmt(dispAmt)}</span>
            </div>
          );
        })}
        {!mini && moreCount > 0 ? (
          <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>
            +{moreCount} more {moreCount === 1 ? 'plan' : 'plans'}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- NET WORTH ---------------- */
function NetWorthW({ config: c, accent, s, fontStack, mini }) {
  const assets = Array.isArray(c.assets) ? c.assets : [];
  const liabilities = Array.isArray(c.liabilities) ? c.liabilities : [];
  const currency = c.currency || 'USD';
  const range = c.range || '12m';

  const sum = (arr) => arr.reduce((t, x) => {
    const v = typeof x === 'number' ? x : (x && typeof x === 'object' ? Number(x.amount || x.value || 0) : Number(x) || 0);
    return t + (isFinite(v) ? v : 0);
  }, 0);

  const totalAssets = sum(assets);
  const totalLiab = sum(liabilities);
  const net = totalAssets - totalLiab;

  const months = range === '3m' ? 3 : range === '6m' ? 6 : range === '24m' ? 24 : 12;

  const fmtMoney = (v, compact) => {
    const abs = Math.abs(v);
    try {
      if (compact && abs >= 10000) {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(v);
      }
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
    } catch (e) {
      const n = Math.round(abs).toLocaleString();
      return (v < 0 ? '-' : '') + '$' + n;
    }
  };

  // Deterministic synthetic history ending at current net worth, so the
  // trendline "feels" like it grew into the number. Seeded by net value.
  const series = useMemo(() => {
    const n = months;
    const out = [];
    let seed = Math.abs(Math.round(net)) % 99991 + 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    // build a gentle upward drift with noise, normalized to end at `net`
    let acc = 0;
    const raw = [];
    for (let i = 0; i < n; i++) {
      acc += 0.6 + (rnd() - 0.42) * 0.9;
      raw.push(acc);
    }
    const first = raw[0], last = raw[n - 1] || 1;
    const spanRaw = (last - first) || 1;
    // assume it grew ~ from 70% to 100% of net over the window (or shrank if net<0)
    const startFrac = 0.72;
    for (let i = 0; i < n; i++) {
      const t = (raw[i] - first) / spanRaw; // 0..1 normalized progress
      const frac = startFrac + (1 - startFrac) * t;
      out.push(net * frac);
    }
    out[n - 1] = net;
    return out;
  }, [net, months]);

  const prev = series.length > 1 ? series[0] : net;
  const delta = net - prev;
  const pctChange = prev !== 0 ? (delta / Math.abs(prev)) * 100 : 0;
  const up = delta >= 0;

  const positive = net >= 0;
  const trendColor = positive ? accent : '#D9534F';

  // ---- spark path geometry ----
  const W = 300, H = 84;
  const padY = 8;
  const lo = Math.min(...series), hi = Math.max(...series);
  const span = (hi - lo) || 1;
  const pts = series.map((v, i) => {
    const x = series.length === 1 ? W / 2 : (i / (series.length - 1)) * W;
    const y = padY + (1 - (v - lo) / span) * (H - padY * 2);
    return [x, y];
  });

  const smooth = (p) => {
    if (p.length < 2) return p.length ? `M ${p[0][0]} ${p[0][1]}` : '';
    let d = `M ${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const [x0, y0] = p[i];
      const [x1, y1] = p[i + 1];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
    }
    return d;
  };
  const linePath = smooth(pts);
  const areaPath = pts.length ? `${linePath} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z` : '';
  const last = pts[pts.length - 1] || [W / 2, H / 2];

  const gid = useMemo(() => 'nwg_' + Math.random().toString(36).slice(2, 8), []);

  // breakdown bar
  const totalAbs = totalAssets + totalLiab;
  const aPct = totalAbs > 0 ? (totalAssets / totalAbs) * 100 : 50;

  const rangeOpts = ['3m', '6m', '12m', '24m'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: `${18 * s}px ${20 * s}px`, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 * s }}>
          <div style={{ fontSize: 10.5 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>
            {c.title || 'Net Worth'}
          </div>
          <div style={{ fontSize: 33 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)' }}>
            {fmtMoney(net, true)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, padding: `${4 * s}px ${8 * s}px`, borderRadius: 99, background: up ? trendColor + '1F' : '#D9534F1F', flexShrink: 0 }}>
          <svg width={9 * s} height={9 * s} viewBox="0 0 10 10" style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
            <path d="M5 1 L9 7 L1 7 Z" fill={up ? trendColor : '#D9534F'} />
          </svg>
          <span style={{ fontSize: 11.5 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: up ? trendColor : '#D9534F' }}>
            {(up ? '+' : '') + pctChange.toFixed(1)}%
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <svg width="100%" height={H * s} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.26" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaPath ? <path d={areaPath} fill={`url(#${gid})`} /> : null}
          {linePath ? <path d={linePath} fill="none" stroke={trendColor} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        <span style={{ position: 'absolute', left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%`, width: 8 * s, height: 8 * s, marginLeft: -4 * s, marginTop: -4 * s, borderRadius: 99, background: trendColor, boxShadow: `0 0 0 ${3 * s}px ${trendColor}33` }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 * s }}>
        <div style={{ display: 'flex', height: 6 * s, borderRadius: 99, overflow: 'hidden', background: 'var(--w-line)' }}>
          <div style={{ width: `${aPct}%`, background: accent }} />
          <div style={{ flex: 1, background: lighten(accent, -0.28) }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontVariantNumeric: 'tabular-nums' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s }}>
            <span style={{ width: 7 * s, height: 7 * s, borderRadius: 2 * s, background: accent }} />
            <span style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500 }}>Assets</span>
            <span style={{ fontSize: 11.5 * s, color: 'var(--w-fg)', fontWeight: 600 }}>{fmtMoney(totalAssets, true)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s }}>
            <span style={{ width: 7 * s, height: 7 * s, borderRadius: 2 * s, background: lighten(accent, -0.28) }} />
            <span style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500 }}>Debts</span>
            <span style={{ fontSize: 11.5 * s, color: 'var(--w-fg)', fontWeight: 600 }}>{fmtMoney(totalLiab, true)}</span>
          </div>
        </div>
      </div>

      {!mini ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--w-line)', paddingTop: 9 * s }}>
          <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>
            {(up ? '+' : '') + fmtMoney(delta, true)} this {range === '3m' ? 'quarter' : range === '24m' ? '2 years' : 'period'}
          </span>
          <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{months}M</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- DEBT PAYOFF ---------------- */
function DebtPayoffW({ config: c, accent, s, fontStack, mini }) {
  const KEY = 'nc_debtPayoff_debts';
  const fallback = [
    { id: 'd1', name: 'Credit Card', balance: 4200, rate: 22.9, min: 90 },
    { id: 'd2', name: 'Car Loan', balance: 8500, rate: 6.4, min: 210 },
    { id: 'd3', name: 'Student Loan', balance: 14200, rate: 4.5, min: 160 },
  ];

  const [debts, setDebts] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(raw) && raw.length) return raw;
    } catch (e) {}
    return Array.isArray(c.debts) && c.debts.length ? c.debts : fallback;
  });

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(debts)); } catch (e) {} }, [debts]);

  const strategy = c.strategy === 'snowball' ? 'snowball' : 'avalanche';
  const extra = Math.max(0, Number(c.extra) || 0);
  const currency = c.currency || 'USD';

  const symFor = (cur) => ({ USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: '$', AUD: '$' }[cur] || '$');
  const sym = symFor(currency);

  const money = (n) => {
    const v = Math.round(n || 0);
    return sym + v.toLocaleString('en-US');
  };
  const moneyK = (n) => {
    if (n >= 1000) {
      const k = n / 1000;
      return sym + (k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')) + 'k';
    }
    return sym + Math.round(n);
  };

  // Ordered list per strategy. Snowball: smallest balance first. Avalanche: highest rate first.
  const ordered = useMemo(() => {
    const arr = debts.map((d, i) => ({
      id: d.id || ('d' + i),
      name: d.name || 'Debt',
      balance: Math.max(0, Number(d.balance) || 0),
      rate: Math.max(0, Number(d.rate) || 0),
      min: Math.max(0, Number(d.min) || 0),
    }));
    arr.sort((a, b) => strategy === 'snowball' ? a.balance - b.balance : b.rate - a.rate);
    return arr;
  }, [debts, strategy]);

  // Simulate month-by-month payoff with rollover (the "snowball/avalanche" engine).
  const sim = useMemo(() => {
    const list = ordered.map(d => ({ ...d, bal: d.balance, paidOff: null }));
    const totalMin = list.reduce((s2, d) => s2 + d.min, 0);
    let pool = totalMin + extra;
    let month = 0;
    let totalInterest = 0;
    const cap = 1200; // 100 years guard
    const active = () => list.filter(d => d.bal > 0.01);

    while (active().length && month < cap) {
      month++;
      let budget = pool;
      // accrue interest
      for (const d of list) {
        if (d.bal > 0.01) {
          const i = d.bal * (d.rate / 100) / 12;
          d.bal += i;
          totalInterest += i;
        }
      }
      // pay minimums first (in priority order so freed budget rolls forward)
      for (const d of list) {
        if (d.bal <= 0.01 || budget <= 0) continue;
        const pay = Math.min(d.min, d.bal, budget);
        d.bal -= pay; budget -= pay;
      }
      // throw remaining budget at the top-priority active debt
      let guard = 0;
      while (budget > 0.01 && active().length && guard < list.length + 1) {
        guard++;
        const tgt = active()[0];
        const pay = Math.min(budget, tgt.bal);
        tgt.bal -= pay; budget -= pay;
      }
      for (const d of list) {
        if (d.paidOff === null && d.bal <= 0.01) d.paidOff = month;
      }
    }

    const totalStart = list.reduce((s2, d) => s2 + d.balance, 0);
    const remaining = list.reduce((s2, d) => s2 + Math.max(0, d.bal), 0);
    return { list, months: month, totalInterest, totalStart, remaining, totalMin, capped: month >= cap };
  }, [ordered, extra]);

  const payoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + sim.months);
    return d;
  }, [sim.months]);

  const fmtMY = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const maxBal = Math.max(1, ...sim.list.map(d => d.balance));
  const yrs = Math.floor(sim.months / 12);
  const remM = sim.months % 12;
  const durStr = sim.months === 0 ? 'Paid off' : (yrs ? yrs + 'y' : '') + (yrs && remM ? ' ' : '') + (remM ? remM + 'mo' : (!yrs ? '0mo' : ''));

  // Condense: show only the top-priority debts as bars (2 normally, 1 in mini),
  // and surface how many more remain so the picture stays honest.
  const shown = mini ? 1 : 2;
  const bars = sim.list.slice(0, shown);
  const hiddenCount = Math.max(0, sim.list.length - bars.length);
  const hiddenSum = sim.list.slice(bars.length).reduce((a, d) => a + d.balance, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: 15 * s, fontFamily: fontStack, color: 'var(--w-fg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s, minWidth: 0 }}>
          <div style={{ fontSize: 9.5 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 700 }}>
            {c.title || 'Debt Free'}
          </div>
          <div style={{ fontSize: 23 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {sim.months === 0 ? 'Done' : fmtMY(payoffDate)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 * s }}>
          <span style={{ fontSize: 9 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 700 }}>
            {strategy === 'snowball' ? 'Snowball' : 'Avalanche'}
          </span>
          <span style={{ fontSize: 13 * s, fontWeight: 600, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{durStr}</span>
        </div>
      </div>

      {/* Bars (top-priority debts only) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 * s }}>
        {bars.map((d, i) => {
          const w = Math.max(0.04, d.balance / maxBal);
          const isNext = i === 0 && d.balance > 0.01;
          return (
            <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 * s }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 * s }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, minWidth: 0 }}>
                  <span style={{ width: 5 * s, height: 5 * s, borderRadius: 99, background: isNext ? accent : 'var(--w-line)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5 * s, fontWeight: isNext ? 700 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--w-fg)' }}>
                    {d.name}
                  </span>
                  <span style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {d.rate ? d.rate + '%' : ''}
                  </span>
                </div>
                <span style={{ fontSize: 12 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)', flexShrink: 0 }}>
                  {money(d.balance)}
                </span>
              </div>
              <div style={{ position: 'relative', height: 7 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0, width: (w * 100) + '%',
                  borderRadius: 99,
                  background: isNext ? accent : lighten(accent, 0.45),
                  opacity: isNext ? 1 : 0.85,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          );
        })}
        {hiddenCount > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 * s, fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 600 }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>+{hiddenCount} more debt{hiddenCount > 1 ? 's' : ''}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(hiddenSum)}</span>
          </div>
        ) : null}
      </div>

      {/* Footer summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 * s, paddingTop: 8 * s, borderTop: '1px solid var(--w-line)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 * s }}>
          <span style={{ fontSize: 8.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 700 }}>Total owed</span>
          <span style={{ fontSize: 13 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{moneyK(sim.totalStart)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 * s, alignItems: 'center' }}>
          <span style={{ fontSize: 8.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 700 }}>Per month</span>
          <span style={{ fontSize: 13 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{moneyK(sim.totalMin + extra)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 * s, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 8.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 700 }}>Interest</span>
          <span style={{ fontSize: 13 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: accent }}>{moneyK(sim.totalInterest)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- EXPENSE SPLITTER ---------------- */
function ExpenseSplitterW({ config: c, accent, s, fontStack, mini }) {
  const cur = c.currency || '$';
  const total = Math.max(0, Number(c.total) || 0);
  const tipPct = Math.max(0, Number(c.tip) || 0);
  const mode = c.mode === 'shares' ? 'shares' : 'even';
  const names = (Array.isArray(c.people) && c.people.length ? c.people : ['A', 'B', 'C'])
    .map(n => (typeof n === 'string' ? n : String(n)));
  const n = names.length;

  const grand = total * (1 + tipPct / 100);

  const palette = useMemo(() => {
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(i === 0 ? accent : lighten(accent, (i / Math.max(1, n)) * 0.55 - 0.1));
    }
    return out;
  }, [accent, n]);

  const fmt = (v) => {
    const r = Math.round(v * 100) / 100;
    const str = (Math.abs(r) < 0.005 ? 0 : r).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return cur + str;
  };

  // shares mode reads weights from c.shares (array aligned to people), default 1 each
  const weights = useMemo(() => {
    const w = Array.isArray(c.shares) ? c.shares : [];
    return names.map((_, i) => {
      const v = Number(w[i]);
      return mode === 'shares' && Number.isFinite(v) && v > 0 ? v : 1;
    });
  }, [c.shares, names, mode]);

  const splits = useMemo(() => {
    const wsum = weights.reduce((a, b) => a + b, 0) || 1;
    // distribute cents fairly so the sum matches grand exactly
    const cents = Math.round(grand * 100);
    let assigned = 0;
    const raw = weights.map(w => (cents * w) / wsum);
    const floors = raw.map(x => Math.floor(x));
    assigned = floors.reduce((a, b) => a + b, 0);
    let rem = cents - assigned;
    const order = raw
      .map((x, i) => ({ i, frac: x - Math.floor(x) }))
      .sort((a, b) => b.frac - a.frac);
    const res = floors.slice();
    for (let k = 0; k < rem; k++) res[order[k % order.length].i] += 1;
    return res.map(c2 => c2 / 100);
  }, [weights, grand]);

  const initials = (name) => {
    const t = name.trim();
    if (!t) return '?';
    const parts = t.split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : t.slice(0, 2)).toUpperCase();
  };

  const Avatar = ({ name, color, idx }) => (
    <div style={{
      width: 28 * s, height: 28 * s, borderRadius: 99, flexShrink: 0,
      background: color, color: onColor(color),
      display: 'grid', placeItems: 'center',
      fontSize: 11 * s, fontWeight: 700, letterSpacing: '-0.01em',
    }}>{initials(name)}</div>
  );

  return (
    <div style={{
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', gap: 14 * s, padding: 20 * s,
      fontFamily: fontStack, color: 'var(--w-fg)', boxSizing: 'border-box',
    }}>
      {/* header total */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s }}>
          <div style={{ fontSize: 10 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>
            {c.title || 'Bill split'}
          </div>
          <div style={{ fontSize: 30 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(grand)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 * s, paddingBottom: 2 * s }}>
          <div style={{
            fontSize: 11 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            padding: `${4 * s}px ${8 * s}px`, borderRadius: 7 * s,
            background: accent, color: onColor(accent),
          }}>{fmt(grand / (n || 1))}{n ? '' : ''}<span style={{ opacity: 0.7, fontWeight: 600 }}> /ea</span></div>
          {tipPct > 0 ? (
            <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(total)} + {tipPct}% tip
            </div>
          ) : (
            <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>
              {n} {n === 1 ? 'person' : 'people'}
            </div>
          )}
        </div>
      </div>

      {/* stacked proportion bar */}
      <div style={{ display: 'flex', width: '100%', height: 7 * s, borderRadius: 99, overflow: 'hidden', background: 'var(--w-line)' }}>
        {splits.map((v, i) => (
          <div key={i} title={names[i]} style={{
            flexGrow: Math.max(0.0001, v), flexBasis: 0,
            background: palette[i],
            borderRight: i < n - 1 ? '1.5px solid var(--w-bg, transparent)' : 'none',
          }} />
        ))}
      </div>

      {/* per-person rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 * s, maxHeight: 168 * s, overflowY: 'auto' }}>
        {names.map((name, i) => {
          const w = weights[i];
          const wsum = weights.reduce((a, b) => a + b, 0) || 1;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 * s }}>
              <Avatar name={name} color={palette[i]} idx={i} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 * s }}>
                <div style={{ fontSize: 13 * s, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name || 'Guest'}
                </div>
                {mode === 'shares' ? (
                  <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 500 }}>
                    {w}× share{w === 1 ? '' : 's'} · {Math.round((w / wsum) * 100)}%
                  </div>
                ) : null}
              </div>
              <div style={{ fontSize: 14 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                {fmt(splits[i])}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- HABIT GRID ---------------- */
function HabitGridW({ config: c, accent, s, fontStack, mini }) {
  const habits = (Array.isArray(c.habits) && c.habits.length ? c.habits : ['Read', 'Workout', 'Meditate']).slice(0, 5);
  const period = c.period === 'week' ? 'week' : 'month';
  const showStreak = c.showStreak !== false;

  const now = useNow(false, 60000);
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cols = period === 'week' ? 7 : daysInMonth;
  const monthKey = year + '-' + String(month + 1).padStart(2, '0');

  const storeKey = 'nc_habitGrid_data';
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storeKey)) || {}; } catch (e) { return {}; }
  });
  useEffect(() => { try { localStorage.setItem(storeKey, JSON.stringify(data)); } catch (e) {} }, [data]);

  const keyFor = (habit) => monthKey + '|' + habit;
  const getSet = (habit) => {
    const arr = data[keyFor(habit)];
    return arr && Array.isArray(arr) ? arr : [];
  };

  const dayList = useMemo(() => {
    if (period === 'week') {
      const start = today - now.getDay();
      const out = [];
      for (let i = 0; i < 7; i++) {
        const d = start + i;
        out.push(d >= 1 && d <= daysInMonth ? d : null);
      }
      return out;
    }
    const out = [];
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    return out;
  }, [period, today, daysInMonth, now]);

  const toggle = (habit, day) => {
    if (mini || day == null || day > today) return;
    setData(prev => {
      const k = keyFor(habit);
      const cur = Array.isArray(prev[k]) ? prev[k] : [];
      const has = cur.includes(day);
      const next = has ? cur.filter(x => x !== day) : [...cur, day];
      return { ...prev, [k]: next };
    });
  };

  const streakOf = (habit) => {
    const set = getSet(habit);
    if (!set.length) return 0;
    const s2 = new Set(set);
    let streak = 0;
    let d = today;
    if (!s2.has(d)) d -= 1;
    while (d >= 1 && s2.has(d)) { streak += 1; d -= 1; }
    return streak;
  };

  const fmtMonth = useMemo(() => now.toLocaleDateString(undefined, { month: 'long' }), [now]);

  const cellGap = period === 'week' ? 5 : Math.max(2, 3.2 - cols * 0.01) * s;
  const cellGapPx = period === 'week' ? 5 * s : 2.6 * s;
  const radius = period === 'week' ? 6 : 2.5;

  const HeaderRow = () => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 * s, marginBottom: 4 * s }}>
      <div style={{ fontSize: 11 * s, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)' }}>
        {period === 'week' ? 'This week' : fmtMonth}
      </div>
      <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>
        {today} / {daysInMonth}
      </div>
    </div>
  );

  const Row = ({ habit }) => {
    const set = new Set(getSet(habit));
    const streak = streakOf(habit);
    const doneCount = set.size;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s }}>
          <span style={{ fontSize: 13 * s, fontWeight: 600, color: 'var(--w-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{habit}</span>
          {showStreak && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 * s, flexShrink: 0 }}>
              <Flame on={streak > 0} />
              <span style={{ fontSize: 12 * s, fontWeight: 700, color: streak > 0 ? accent : 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>{streak}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: cellGapPx }}>
          {dayList.map((day, i) => {
            const empty = day == null;
            const isFuture = !empty && day > today;
            const filled = !empty && set.has(day);
            const isToday = day === today;
            return (
              <button
                key={i}
                onClick={() => toggle(habit, day)}
                aria-label={empty ? '' : habit + ' day ' + day}
                style={{
                  appearance: 'none', border: 'none', padding: 0, margin: 0, cursor: empty || isFuture || mini ? 'default' : 'pointer',
                  aspectRatio: '1 / 1', minWidth: 0, borderRadius: radius * s,
                  background: empty ? 'transparent' : filled ? accent : isFuture ? 'transparent' : 'var(--w-line)',
                  boxShadow: empty ? 'none' : filled ? 'none'
                    : isFuture ? ('inset 0 0 0 ' + (1 * s) + 'px var(--w-line)')
                    : isToday ? ('inset 0 0 0 ' + (1.5 * s) + 'px ' + accent) : 'none',
                  opacity: empty ? 0 : isFuture ? 0.5 : 1,
                  transition: 'background 0.15s ease, box-shadow 0.15s ease'
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const Flame = ({ on }) => (
    <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill={on ? accent : 'none'} stroke={on ? accent : 'var(--w-mut)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C8 8 7 9.5 7 12a5 5 0 1 0 10 0c0-4-3-7-5-10z" />
    </svg>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: 18 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <HeaderRow />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 * s }}>
        {habits.map((h, i) => <Row key={i} habit={h} />)}
      </div>
    </div>
  );
}

/* ---------------- CONSISTENCY HEATMAP ---------------- */
function HeatmapTrackerW({ config: c, accent, s, fontStack, mini }) {
  const label = c.label || 'Practice';
  const scheme = c.scheme || 'green';
  const levels = Math.max(2, Math.min(5, c.intensity || 4));
  const year = c.year || new Date().getFullYear();

  const baseHue = useMemo(() => {
    const map = { green: '#1F8A5B', blue: '#2563EB', purple: '#7C3AED', orange: '#EA580C', accent: accent };
    return map[scheme] || accent;
  }, [scheme, accent]);

  const storeKey = 'nc_heatmapTracker_' + year + '_' + scheme;
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storeKey)) || {}; } catch (e) { return {}; }
  });
  useEffect(() => {
    try { setData(JSON.parse(localStorage.getItem(storeKey)) || {}); } catch (e) { setData({}); }
  }, [storeKey]);
  useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify(data)); } catch (e) {}
  }, [data, storeKey]);

  const [hover, setHover] = useState(null);

  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const dayKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  const WEEKS = mini ? 14 : 18;

  const grid = useMemo(() => {
    const today = new Date();
    const anchor = today.getFullYear() === year ? new Date(today) : new Date(year, 11, 31);
    const endDow = anchor.getDay();
    const lastColStart = new Date(anchor);
    lastColStart.setDate(anchor.getDate() - endDow);
    const firstCol = new Date(lastColStart);
    firstCol.setDate(lastColStart.getDate() - (WEEKS - 1) * 7);
    const weeks = [];
    let cur = new Date(firstCol);
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const inRange = cur <= anchor;
        col.push({
          key: dayKey(cur),
          inYear: cur.getFullYear() === year && inRange,
          month: cur.getMonth(),
          date: cur.getDate(),
          firstOfMonth: cur.getDate() <= 7,
        });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(col);
    }
    return weeks;
  }, [year, WEEKS]);

  const monthLabels = useMemo(() => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const out = [];
    let lastMonth = -1;
    grid.forEach((week, wi) => {
      const cell = week.find((d) => d.inYear);
      if (cell && cell.month !== lastMonth && cell.firstOfMonth) {
        out.push({ col: wi, name: names[cell.month] });
        lastMonth = cell.month;
      } else if (cell) {
        lastMonth = cell.month;
      }
    });
    return out;
  }, [grid]);

  const todayKey = useMemo(() => dayKey(new Date()), []);

  const cellColor = (lvl) => {
    if (lvl <= 0) return 'var(--w-line)';
    const frac = lvl / levels;
    const amt = (1 - frac) * 0.72;
    return lighten(baseHue, amt);
  };

  const cycle = (k) => {
    if (mini) return;
    setData((p) => {
      const next = { ...p };
      const v = (next[k] || 0) + 1;
      if (v > levels) delete next[k]; else next[k] = v;
      return next;
    });
  };

  const stats = useMemo(() => {
    let active = 0;
    Object.keys(data).forEach((k) => {
      if (k.indexOf(year + '-') === 0 && data[k] > 0) active += 1;
    });
    let streak = 0;
    let d = new Date();
    if (d.getFullYear() === year) {
      while (true) {
        if (data[dayKey(d)] > 0) { streak += 1; d.setDate(d.getDate() - 1); }
        else break;
        if (d.getFullYear() < year) break;
      }
    }
    return { active, streak };
  }, [data, year]);

  const GAP = 3 * s;
  const CELL = 11 * s;
  const RAD = 2.5 * s;

  const legend = [];
  for (let i = 0; i <= levels; i++) legend.push(i);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 * s, padding: 15 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s, minWidth: 0 }}>
          <div style={{ fontSize: 14 * s, fontWeight: 600, color: 'var(--w-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
          <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500, flexShrink: 0 }}>{year}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 * s, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 * s }}>
            <div style={{ fontSize: 15 * s, fontWeight: 700, lineHeight: 1, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{stats.active}</div>
            <div style={{ fontSize: 9 * s, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>days</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 * s }}>
            <div style={{ fontSize: 15 * s, fontWeight: 700, lineHeight: 1, color: accent, fontVariantNumeric: 'tabular-nums' }}>{stats.streak}</div>
            <div style={{ fontSize: 9 * s, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>streak</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
        <div style={{ display: 'flex', gap: GAP }}>
          {grid.map((week, wi) => {
            const ml = monthLabels.find((m) => m.col === wi);
            return (
              <div key={'mh' + wi} style={{ width: CELL, fontSize: 9 * s, color: 'var(--w-mut)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'visible', height: 11 * s }}>
                {ml ? ml.name : ''}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: GAP }}>
          {grid.map((week, wi) => (
            <div key={'w' + wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((cell, di) => {
                if (!cell.inYear) return <div key={cell.key + di} style={{ width: CELL, height: CELL }} />;
                const lvl = data[cell.key] || 0;
                const isToday = cell.key === todayKey;
                return (
                  <div
                    key={cell.key}
                    onClick={() => cycle(cell.key)}
                    onMouseEnter={() => setHover({ key: cell.key, lvl })}
                    onMouseLeave={() => setHover(null)}
                    title={cell.key + (lvl ? ' · level ' + lvl : '')}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: RAD,
                      background: cellColor(lvl),
                      cursor: mini ? 'default' : 'pointer',
                      boxShadow: isToday ? '0 0 0 ' + (1.5 * s) + 'px ' + accent : 'none',
                      transition: 'background 0.15s ease, transform 0.1s ease',
                      transform: hover && hover.key === cell.key ? 'scale(1.18)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {!mini && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s }}>
          <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 500, minHeight: 12 * s, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hover ? (hover.lvl ? hover.key + ' · ' + hover.lvl + 'x' : hover.key) : 'Tap a day to log'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 * s, flexShrink: 0 }}>
            <span style={{ fontSize: 9 * s, color: 'var(--w-mut)', fontWeight: 600 }}>Less</span>
            {legend.map((l) => (
              <span key={'lg' + l} style={{ width: 9 * s, height: 9 * s, borderRadius: 2 * s, background: cellColor(l) }} />
            ))}
            <span style={{ fontSize: 9 * s, color: 'var(--w-mut)', fontWeight: 600 }}>More</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- WATER TRACKER ---------------- */
function WaterTrackerW({ config: c, accent, s, fontStack, mini }) {
  const goal = Math.max(1, Math.min(20, c.goalGlasses || 8));
  const glassMl = c.glassMl || 250;
  const iconName = c.icon || 'droplet';

  const todayKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const read = () => {
    try {
      const raw = JSON.parse(localStorage.getItem('nc_waterTracker_state'));
      if (raw && raw.day === todayKey()) return raw.count || 0;
    } catch (e) {}
    return 0;
  };

  const [count, setCount] = useState(read);
  const [day, setDay] = useState(todayKey);

  // tick to catch midnight rollover
  const now = useNow(true, 30000);
  useEffect(() => {
    const tk = todayKey();
    if (tk !== day) { setDay(tk); setCount(0); }
  }, [now]);

  useEffect(() => {
    try { localStorage.setItem('nc_waterTracker_state', JSON.stringify({ day, count })); } catch (e) {}
  }, [day, count]);

  const filled = Math.min(count, goal);
  const pct = Math.min(1, count / goal);
  const ml = count * glassMl;
  const goalMl = goal * glassMl;
  const done = count >= goal;

  const fmtVol = (v) => v >= 1000 ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + ' L' : v + ' ml';

  // layout: pick columns so glasses sit in a tidy grid
  const cols = goal <= 5 ? goal : goal <= 8 ? Math.ceil(goal / 2) : goal <= 12 ? Math.ceil(goal / 2) : Math.ceil(goal / 3);
  const gsz = goal > 10 ? 30 : goal > 6 ? 36 : 42;

  const add = () => setCount((p) => Math.min(goal + 4, p + 1));
  const removeOne = () => setCount((p) => Math.max(0, p - 1));

  const GlassIcon = ({ active }) => {
    const fillCol = accent;
    const emptyStroke = 'var(--w-line)';
    if (iconName === 'cup') {
      return (
        <svg width={gsz * s} height={gsz * s} viewBox="0 0 24 24" fill="none">
          <path d="M5 4h14l-1.4 15.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 4Z" stroke={active ? fillCol : emptyStroke} strokeWidth="1.6" strokeLinejoin="round" />
          {active ? <path d="M5.55 10h12.9l-.85 9.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5.55 10Z" fill={fillCol} opacity="0.92" /> : null}
        </svg>
      );
    }
    if (iconName === 'bottle') {
      return (
        <svg width={gsz * s} height={gsz * s} viewBox="0 0 24 24" fill="none">
          <path d="M10 2h4v2.2c0 .6.25 1.1.7 1.6L16 7c.65.7 1 1.6 1 2.6V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9.6c0-1 .35-1.9 1-2.6l1.3-1.2c.45-.5.7-1 .7-1.6V2Z" stroke={active ? fillCol : emptyStroke} strokeWidth="1.6" strokeLinejoin="round" />
          {active ? <path d="M7 11h10v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8Z" fill={fillCol} opacity="0.92" /> : null}
        </svg>
      );
    }
    // droplet (default)
    return (
      <svg width={gsz * s} height={gsz * s} viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5c3.4 4 6.5 7.4 6.5 11A6.5 6.5 0 0 1 5.5 13.5c0-3.6 3.1-7 6.5-11Z" fill={active ? fillCol : 'transparent'} stroke={active ? fillCol : emptyStroke} strokeWidth="1.6" strokeLinejoin="round" opacity={active ? 0.95 : 1} />
      </svg>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 * s }}>
        <div style={{ fontSize: 13 * s, fontWeight: 600, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 * s }}>
          <span style={{ display: 'inline-flex', color: accent }}>
            <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none"><path d="M12 2.5c3.4 4 6.5 7.4 6.5 11A6.5 6.5 0 0 1 5.5 13.5c0-3.6 3.1-7 6.5-11Z" fill={accent} stroke={accent} strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </span>
          Water
        </div>
        <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {filled}/{goal}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 * s, justifyItems: 'center', width: '100%' }}>
        {Array.from({ length: goal }).map((_, i) => {
          const active = i < count;
          return (
            <button
              key={i}
              onClick={() => setCount(active && i === count - 1 ? count - 1 : i + 1)}
              disabled={mini}
              title={active ? 'Glass ' + (i + 1) : 'Fill to ' + (i + 1)}
              style={{ background: 'transparent', border: 'none', padding: 2 * s, cursor: mini ? 'default' : 'pointer', display: 'flex', lineHeight: 0, transition: 'transform 0.15s ease', transform: active ? 'scale(1)' : 'scale(0.96)' }}
            >
              <GlassIcon active={active} />
            </button>
          );
        })}
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 * s }}>
        <div style={{ position: 'relative', height: 5 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, width: (pct * 100) + '%', background: accent, borderRadius: 99, transition: 'width 0.4s cubic-bezier(.4,0,.2,1)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: 'var(--w-fg)', fontWeight: 600 }}>{fmtVol(ml)}</span> / {fmtVol(goalMl)}
          </div>
          {done ? (
            <div style={{ fontSize: 11 * s, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent, display: 'flex', alignItems: 'center', gap: 4 * s }}>
              <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.2 4.5L19 7" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Goal
            </div>
          ) : (
            <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>{goal - count} to go</div>
          )}
        </div>
      </div>

      {!mini ? (
        <div style={{ display: 'flex', gap: 8 * s, width: '100%' }}>
          <button
            onClick={removeOne}
            style={{ width: 36 * s, height: 34 * s, borderRadius: 9 * s, background: 'transparent', border: '1.5px solid var(--w-line)', color: 'var(--w-fg)', fontSize: 18 * s, fontWeight: 600, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >−</button>
          <button
            onClick={add}
            style={{ flex: 1, height: 34 * s, borderRadius: 9 * s, background: accent, color: onColor(accent), border: 'none', fontSize: 13 * s, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 * s }}
          >
            <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={onColor(accent)} strokeWidth="2.2" strokeLinecap="round" /></svg>
            Add glass
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- MOOD TRACKER ---------------- */
function MoodTrackerW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(false, 60000);
  const DEFAULT_MOODS = [
    { emoji: '😀', label: 'Great', color: '#1F8A5B' },
    { emoji: '🙂', label: 'Good', color: '#7BB661' },
    { emoji: '😐', label: 'Okay', color: '#E0A800' },
    { emoji: '😕', label: 'Low', color: '#E07B39' },
    { emoji: '😢', label: 'Bad', color: '#C0455B' },
  ];
  const moods = (Array.isArray(c.moods) && c.moods.length) ? c.moods : DEFAULT_MOODS;
  const view = c.view || 'calendar';
  const title = c.title || 'Mood';

  const key = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nc_moodTracker_log')) || {}; } catch (e) { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem('nc_moodTracker_log', JSON.stringify(log)); } catch (e) {}
  }, [log]);

  const today = useMemo(() => new Date(), [now]);
  const todayKey = key(today);

  const moodByIndex = (i) => moods[i] || null;
  const setMood = (k, idx) => {
    setLog(p => {
      const next = { ...p };
      if (next[k] === idx) delete next[k]; else next[k] = idx;
      return next;
    });
  };

  const stats = useMemo(() => {
    const entries = Object.entries(log);
    const total = entries.length;
    const counts = moods.map(() => 0);
    entries.forEach(([, idx]) => { if (counts[idx] != null) counts[idx]++; });
    let streak = 0;
    const cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (log[key(cur)] == null) cur.setDate(cur.getDate() - 1);
    while (log[key(cur)] != null) { streak++; cur.setDate(cur.getDate() - 1); }
    return { total, counts, streak };
  }, [log, moods, today]);

  // Current week (Mon..Sun) containing today
  const week = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dow = (base.getDay() + 6) % 7; // Mon=0
    const mon = new Date(base);
    mon.setDate(base.getDate() - dow);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  const W = '100%';
  const todayMoodIdx = log[todayKey];
  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // ---- TODAY PICKER (shared) ----
  const Picker = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 5 * s, flexWrap: 'nowrap' }}>
      {moods.map((mo, i) => {
        const active = todayMoodIdx === i;
        return (
          <button key={i} onClick={() => setMood(todayKey, i)} title={mo.label}
            style={{
              width: 32 * s, height: 32 * s, borderRadius: 99, flex: '0 0 auto',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              fontSize: 17 * s, lineHeight: 1, padding: 0,
              background: active ? mo.color : 'transparent',
              border: '1.5px solid ' + (active ? mo.color : 'var(--w-line)'),
              boxShadow: active ? '0 2px 8px ' + mo.color + '55' : 'none',
              transition: 'all 0.18s ease', transform: active ? 'scale(1.06)' : 'none',
            }}>
            <span style={{ filter: active ? 'none' : 'grayscale(0.35)' }}>{mo.emoji}</span>
          </button>
        );
      })}
    </div>
  );

  // ---- CALENDAR VIEW (condensed to a single current week) ----
  if (view === 'calendar') {
    return (
      <div style={{ height: '100%', width: W, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 * s, padding: 15 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13.5 * s, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 * s, color: 'var(--w-mut)' }}>
            <span style={{ fontSize: 15 * s, fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{stats.streak}</span>
            <span style={{ fontSize: 9.5 * s, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>day streak</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 * s }}>
          {DOW.map((d, i) => (
            <div key={'h' + i} style={{ textAlign: 'center', fontSize: 9 * s, fontWeight: 700, color: 'var(--w-mut)', letterSpacing: '0.04em' }}>{d}</div>
          ))}
          {week.map((d) => {
            const k = key(d);
            const idx = log[k];
            const mo = idx != null ? moodByIndex(idx) : null;
            const isToday = k === todayKey;
            return (
              <button key={k} title={mo ? mo.label : k}
                onClick={() => { setLog(p => { const n = { ...p }; const cur = idx == null ? -1 : idx; const nxt = cur + 1 >= moods.length ? null : cur + 1; if (nxt == null) delete n[k]; else n[k] = nxt; return n; }); }}
                style={{
                  aspectRatio: '1 / 1', borderRadius: 7 * s, cursor: 'pointer', position: 'relative',
                  display: 'grid', placeItems: 'center', fontSize: 15 * s, lineHeight: 1, padding: 0,
                  background: mo ? mo.color : 'var(--w-line)',
                  opacity: mo ? 1 : 0.4,
                  border: isToday ? '1.5px solid ' + accent : '1.5px solid transparent',
                  boxShadow: isToday && !mo ? 'inset 0 0 0 1px ' + accent + '40' : 'none',
                  transition: 'background 0.18s ease, opacity 0.18s ease',
                }}>
                {mo ? <span>{mo.emoji}</span> : (isToday ? <span style={{ width: 5 * s, height: 5 * s, borderRadius: 99, background: accent }} /> : <span style={{ fontSize: 9 * s, fontWeight: 700, color: 'var(--w-mut)', opacity: 0.9 }}>{d.getDate()}</span>)}
              </button>
            );
          })}
        </div>

        {!mini && (
          <div style={{ paddingTop: 9 * s, borderTop: '1px solid var(--w-line)' }}>
            <Picker />
          </div>
        )}
      </div>
    );
  }

  // ---- STATS / SUMMARY VIEW (condensed) ----
  const maxCount = Math.max(1, ...stats.counts);
  return (
    <div style={{ height: '100%', width: W, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 * s, padding: 15 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13.5 * s, fontWeight: 700 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 * s, color: 'var(--w-mut)' }}>
          <span style={{ fontSize: 16 * s, fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{stats.streak}</span>
          <span style={{ fontSize: 9.5 * s, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>day streak</span>
        </div>
      </div>

      <Picker />

      {!mini && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 * s }}>
          {moods.map((mo, i) => {
            const ct = stats.counts[i];
            const pct = ct / maxCount;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
                <span style={{ fontSize: 13 * s, width: 16 * s, textAlign: 'center', flex: '0 0 auto', lineHeight: 1 }}>{mo.emoji}</span>
                <div style={{ flex: 1, height: 7 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
                  <div style={{ width: (pct * 100) + '%', height: '100%', borderRadius: 99, background: mo.color, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: 10.5 * s, fontWeight: 600, color: 'var(--w-mut)', width: 16 * s, textAlign: 'right', flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }}>{ct}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', textAlign: 'center', letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>{stats.total} {stats.total === 1 ? 'day' : 'days'} logged</div>
    </div>
  );
}

/* ---------------- SLEEP TRACKER ---------------- */
function SleepTrackerW({ config: c, accent, s, fontStack, mini }) {
  const goal = Math.max(1, c.goalHours || 8);
  const showDebt = c.showDebt !== false;
  const KEY = 'nc_sleepTracker_log';

  const defBed = c.bedtime || '23:00';
  const defWake = c.wakeTime || '07:00';

  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(log)); } catch (e) {} }, [log]);

  const [bed, setBed] = useState(defBed);
  const [wake, setWake] = useState(defWake);

  const toMin = (t) => { const p = (t || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); };
  const dur = (b, w) => { let d = toMin(w) - toMin(b); if (d <= 0) d += 1440; return d; };

  const keyFor = (offset) => {
    const dt = new Date(); dt.setDate(dt.getDate() - offset);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  };
  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const last7 = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const k = keyFor(i);
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const rec = log[k];
      arr.push({ k, dow: dt.getDay(), mins: rec ? dur(rec.b, rec.w) : null, today: i === 0 });
    }
    return arr;
  }, [log]);

  const goalMin = goal * 60;
  const todayKey = keyFor(0);
  const todayRec = log[todayKey];
  const todayMins = todayRec ? dur(todayRec.b, todayRec.w) : null;

  const debt = useMemo(() => {
    let acc = 0;
    last7.forEach(d => { if (d.mins != null) acc += (goalMin - d.mins); });
    return acc;
  }, [last7, goalMin]);

  const logged = last7.filter(d => d.mins != null);
  const avg = logged.length ? Math.round(logged.reduce((a, d) => a + d.mins, 0) / logged.length) : null;

  const fmtHM = (m) => {
    const sign = m < 0 ? '-' : '';
    const am = Math.abs(m);
    const h = Math.floor(am / 60), mm = am % 60;
    return sign + h + 'h ' + String(mm).padStart(2, '0') + 'm';
  };

  const previewMins = dur(bed, wake);
  const pct = Math.max(0, Math.min(1, (todayMins != null ? todayMins : previewMins) / goalMin));

  const save = () => {
    setLog(p => ({ ...p, [todayKey]: { b: bed, w: wake } }));
  };

  const R = 50, CIRC = 2 * Math.PI * R;
  const fg = 'var(--w-fg)', mut = 'var(--w-mut)', line = 'var(--w-line)';

  const centerMins = todayMins != null ? todayMins : previewMins;
  const centerH = Math.floor(centerMins / 60), centerM = centerMins % 60;

  const maxBar = Math.max(goalMin, ...last7.map(d => d.mins || 0)) || goalMin;
  const ringSize = 92 * s;
  const barArea = 26 * s;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 * s, padding: 14 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 * s, width: '100%' }}>
        <div style={{ position: 'relative', width: ringSize, height: ringSize, flexShrink: 0 }}>
          <svg width={ringSize} height={ringSize} viewBox="0 0 116 116" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="58" cy="58" r={R} fill="none" stroke={line} strokeWidth="9" />
            <circle cx="58" cy="58" r={R} fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 * s }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 * s, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: 22 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>{centerH}</span>
              <span style={{ fontSize: 11 * s, fontWeight: 600, color: mut }}>h</span>
              <span style={{ fontSize: 16 * s, fontWeight: 700, lineHeight: 1, marginLeft: 2 * s }}>{String(centerM).padStart(2, '0')}</span>
              <span style={{ fontSize: 10 * s, fontWeight: 600, color: mut }}>m</span>
            </div>
            <div style={{ fontSize: 8 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: mut, fontWeight: 600 }}>{todayMins != null ? Math.round(pct * 100) + '% goal' : 'preview'}</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 * s }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 * s, width: '100%', height: barArea }}>
            {last7.map((d) => {
              const h = d.mins != null ? Math.max(0.08, d.mins / maxBar) : 0;
              const hit = d.mins != null && d.mins >= goalMin;
              return (
                <div key={d.k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 * s, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', height: barArea, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: (barArea * h) + 'px', borderRadius: 2.5 * s, background: d.mins == null ? line : (hit ? accent : lighten(accent, 0.45)), opacity: d.mins == null ? 0.4 : 1, transition: 'height 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 8 * s, fontWeight: 600, color: d.today ? fg : mut }}>{dayLetters[d.dow]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12 * s, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 * s, minWidth: 0 }}>
              <span style={{ fontSize: 8 * s, letterSpacing: '0.07em', textTransform: 'uppercase', color: mut, fontWeight: 600 }}>7d avg</span>
              <span style={{ fontSize: 13 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{avg != null ? fmtHM(avg) : '—'}</span>
            </div>
            {showDebt ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 * s, minWidth: 0 }}>
                <span style={{ fontSize: 8 * s, letterSpacing: '0.07em', textTransform: 'uppercase', color: mut, fontWeight: 600 }}>Debt</span>
                <span style={{ fontSize: 13 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: debt > 30 ? accent : fg }}>{logged.length ? (debt > 0 ? fmtHM(debt) : 'none') : '—'}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 * s, minWidth: 0 }}>
                <span style={{ fontSize: 8 * s, letterSpacing: '0.07em', textTransform: 'uppercase', color: mut, fontWeight: 600 }}>Goal</span>
                <span style={{ fontSize: 13 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{goal}h</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!mini ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, width: '100%' }}>
          <input type="time" value={bed} onChange={e => setBed(e.target.value)} title="Bedtime" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', height: 28 * s, padding: `0 ${6 * s}px`, borderRadius: 7 * s, border: `1px solid ${line}`, background: 'transparent', color: fg, fontSize: 12 * s, fontWeight: 600, fontFamily: fontStack, fontVariantNumeric: 'tabular-nums' }} />
          <input type="time" value={wake} onChange={e => setWake(e.target.value)} title="Wake time" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', height: 28 * s, padding: `0 ${6 * s}px`, borderRadius: 7 * s, border: `1px solid ${line}`, background: 'transparent', color: fg, fontSize: 12 * s, fontWeight: 600, fontFamily: fontStack, fontVariantNumeric: 'tabular-nums' }} />
          <button onClick={save} style={{ height: 28 * s, padding: `0 ${14 * s}px`, borderRadius: 7 * s, border: 'none', background: accent, color: onColor(accent), fontSize: 12 * s, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{todayMins != null ? 'Update' : 'Log'}</button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- STEP GOAL ---------------- */
function StepGoalW({ config: c, accent, s, fontStack, mini }) {
  const goal = Math.max(1, c.goal || 10000);
  const current = Math.max(0, c.current == null ? 6400 : c.current);
  const stride = c.stride || 0.75;
  const unit = c.unit || 'km';

  const pct = Math.min(1, current / goal);
  const reached = current >= goal;

  const fmt = (n) => {
    try { return new Intl.NumberFormat().format(n); } catch (e) { return String(n); }
  };

  const distMeters = current * stride;
  const distance = unit === 'mi' ? distMeters / 1609.344 : distMeters / 1000;
  const calories = Math.round(current * 0.04);

  const R = 52, CIRC = 2 * Math.PI * R;

  const Stat = ({ value, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 * s }}>
      <div style={{ fontSize: 16 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 9.5 * s, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ position: 'relative', width: 132 * s, height: 132 * s }}>
        <svg width={132 * s} height={132 * s} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="9" />
          <circle cx="64" cy="64" r={R} fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * s }}>
          {reached ? (
            <Icon name="check" color={accent} size={28 * s} />
          ) : (
            <div style={{ fontSize: 28 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct * 100)}<span style={{ fontSize: 15 * s, fontWeight: 600, color: 'var(--w-mut)' }}>%</span></div>
          )}
          <div style={{ fontSize: 10 * s, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{reached ? 'Goal!' : 'Steps'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * s }}>
        <div style={{ fontSize: 17 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(current)}</div>
        <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>of {fmt(goal)} goal</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 18 * s }}>
        <Stat value={`${distance.toFixed(distance >= 10 ? 0 : 1)} ${unit}`} label="Distance" />
        <div style={{ width: 1, background: 'var(--w-line)' }} />
        <Stat value={fmt(calories)} label="Kcal" />
      </div>
    </div>
  );
}

/* ---------------- CALORIE RING ---------------- */
function CalorieRingW({ config: c, accent, s, fontStack, mini }) {
  const goal = Math.max(1, +c.goal || 2200);
  const consumed = Math.max(0, +c.consumed || 0);
  const carbs = Math.max(0, +c.carbs || 0);
  const protein = Math.max(0, +c.protein || 0);
  const fat = Math.max(0, +c.fat || 0);

  const remaining = goal - consumed;
  const pct = Math.min(1, consumed / goal);
  const over = consumed > goal;

  const R = 54, C = 2 * Math.PI * R;
  const ring = 102 * s;
  const trackColor = 'var(--w-line)';

  const carbColor = accent;
  const proteinColor = lighten(accent, 0.28);
  const fatColor = lighten(accent, 0.52);

  const macros = [
    { key: 'carbs', label: 'Carbs', grams: carbs, col: carbColor },
    { key: 'protein', label: 'Protein', grams: protein, col: proteinColor },
    { key: 'fat', label: 'Fat', grams: fat, col: fatColor },
  ];
  const macroTotal = Math.max(1, carbs + protein + fat);

  const Macro = ({ label, grams, col }) => {
    const frac = grams / macroTotal;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * s, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 * s }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 * s, minWidth: 0 }}>
            <span style={{ width: 6 * s, height: 6 * s, borderRadius: 99, background: col, flexShrink: 0 }} />
            <span style={{ fontSize: 9.5 * s, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </span>
          <span style={{ fontSize: 12 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', flexShrink: 0 }}>
            {grams}<span style={{ fontSize: 9 * s, fontWeight: 500, color: 'var(--w-mut)', marginLeft: 1 * s }}>g</span>
          </span>
        </div>
        <div style={{ height: 3 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: (frac * 100) + '%', background: col, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 * s, padding: 16 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', width: ring, height: ring, flexShrink: 0 }}>
        <svg width={ring} height={ring} viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="66" cy="66" r={R} fill="none" stroke={trackColor} strokeWidth={11} />
          <circle
            cx="66" cy="66" r={R} fill="none"
            stroke={over ? lighten(accent, 0.12) : accent}
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 * s }}>
          <div style={{ fontSize: 25 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', color: over ? accent : 'var(--w-fg)' }}>
            {Math.abs(remaining).toLocaleString()}
          </div>
          <div style={{ fontSize: 8.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>
            {over ? 'over' : 'left'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: mini ? 7 * s : 8 * s }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 * s, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15 * s, fontWeight: 700, color: 'var(--w-fg)', letterSpacing: '-0.02em' }}>{consumed.toLocaleString()}</span>
          <span style={{ fontSize: 11 * s, color: 'var(--w-mut)' }}>/ {goal.toLocaleString()} kcal</span>
        </div>
        <div style={{ width: '100%', height: 1, background: 'var(--w-line)' }} />
        {macros.slice(0, mini ? 2 : 3).map(m => <Macro key={m.key} label={m.label} grams={m.grams} col={m.col} />)}
      </div>
    </div>
  );
}

/* ---------------- FASTING TIMER ---------------- */
function FastingTimerW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 1000);

  const PROTOCOLS = { '12:12': 12, '14:10': 14, '16:8': 16, '18:6': 18, '20:4': 20, 'OMAD': 23 };
  const protocol = c.protocol && PROTOCOLS[c.protocol] != null ? c.protocol : '16:8';
  const fastHours = PROTOCOLS[protocol];
  const fastStart = c.fastStart || '20:00';
  const showWindow = c.showWindow !== false;

  const startOf = useMemo(() => {
    const [hh, mm] = String(fastStart).split(':').map(n => parseInt(n, 10) || 0);
    let d = new Date(now);
    d.setHours(hh, mm, 0, 0);
    if (d > now) d = new Date(d.getTime() - 864e5);
    return d;
  }, [fastStart, Math.floor(now.getTime() / 6e4)]);

  const fastMs = fastHours * 36e5;
  const end = new Date(startOf.getTime() + fastMs);
  const elapsed = now - startOf;
  const fasting = elapsed < fastMs;

  // progress for the active phase
  const eatMs = 24 * 36e5 - fastMs;
  const phaseMs = fasting ? fastMs : eatMs;
  const phaseElapsed = fasting ? elapsed : (elapsed - fastMs);
  const remainingMs = Math.max(0, phaseMs - phaseElapsed);
  const pct = Math.max(0, Math.min(1, phaseElapsed / phaseMs));

  const fmtClock = (date) => {
    let h = date.getHours();
    const m = date.getMinutes();
    const ap = h < 12 ? 'AM' : 'PM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + String(m).padStart(2, '0') + ' ' + ap;
  };
  const splitDur = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000));
    return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), sc: t % 60 };
  };
  const rem = splitDur(remainingMs);

  const ringColor = fasting ? accent : 'var(--w-mut)';
  const trackColor = 'var(--w-line)';

  const R = 54, CIRC = 2 * Math.PI * R;
  const dim = 140 * s;

  const tickAngles = [];
  for (let i = 0; i < 12; i++) tickAngles.push(i * 30);

  const StatChip = ({ label, value, dotFill, dotBorder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * s, minWidth: 64 * s }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s }}>
        <span style={{ width: 7 * s, height: 7 * s, borderRadius: 99, background: dotFill, border: dotBorder ? `1.5px solid ${dotBorder}` : 'none', boxSizing: 'border-box' }} />
        <span style={{ fontSize: 9.5 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: 13.5 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s }}>
        <span style={{ fontSize: 11 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 700 }}>{protocol}</span>
        <span style={{
          fontSize: 9.5 * s, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: `${2.5 * s}px ${7 * s}px`, borderRadius: 99,
          background: fasting ? accent : 'var(--w-line)',
          color: fasting ? onColor(accent) : 'var(--w-mut)'
        }}>{fasting ? 'Fasting' : 'Eating'}</span>
      </div>

      <div style={{ position: 'relative', width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={R} fill="none" stroke={trackColor} strokeWidth="7" />
          <circle cx="64" cy="64" r={R} fill="none" stroke={ringColor} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease' }} />
        </svg>
        <svg width={dim} height={dim} viewBox="0 0 128 128" style={{ position: 'absolute', inset: 0 }}>
          {tickAngles.map((a, i) => {
            const rad = (a - 90) * Math.PI / 180;
            const r1 = R - 13, r2 = R - 9;
            return <line key={i}
              x1={64 + r1 * Math.cos(rad)} y1={64 + r1 * Math.sin(rad)}
              x2={64 + r2 * Math.cos(rad)} y2={64 + r2 * Math.sin(rad)}
              stroke="var(--w-line)" strokeWidth="1.5" strokeLinecap="round" opacity={i % 3 === 0 ? 0.9 : 0.45} />;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * s }}>
          <div style={{ fontSize: 9 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{fasting ? 'until meal' : 'until fast'}</div>
          <div style={{ fontSize: 26 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)' }}>
            {String(rem.h).padStart(2, '0')}<span style={{ color: 'var(--w-mut)', fontWeight: 600 }}>:</span>{String(rem.m).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: fasting ? accent : 'var(--w-mut)' }}>
            {Math.round(pct * 100)}%
          </div>
        </div>
      </div>

      {showWindow && !mini ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 * s }}>
          <StatChip label="Started" value={fmtClock(startOf)} dotFill={accent} />
          <span style={{ width: 1, height: 26 * s, background: 'var(--w-line)' }} />
          <StatChip label="Goal" value={fmtClock(end)} dotFill="transparent" dotBorder="var(--w-mut)" />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- BMI CALCULATOR ---------------- */
function BmiCalculatorW({ config: c, accent, s, fontStack, mini }) {
  const units = c.units === 'imperial' ? 'imperial' : 'metric';
  const showScale = c.showScale !== false;

  // config holds canonical metric values: height in cm, weight in kg
  const baseH = typeof c.height === 'number' ? c.height : 175;
  const baseW = typeof c.weight === 'number' ? c.weight : 70;

  const [hCm, setHCm] = useState(baseH);
  const [wKg, setWKg] = useState(baseW);
  useEffect(() => { setHCm(baseH); }, [baseH]);
  useEffect(() => { setWKg(baseW); }, [baseW]);

  const bmi = useMemo(() => {
    const m = hCm / 100;
    if (m <= 0) return 0;
    return wKg / (m * m);
  }, [hCm, wKg]);

  // category bands. domain shown on scale: 14 .. 36
  const LO = 14, HI = 36;
  const bands = [
    { max: 18.5, label: 'Underweight', short: 'Under', hue: '#5B8DEF' },
    { max: 25, label: 'Normal', short: 'Normal', hue: '#3CB371' },
    { max: 30, label: 'Overweight', short: 'Over', hue: '#E0A23B' },
    { max: 99, label: 'Obese', short: 'Obese', hue: '#DE6A5A' },
  ];
  const catIdx = bmi < 18.5 ? 0 : bmi < 25 ? 1 : bmi < 30 ? 2 : 3;
  const cat = bands[catIdx];
  const catColor = cat.hue;

  const messages = ['A little under — be kind to yourself.', 'Right in a healthy range. Nice.', 'A touch above — small steps count.', 'Worth a gentle check-in with care.'];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pos = clamp((bmi - LO) / (HI - LO), 0, 1) * 100;

  // segment widths for the scale (proportional to band ranges within domain)
  const segs = [
    { color: bands[0].hue, w: (18.5 - LO) },
    { color: bands[1].hue, w: (25 - 18.5) },
    { color: bands[2].hue, w: (30 - 25) },
    { color: bands[3].hue, w: (HI - 30) },
  ];
  const totalW = HI - LO;

  const round1 = (n) => Math.round(n * 10) / 10;

  // imperial display helpers
  const toFtIn = (cm) => {
    const totalIn = cm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inch = Math.round(totalIn - ft * 12);
    if (inch === 12) return { ft: ft + 1, inch: 0 };
    return { ft, inch };
  };
  const toLb = (kg) => Math.round(kg / 0.453592);

  const fi = toFtIn(hCm);
  const heightStr = units === 'imperial' ? (fi.ft + "'" + fi.inch + '"') : (Math.round(hCm) + ' cm');
  const weightStr = units === 'imperial' ? (toLb(wKg) + ' lb') : (round1(wKg) + ' kg');

  const ringBg = 'var(--w-line)';
  const interactive = !mini;

  const Stat = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 * s }}>
      <div style={{ fontSize: 9.5 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 14 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );

  // slider rows (metric edit in canonical units for simplicity, with display in chosen units)
  const Slider = ({ value, min, max, step, onChange, display }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s, width: '100%' }}>
      <span style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: 52 * s, textAlign: 'right', flexShrink: 0 }}>{display}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ flex: 1, accentColor: accent, height: 4 * s, cursor: 'pointer' }} />
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 20 * s, fontFamily: fontStack, color: 'var(--w-fg)' }}>

      {/* number + category */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * s }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s }}>
          <div style={{ fontSize: 46 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{round1(bmi).toFixed(1)}</div>
          <div style={{ fontSize: 12 * s, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)' }}>BMI</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 * s, padding: `${4 * s}px ${10 * s}px`, borderRadius: 99, background: catColor, color: onColor(catColor) }}>
          <span style={{ width: 6 * s, height: 6 * s, borderRadius: 99, background: onColor(catColor), opacity: 0.85 }} />
          <span style={{ fontSize: 11.5 * s, fontWeight: 600, letterSpacing: '0.02em' }}>{cat.label}</span>
        </div>
      </div>

      {/* scale */}
      {showScale ? (
        <div style={{ width: '100%', maxWidth: 280 * s, display: 'flex', flexDirection: 'column', gap: 7 * s }}>
          <div style={{ position: 'relative', height: 12 * s }}>
            <div style={{ display: 'flex', height: '100%', borderRadius: 99, overflow: 'hidden' }}>
              {segs.map((sg, i) => (
                <div key={i} style={{ width: (sg.w / totalW * 100) + '%', background: sg.color, opacity: catIdx === i ? 1 : 0.32, transition: 'opacity 0.3s ease' }} />
              ))}
            </div>
            {/* marker */}
            <div style={{ position: 'absolute', top: '50%', left: pos + '%', transform: 'translate(-50%,-50%)', transition: 'left 0.4s cubic-bezier(.3,.7,.3,1)' }}>
              <div style={{ width: 18 * s, height: 18 * s, borderRadius: 99, background: 'var(--w-fg)', border: `${3 * s}px solid var(--w-line)`, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {bands.map((b, i) => (
              <span key={i} style={{ fontSize: 9 * s, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: catIdx === i ? b.hue : 'var(--w-mut)', opacity: catIdx === i ? 1 : 0.7, transition: 'color 0.3s ease' }}>{b.short}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* stats / inputs */}
      {interactive ? (
        <div style={{ width: '100%', maxWidth: 280 * s, display: 'flex', flexDirection: 'column', gap: 9 * s }}>
          <Slider value={hCm} min={120} max={220} step={1} onChange={setHCm} display={heightStr} />
          <Slider value={wKg} min={30} max={180} step={0.5} onChange={setWKg} display={weightStr} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 22 * s }}>
          <Stat label="Height" value={heightStr} />
          <Stat label="Weight" value={weightStr} />
        </div>
      )}

      {!mini ? (
        <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', textAlign: 'center', lineHeight: 1.4, maxWidth: 250 * s }}>{messages[catIdx]}</div>
      ) : null}
    </div>
  );
}

/* ---------------- BREATHING CIRCLE ---------------- */
function BreathingCircleW({ config: c, accent, s, fontStack, mini }) {
  const pattern = c.pattern || 'box';
  const showLabel = c.showLabel !== false;

  const phases = useMemo(() => {
    const n = v => Math.max(0, Number(v) || 0);
    let inh, h1, exh, h2;
    if (pattern === '478') { inh = 4; h1 = 7; exh = 8; h2 = 0; }
    else if (pattern === 'custom') {
      inh = n(c.inhale != null ? c.inhale : 4);
      h1 = n(c.hold != null ? c.hold : 4);
      exh = n(c.exhale != null ? c.exhale : 4);
      h2 = n(c.hold2 != null ? c.hold2 : 0);
    } else { inh = n(c.inhale != null ? c.inhale : 4); h1 = n(c.hold != null ? c.hold : 4); exh = n(c.exhale != null ? c.exhale : 4); h2 = 4; }
    const seq = [];
    if (inh > 0) seq.push({ key: 'inhale', label: 'Breathe in', dur: inh, from: 0, to: 1 });
    if (h1 > 0) seq.push({ key: 'hold', label: 'Hold', dur: h1, from: 1, to: 1 });
    if (exh > 0) seq.push({ key: 'exhale', label: 'Breathe out', dur: exh, from: 1, to: 0 });
    if (h2 > 0) seq.push({ key: 'hold2', label: 'Hold', dur: h2, from: 0, to: 0 });
    if (!seq.length) seq.push({ key: 'inhale', label: 'Breathe in', dur: 4, from: 0, to: 1 });
    const total = seq.reduce((a, p) => a + p.dur, 0);
    return { seq, total };
  }, [pattern, c.inhale, c.hold, c.exhale, c.hold2]);

  const [running, setRunning] = useState(!mini);
  const [started, setStarted] = useState(0);
  const [pausedAt, setPausedAt] = useState(0);
  const now = useNow(running, 60);

  const t = useMemo(() => {
    if (!running) return pausedAt;
    return pausedAt + (now.getTime() - started) / 1000;
  }, [running, now, started, pausedAt]);

  const cur = useMemo(() => {
    const { seq, total } = phases;
    let x = t % total;
    for (let i = 0; i < seq.length; i++) {
      const p = seq[i];
      if (x < p.dur || i === seq.length - 1) {
        const localT = Math.min(p.dur, Math.max(0, x));
        const prog = p.dur > 0 ? localT / p.dur : 1;
        let scale = p.from;
        if (p.from !== p.to) {
          const e = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
          scale = p.from + (p.to - p.from) * e;
        }
        const remain = Math.ceil(p.dur - localT - 1e-6);
        return { phase: p, scale, remain: Math.max(0, remain) };
      }
      x -= p.dur;
    }
    return { phase: seq[0], scale: 0, remain: 0 };
  }, [t, phases]);

  const start = () => { setStarted(Date.now()); setRunning(true); };
  const pause = () => { setPausedAt(t); setRunning(false); };
  const reset = () => { setPausedAt(0); setStarted(Date.now()); setRunning(false); };

  const box = 116 * s;
  const minScale = 0.42;
  const sc = minScale + (1 - minScale) * cur.scale;
  const fg = accent;

  const R = 58, CC = 2 * Math.PI * R;
  const ringOffset = CC * (1 - cur.scale);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9 * s, padding: 14 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', width: box, height: box, display: 'grid', placeItems: 'center' }}>
        <div style={{
          position: 'absolute', width: box, height: box, borderRadius: '50%',
          background: `radial-gradient(circle, ${lighten(fg, 0.32)}33 0%, transparent 68%)`,
          transform: `scale(${0.7 + 0.5 * cur.scale})`, transition: 'transform 0.1s linear', pointerEvents: 'none'
        }} />
        <svg width={box} height={box} viewBox="0 0 128 128" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="2.5" />
          <circle cx="64" cy="64" r={R} fill="none" stroke={fg} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={CC} strokeDashoffset={ringOffset} opacity="0.9"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
        </svg>
        <div style={{
          width: 72 * s, height: 72 * s, borderRadius: '50%',
          background: `radial-gradient(circle at 38% 32%, ${lighten(fg, 0.34)}, ${fg})`,
          transform: `scale(${sc})`, transition: 'transform 0.1s linear',
          boxShadow: `0 ${8 * s}px ${22 * s}px ${fg}3d`,
          display: 'grid', placeItems: 'center'
        }}>
          <span style={{ fontSize: 22 * s, fontWeight: 700, color: onColor(fg), fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: cur.remain > 0 ? 1 : 0.85 }}>
            {cur.remain || ''}
          </span>
        </div>
      </div>

      {showLabel && (
        <div style={{ fontSize: 13 * s, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--w-fg)', lineHeight: 1 }}>
          {running ? cur.phase.label : (pausedAt > 0 ? 'Paused' : 'Ready')}
        </div>
      )}

      {!mini && (
        <div style={{ display: 'flex', gap: 8 * s, alignItems: 'center' }}>
          <button onClick={running ? pause : start} style={{
            height: 30 * s, padding: `0 ${16 * s}px`, borderRadius: 99, border: 'none', cursor: 'pointer',
            background: fg, color: onColor(fg), fontSize: 12 * s, fontWeight: 600, fontFamily: fontStack
          }}>{running ? 'Pause' : (pausedAt > 0 ? 'Resume' : 'Start')}</button>
          <button onClick={reset} title="Reset" style={{
            height: 30 * s, width: 30 * s, display: 'grid', placeItems: 'center', borderRadius: 99, cursor: 'pointer',
            background: 'transparent', border: '1.5px solid var(--w-line)', color: 'var(--w-mut)'
          }}>
            <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- WORKOUT STREAK ---------------- */
function WorkoutStreakW({ config: c, accent, s, fontStack, mini }) {
  const restAllowed = typeof c.restDaysAllowed === 'number' ? c.restDaysAllowed : 1;
  const showLongest = c.showLongest !== false;
  const weekStart = c.weekStart || 'Mon';

  const KEY = 'nc_workoutStreak_log';
  const dayKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  };
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayK = dayKey(today);

  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(log)); } catch (e) {}
  }, [log]);

  const doneToday = !!log[todayK];

  const toggleToday = () => {
    setLog((prev) => {
      const next = { ...prev };
      if (next[todayK]) delete next[todayK]; else next[todayK] = 1;
      return next;
    });
  };

  // Compute current streak: walk backwards from today. A streak continues
  // across up to `restAllowed` consecutive missed days (rest days).
  const stats = useMemo(() => {
    const has = (d) => !!log[dayKey(d)];
    const stepBack = (d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; };

    // current streak (counts only training days, rest gap tolerated)
    let cur = 0;
    let probe = new Date(today);
    // If today not done, current streak anchors at most recent trained day,
    // but only if within rest allowance.
    if (!has(today)) {
      let gap = 0;
      while (gap <= restAllowed && !has(probe)) {
        probe = stepBack(probe); gap++;
      }
      if (!has(probe)) { cur = 0; }
    }
    if (has(probe)) {
      cur = 0;
      let cursor = new Date(probe);
      while (true) {
        if (has(cursor)) {
          cur++;
          cursor = stepBack(cursor);
        } else {
          // count consecutive rest days
          let gap = 0;
          let look = new Date(cursor);
          while (gap < restAllowed && !has(look)) {
            look = stepBack(look); gap++;
          }
          if (has(look)) { cursor = look; } else { break; }
        }
      }
    }

    // total trained days + longest streak across whole log
    const keys = Object.keys(log).filter((k) => log[k]).sort();
    const total = keys.length;
    let longest = 0;
    if (keys.length) {
      const toDate = (k) => { const p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
      let run = 1, best = 1;
      for (let i = 1; i < keys.length; i++) {
        const diff = Math.round((toDate(keys[i]) - toDate(keys[i - 1])) / 864e5);
        if (diff - 1 <= restAllowed) run++; else run = 1;
        if (run > best) best = run;
      }
      longest = best;
    }
    return { cur, total, longest: Math.max(longest, cur) };
  }, [log, today, restAllowed, todayK]);

  // Week strip: 7 days ending today, ordered by weekStart preference
  const week = useMemo(() => {
    const names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      out.push({ d, k: dayKey(d), trained: !!log[dayKey(d)], isToday: dayKey(d) === todayK, label: names[d.getDay()] });
    }
    return out;
  }, [log, today, todayK, weekStart]);

  const Flame = ({ size, lit }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2c.6 3.2-1.8 4.6-3 6.2-1.3 1.7-2.2 3.4-2.2 5.6A5.2 5.2 0 0 0 12 19a5.2 5.2 0 0 0 5.2-5.2c0-2.6-1.4-4.3-2.8-6-.5 1-1.2 1.6-2 1.6-1.4 0-1.7-1.6-1.6-3.2.1-1.7-.9-3.4-3-4z"
        fill={lit ? accent : 'none'}
        stroke={lit ? accent : 'var(--w-line)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 * s }}>
        <Flame size={36 * s} lit={stats.cur > 0} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <div style={{ fontSize: 44 * s, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: stats.cur > 0 ? 'var(--w-fg)' : 'var(--w-mut)' }}>{stats.cur}</div>
        </div>
      </div>
      <div style={{ fontSize: 11 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>
        {stats.cur === 1 ? 'day streak' : 'day streak'}
      </div>

      <div style={{ display: 'flex', gap: 6 * s }}>
        {week.map((w, i) => (
          <div key={w.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 * s }}>
            <span
              style={{
                width: 18 * s,
                height: 18 * s,
                borderRadius: 99,
                background: w.trained ? accent : 'transparent',
                border: '1.5px solid ' + (w.trained ? accent : 'var(--w-line)'),
                boxShadow: w.isToday ? '0 0 0 ' + (2 * s) + 'px var(--w-line)' : 'none',
                transition: 'background 0.2s ease'
              }}
            />
            <span style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{w.label}</span>
          </div>
        ))}
      </div>

      {showLongest && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 * s, fontSize: 11.5 * s, color: 'var(--w-mut)' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>Best <b style={{ color: 'var(--w-fg)', fontWeight: 600 }}>{stats.longest}</b></span>
          <span style={{ width: 1, height: 11 * s, background: 'var(--w-line)' }} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>Total <b style={{ color: 'var(--w-fg)', fontWeight: 600 }}>{stats.total}</b></span>
        </div>
      )}

      {!mini && (
        <button
          onClick={toggleToday}
          style={{
            marginTop: 2 * s,
            height: 34 * s,
            padding: '0 ' + (18 * s) + 'px',
            borderRadius: 8 * s,
            border: doneToday ? '1.5px solid var(--w-line)' : 'none',
            background: doneToday ? 'transparent' : accent,
            color: doneToday ? 'var(--w-fg)' : onColor(accent),
            fontSize: 13 * s,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: fontStack
          }}
        >
          {doneToday ? 'Trained today ✓' : 'Log workout'}
        </button>
      )}
    </div>
  );
}

/* ---------------- GREETING BANNER ---------------- */
function GreetingBannerW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 30000);
  const name = (c.name || '').trim();
  const style = c.style || 'timeOfDay';
  const tagline = c.tagline || '';
  const showDate = c.showDate !== false;
  const hour = now.getHours();

  const greeting = useMemo(() => {
    if (style === 'fixed') return c.fixedGreeting || 'Hello';
    if (style === 'wave') {
      if (hour < 12) return 'Rise and shine';
      if (hour < 18) return 'Hey there';
      return 'Winding down';
    }
    if (hour < 5) return 'Still up';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }, [style, hour, c.fixedGreeting]);

  const phase = hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'day' : hour < 21 ? 'evening' : 'night';

  const dateStr = useMemo(() => {
    try {
      return now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }, [now.getDate(), now.getMonth()]);

  const Glyph = () => {
    const sz = 26 * s;
    const stroke = accent;
    if (phase === 'morning') {
      const rays = [0, 45, 90, 135, 180, 225, 270, 315];
      return (
        <svg width={sz} height={sz} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="6.5" fill={accent} />
          {rays.map((a, i) => {
            const r = a * Math.PI / 180;
            const x1 = 16 + Math.cos(r) * 11, y1 = 16 + Math.sin(r) * 11;
            const x2 = 16 + Math.cos(r) * 14, y2 = 16 + Math.sin(r) * 14;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
          })}
        </svg>
      );
    }
    if (phase === 'day') {
      return (
        <svg width={sz} height={sz} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="8.5" fill={accent} />
        </svg>
      );
    }
    if (phase === 'evening') {
      return (
        <svg width={sz} height={sz} viewBox="0 0 32 32" fill="none">
          <path d="M5 21 a11 11 0 0 1 22 0" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
          <line x1="16" y1="5" x2="16" y2="9" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        </svg>
      );
    }
    return (
      <svg width={sz} height={sz} viewBox="0 0 32 32" fill="none">
        <path d="M23.5 19.5 A9 9 0 1 1 14 6 A7 7 0 0 0 23.5 19.5 Z" fill={accent} />
        <circle cx="24" cy="9" r="1.1" fill={accent} opacity="0.6" />
        <circle cx="20" cy="6" r="0.8" fill={accent} opacity="0.5" />
      </svg>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 * s, padding: 24 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 * s }}>
        <div style={{ flexShrink: 0, display: 'grid', placeItems: 'center' }}><Glyph /></div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 26 * s, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.025em', color: 'var(--w-fg)' }}>
            {greeting}{name ? <span style={{ color: accent }}>, {name}</span> : ''}
          </div>
        </div>
      </div>
      {tagline ? (
        <div style={{ fontSize: 14 * s, lineHeight: 1.35, color: 'var(--w-mut)', fontWeight: 450 }}>{tagline}</div>
      ) : null}
      {showDate ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s, marginTop: 2 * s }}>
          <span style={{ width: 18 * s, height: 1.5, background: 'var(--w-line)', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 12 * s, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{dateStr}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- DAILY AFFIRMATION ---------------- */
function AffirmationW({ config: c, accent, s, fontStack, mini }) {
  const category = c.category || 'self-care';
  const rotation = c.rotation || 'daily';
  const showAuthor = !!c.showAuthor;

  const LIB = useMemo(() => ({
    'self-care': [
      { t: 'I am allowed to rest without earning it.', a: 'Rest' },
      { t: 'My worth is not measured by my output.', a: 'Worth' },
      { t: 'I can begin again, as many times as I need.', a: 'Beginnings' },
      { t: 'Tending to myself is not selfish, it is necessary.', a: 'Care' },
      { t: 'I release what I cannot carry today.', a: 'Release' },
      { t: 'Softness toward myself is a kind of strength.', a: 'Softness' },
      { t: 'I am doing enough, and I am enough.', a: 'Enough' },
      { t: 'My feelings are valid, even the quiet ones.', a: 'Feeling' },
    ],
    'confidence': [
      { t: 'I trust myself to handle what this day brings.', a: 'Trust' },
      { t: 'I belong in the rooms I walk into.', a: 'Belonging' },
      { t: 'My voice is worth hearing.', a: 'Voice' },
      { t: 'I move forward, even when I am unsure.', a: 'Courage' },
      { t: 'I have survived every hard day so far.', a: 'Resilience' },
      { t: 'I am capable of more than my doubts suggest.', a: 'Capacity' },
      { t: 'I choose progress over perfection.', a: 'Progress' },
      { t: 'I stand steady in who I am.', a: 'Steady' },
    ],
    'focus': [
      { t: 'One thing at a time, and this is the thing.', a: 'Focus' },
      { t: 'I give my full attention to what is in front of me.', a: 'Presence' },
      { t: 'Small steps, taken daily, become distance.', a: 'Momentum' },
      { t: 'I protect my energy for what matters most.', a: 'Energy' },
      { t: 'Clarity comes when I slow down.', a: 'Clarity' },
      { t: 'I finish what I start, gently and well.', a: 'Follow-through' },
      { t: 'Distraction passes; my purpose remains.', a: 'Purpose' },
      { t: 'Today I choose depth over noise.', a: 'Depth' },
    ],
    'gratitude': [
      { t: 'There is something good in this ordinary day.', a: 'Notice' },
      { t: 'I have enough, right now, in this moment.', a: 'Enough' },
      { t: 'I am grateful for the breath I am taking.', a: 'Breath' },
      { t: 'Small joys are still joys.', a: 'Joy' },
      { t: 'I carry the people who have loved me well.', a: 'Love' },
      { t: 'This moment will not come again; I welcome it.', a: 'Presence' },
      { t: 'I notice the light wherever it falls.', a: 'Light' },
      { t: 'Thankfulness softens everything it touches.', a: 'Grace' },
    ],
    'calm': [
      { t: 'I let this breath be slow and full.', a: 'Breath' },
      { t: 'Whatever arrives, I meet it calmly.', a: 'Equanimity' },
      { t: 'I do not have to solve everything today.', a: 'Ease' },
      { t: 'Peace is a place I can return to.', a: 'Return' },
      { t: 'I unclench, and let my shoulders drop.', a: 'Release' },
      { t: 'The quiet inside me is always available.', a: 'Stillness' },
      { t: 'I am safe in this moment.', a: 'Safety' },
      { t: 'I move at the pace of my own breath.', a: 'Pace' },
    ],
  }), []);

  const now = useNow(rotation === 'minute', rotation === 'minute' ? 30000 : 3600000);

  const periodKey = useMemo(() => {
    const d = now;
    if (rotation === 'hourly') {
      return Math.floor(d.getTime() / 3600000);
    }
    if (rotation === 'minute') {
      return Math.floor(d.getTime() / 60000);
    }
    return Math.floor(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5
    );
  }, [now, rotation]);

  const list = LIB[category] || LIB['self-care'];

  const hashIndex = (key, len) => {
    let h = 2166136261 ^ key;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 16777619);
    h ^= h >>> 7;
    return Math.abs(h) % len;
  };

  const [bump, setBump] = useState(0);
  const idx = useMemo(() => {
    const base = hashIndex(periodKey, list.length);
    return mini ? base : (base + bump) % list.length;
  }, [periodKey, list.length, bump, mini]);

  const item = list[idx];

  const [fade, setFade] = useState(true);
  useEffect(() => {
    setFade(false);
    const id = setTimeout(() => setFade(true), 30);
    return () => clearTimeout(id);
  }, [idx]);

  const next = () => setBump(b => b + 1);

  const label = (category || 'self-care').replace(/-/g, ' ');

  const quoteSize = item.t.length > 52 ? 21 : item.t.length > 36 ? 24 : 27;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 * s, padding: `${26 * s}px ${24 * s}px`, fontFamily: fontStack, position: 'relative', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s }}>
        <span style={{ width: 5 * s, height: 5 * s, borderRadius: 99, background: accent }} />
        <span style={{ fontSize: 10.5 * s, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{label}</span>
      </div>

      <div style={{ position: 'relative', maxWidth: 360 * s, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width={28 * s} height={22 * s} viewBox="0 0 28 22" style={{ marginBottom: 6 * s, opacity: 0.9 }} aria-hidden="true">
          <path d="M0 22V11C0 4.9 4.9 0 11 0v4.4C7.4 4.4 4.4 7.4 4.4 11v.4H11V22H0zm17 0V11C17 4.9 21.9 0 28 0v4.4c-3.6 0-6.6 3-6.6 6.6v.4H28V22H17z" fill={accent} opacity="0.22" />
        </svg>
        <div
          style={{
            fontSize: quoteSize * s,
            fontWeight: 500,
            lineHeight: 1.34,
            letterSpacing: '-0.012em',
            color: 'var(--w-fg)',
            opacity: fade ? 1 : 0,
            transform: fade ? 'translateY(0)' : `translateY(${5 * s}px)`,
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {item.t}
        </div>
        {showAuthor && (
          <div style={{ marginTop: 12 * s, fontSize: 11.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease 0.05s' }}>
            {item.a}
          </div>
        )}
      </div>

      {!mini && (
        <button
          onClick={next}
          title="Another"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6 * s,
            height: 30 * s,
            padding: `0 ${13 * s}px`,
            borderRadius: 99,
            background: 'transparent',
            border: '1px solid var(--w-line)',
            color: 'var(--w-mut)',
            fontSize: 11.5 * s,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = accent; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--w-mut)'; e.currentTarget.style.borderColor = 'var(--w-line)'; }}
        >
          <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Another</span>
        </button>
      )}
    </div>
  );
}

/* ---------------- COLOR PALETTE ---------------- */
function ColorPaletteW({ config: c, accent, s, fontStack, mini }) {
  const colors = (Array.isArray(c.colors) && c.colors.length ? c.colors : ['#2A6FDB', '#1F8A5B', '#E0A93B']).slice(0, 6);
  const format = c.format || 'hex';
  const copyable = c.copyable !== false;
  const layout = c.layout || 'row';

  const [copied, setCopied] = useState(-1);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const clampHex = (hex) => {
    let h = String(hex || '').trim().replace(/^#/, '');
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
    return '#' + h.toLowerCase();
  };
  const toRgb = (hex) => {
    const h = clampHex(hex);
    if (!h) return [0, 0, 0];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  };
  const toHsl = (hex) => {
    let [r, g, b] = toRgb(hex).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let hh = 0;
    if (d !== 0) {
      if (mx === r) hh = ((g - b) / d) % 6;
      else if (mx === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
    }
    hh = Math.round(hh * 60); if (hh < 0) hh += 360;
    const l = (mx + mn) / 2;
    const ss = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return [hh, Math.round(ss * 100), Math.round(l * 100)];
  };
  const fmt = (hex) => {
    const h = clampHex(hex) || '#000000';
    if (format === 'rgb') { const [r, g, b] = toRgb(h); return 'rgb(' + r + ', ' + g + ', ' + b + ')'; }
    if (format === 'hsl') { const [hh, ss, l] = toHsl(h); return 'hsl(' + hh + ', ' + ss + '%, ' + l + '%)'; }
    return h.toUpperCase();
  };

  const doCopy = (i, text) => {
    if (!copyable || mini) return;
    try { navigator.clipboard.writeText(text); } catch (e) {}
    setCopied(i);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(-1), 1100);
  };

  const Check = ({ col }) => (
    <svg width={13 * s} height={13 * s} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
  );
  const Copy = ({ col }) => (
    <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
  );

  if (layout === 'row') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 12 * s, padding: 18 * s }}>
        {c.title ? <div style={{ fontSize: 11 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, textAlign: 'center' }}>{c.title}</div> : null}
        <div style={{ display: 'flex', gap: 10 * s, alignItems: 'stretch', justifyContent: 'center' }}>
          {colors.map((raw, i) => {
            const hex = clampHex(raw) || '#000000';
            const label = fmt(raw);
            const onc = onColor(hex);
            const isCopied = copied === i;
            return (
              <button key={i} onClick={() => doCopy(i, label)} title={copyable && !mini ? 'Click to copy ' + label : label}
                style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 * s, cursor: copyable && !mini ? 'pointer' : 'default', background: 'transparent', border: 'none', padding: 0 }}>
                <span style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: 12 * s, background: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', display: 'grid', placeItems: 'center', transition: 'transform 0.15s ease' }}>
                  <span style={{ opacity: isCopied ? 1 : 0, transform: isCopied ? 'scale(1)' : 'scale(0.6)', transition: 'opacity 0.18s ease, transform 0.18s ease', display: 'grid', placeItems: 'center', width: 22 * s, height: 22 * s, borderRadius: 99, background: onc === '#ffffff' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }}>
                    <Check col={onc} />
                  </span>
                </span>
                <span style={{ fontSize: 10.5 * s, fontWeight: 600, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums', fontFamily: fontStack, letterSpacing: '-0.01em', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isCopied ? 'Copied' : label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 6 * s, padding: 16 * s }}>
      {c.title ? <div style={{ fontSize: 11 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginBottom: 4 * s, padding: '0 ' + (4 * s) + 'px' }}>{c.title}</div> : null}
      {colors.map((raw, i) => {
        const hex = clampHex(raw) || '#000000';
        const label = fmt(raw);
        const onc = onColor(hex);
        const isCopied = copied === i;
        return (
          <button key={i} onClick={() => doCopy(i, label)} title={copyable && !mini ? 'Click to copy ' + label : label}
            style={{ display: 'flex', alignItems: 'center', gap: 11 * s, padding: (7 * s) + 'px ' + (9 * s) + 'px', borderRadius: 9 * s, cursor: copyable && !mini ? 'pointer' : 'default', background: isCopied ? 'var(--w-line)' : 'transparent', border: 'none', transition: 'background 0.15s ease', width: '100%' }}>
            <span style={{ width: 26 * s, height: 26 * s, borderRadius: 7 * s, background: hex, flex: 'none', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 12.5 * s, fontWeight: 600, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums', fontFamily: fontStack, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            {copyable && !mini ? (
              <span style={{ flex: 'none', display: 'grid', placeItems: 'center', width: 16 * s, height: 16 * s, color: isCopied ? accent : 'var(--w-mut)' }}>
                {isCopied ? <Check col={accent} /> : <Copy col="var(--w-mut)" />}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- CONTENT CALENDAR ---------------- */
function ContentCalendarW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 60000);
  const weekStart = c.weekStart === 'Sun' ? 0 : 1;

  const PLATFORMS = useMemo(() => {
    const def = { instagram: '#E1306C', youtube: '#FF0000', tiktok: '#000000', x: '#1DA1F2', linkedin: '#0A66C2', blog: accent, newsletter: '#F59E0B' };
    const cust = (c.platformColors && typeof c.platformColors === 'object') ? c.platformColors : {};
    return { ...def, ...cust };
  }, [c.platformColors, accent]);

  const entries = useMemo(() => Array.isArray(c.entries) ? c.entries : [], [c.entries]);

  function fmtKey(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
  function platColor(p) { return PLATFORMS[(p || '').toLowerCase()] || accent; }

  const todayKey = fmtKey(now.getFullYear(), now.getMonth(), now.getDate());

  const byDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      if (!e || !e.date) return;
      (map[e.date] = map[e.date] || []).push(e);
    });
    return map;
  }, [entries]);

  // Current week (7 days starting at weekStart, containing today)
  const week = useMemo(() => {
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const offset = (t.getDay() - weekStart + 7) % 7;
    const start = new Date(t.getFullYear(), t.getMonth(), t.getDate() - offset);
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [now, weekStart]);

  const dows = useMemo(() => {
    const base = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const out = [];
    for (let i = 0; i < 7; i++) out.push(base[(i + weekStart) % 7]);
    return out;
  }, [weekStart]);

  const rangeLabel = useMemo(() => {
    const a = week[0], b = week[6];
    const fmt = (d) => d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    return fmt(a) + ' – ' + fmt(b);
  }, [week]);

  // Upcoming posts: today and after, soonest first
  const upcoming = useMemo(() => {
    return entries
      .filter((e) => e && e.date && e.date >= todayKey)
      .sort((p, q) => (p.date < q.date ? -1 : p.date > q.date ? 1 : 0));
  }, [entries, todayKey]);

  const weekCount = useMemo(() => {
    let n = 0;
    week.forEach((d) => { n += (byDate[fmtKey(d.getFullYear(), d.getMonth(), d.getDate())] || []).length; });
    return n;
  }, [week, byDate]);

  const agendaN = mini ? 0 : 3;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: 15 * s }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 * s }}>
        <div style={{ fontSize: 14 * s, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>This Week</div>
        <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{rangeLabel} · {weekCount} post{weekCount === 1 ? '' : 's'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 * s }}>
        {week.map((d, i) => {
          const key = fmtKey(d.getFullYear(), d.getMonth(), d.getDate());
          const items = byDate[key] || [];
          const isToday = key === todayKey;
          const shown = items.slice(0, 3);
          const extra = items.length - shown.length;
          return (
            <div
              key={'d' + i}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * s,
                borderRadius: 8 * s, padding: (5 * s) + 'px 0',
                background: isToday ? accent : (items.length ? 'var(--w-line)' : 'transparent'),
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: 8.5 * s, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: isToday ? onColor(accent) : 'var(--w-mut)', lineHeight: 1 }}>{dows[i]}</span>
              <span style={{ fontSize: 13 * s, fontWeight: isToday ? 700 : 600, lineHeight: 1, color: isToday ? onColor(accent) : 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{d.getDate()}</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5 * s, height: 6 * s }}>
                {shown.map((e, k) => (
                  <span key={k} style={{ width: 5 * s, height: 5 * s, borderRadius: 99, background: e.status === 'published' ? platColor(e.platform) : 'transparent', border: (1 * s) + 'px solid ' + (isToday ? onColor(accent) : platColor(e.platform)), boxSizing: 'border-box' }} />
                ))}
                {extra > 0 && <span style={{ fontSize: 7 * s, fontWeight: 700, color: isToday ? onColor(accent) : 'var(--w-mut)', lineHeight: 1 }}>+{extra}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {!mini && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 * s, paddingTop: 7 * s, borderTop: '1px solid var(--w-line)' }}>
          {upcoming.length === 0 ? (
            <span style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 600 }}>No upcoming posts</span>
          ) : (
            <>
              {upcoming.slice(0, agendaN).map((e, i) => {
                const d = e.date ? new Date(e.date + 'T00:00:00') : null;
                const dayLabel = d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) : '';
                const pub = e.status === 'published';
                const col = platColor(e.platform);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 * s }}>
                    <span style={{ width: 8 * s, height: 8 * s, borderRadius: 99, background: pub ? col : 'transparent', border: '1.5px solid ' + col, boxSizing: 'border-box', flex: '0 0 auto' }} />
                    <span style={{ fontSize: 11 * s, fontWeight: 600, color: 'var(--w-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{e.title || 'Untitled'}</span>
                    <span style={{ fontSize: 9.5 * s, fontWeight: 700, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}>{dayLabel}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- POSTING STREAK ---------------- */
function PostingStreakW({ config: c, accent, s, fontStack, mini }) {
  const resetHour = typeof c.resetHour === 'number' ? c.resetHour : 4;
  const showLongest = c.showLongest !== false;

  const dayKey = (d) => {
    const shifted = new Date(d.getTime() - resetHour * 36e5);
    return Math.floor((shifted.getTime() - shifted.getTimezoneOffset() * 6e4) / 864e5);
  };

  const todayKey = dayKey(new Date());

  const seedKeys = useMemo(() => {
    const out = [];
    const arr = Array.isArray(c.postDates) ? c.postDates : [];
    for (const v of arr) {
      if (typeof v === 'number') { out.push(v); continue; }
      const parsed = new Date(v + 'T12:00:00');
      if (!isNaN(parsed)) out.push(dayKey(parsed));
    }
    return out;
  }, [c.postDates, resetHour]);

  const [extra, setExtra] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nc_postingStreak_days')) || []; }
    catch (e) { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem('nc_postingStreak_days', JSON.stringify(extra)); } catch (e) {}
  }, [extra]);

  const days = useMemo(() => {
    const set = new Set();
    seedKeys.forEach(k => set.add(k));
    extra.forEach(k => set.add(k));
    return set;
  }, [seedKeys, extra]);

  const postedToday = days.has(todayKey);

  const current = useMemo(() => {
    let n = 0;
    let cursor = days.has(todayKey) ? todayKey : todayKey - 1;
    while (days.has(cursor)) { n++; cursor--; }
    return n;
  }, [days, todayKey]);

  const longest = useMemo(() => {
    const sorted = Array.from(days).sort((a, b) => a - b);
    let best = 0, run = 0, prev = null;
    for (const k of sorted) {
      run = (prev !== null && k === prev + 1) ? run + 1 : 1;
      if (run > best) best = run;
      prev = k;
    }
    return Math.max(best, current);
  }, [days, current]);

  const toggleToday = () => {
    setExtra(prev => {
      if (days.has(todayKey)) {
        return prev.filter(k => k !== todayKey);
      }
      return prev.includes(todayKey) ? prev : [...prev, todayKey];
    });
  };

  const intensity = Math.min(1, current / 14);
  const lit = current > 0;
  const flameSize = 46;
  const flameCore = lit ? accent : 'var(--w-line)';
  const flameOuter = lit ? lighten(accent, 0.18) : 'var(--w-line)';
  const flameInner = lit ? lighten(accent, 0.55) : 'transparent';

  // last 7 logical days, marking which were posted
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const k = todayKey - i;
    week.push({ k, on: days.has(k), today: k === todayKey });
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', gap: 12 * s, padding: 15 * s,
      fontFamily: fontStack, boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 * s }}>
        <div style={{
          position: 'relative', width: flameSize * s, height: flameSize * s,
          display: 'grid', placeItems: 'center', flexShrink: 0
        }}>
          {lit ? (
            <div style={{
              position: 'absolute', width: flameSize * 0.7 * s, height: flameSize * 0.7 * s,
              borderRadius: '50%', background: accent, filter: 'blur(' + (12 * s) + 'px)',
              opacity: 0.16 + intensity * 0.22, bottom: 0
            }} />
          ) : null}
          <svg width={flameSize * s} height={flameSize * s} viewBox="0 0 64 72" style={{ position: 'relative' }}>
            <path
              d="M32 2 C42 18 54 24 54 44 C54 60 44 70 32 70 C20 70 10 60 10 44 C10 30 22 26 24 14 C30 22 28 30 36 34 C40 28 38 18 32 2 Z"
              fill={flameOuter}
              opacity={lit ? 0.9 : 0.4}
            />
            <path
              d="M32 20 C40 30 44 36 44 46 C44 56 38 64 32 64 C26 64 20 57 20 47 C20 39 26 37 28 30 C30 36 30 40 35 42 C37 38 36 30 32 20 Z"
              fill={flameCore}
            />
            {lit ? (
              <path
                d="M32 38 C37 44 38 48 38 52 C38 58 35 62 32 62 C29 62 26 58 26 53 C26 48 29 47 30 43 C31 47 32 47 33 47 C34 45 33 42 32 38 Z"
                fill={flameInner}
                opacity={0.55 + intensity * 0.35}
              />
            ) : null}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s }}>
            <span style={{
              fontSize: 38 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums', color: lit ? 'var(--w-fg)' : 'var(--w-mut)'
            }}>{current}</span>
            <span style={{ fontSize: 13 * s, fontWeight: 600, color: 'var(--w-mut)' }}>
              {current === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div style={{
            fontSize: 10 * s, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--w-mut)', fontWeight: 600
          }}>
            {lit ? 'current streak' : 'start your streak'}
          </div>
        </div>

        {showLongest && !mini ? (
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 * s }}>
            <span style={{
              fontSize: 22 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)'
            }}>{longest}</span>
            <span style={{
              fontSize: 9 * s, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--w-mut)', fontWeight: 600
            }}>longest</span>
          </div>
        ) : null}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10 * s,
        paddingTop: 11 * s, borderTop: '1px solid var(--w-line)'
      }}>
        <div style={{ display: 'flex', gap: 5 * s, flex: 1 }}>
          {week.map((d) => (
            <div key={d.k} style={{
              flex: 1, height: 20 * s, borderRadius: 5 * s,
              background: d.on ? accent : 'var(--w-line)',
              opacity: d.on ? 1 : 0.5,
              border: d.today ? ('1.5px solid ' + (d.on ? onColor(accent) : 'var(--w-mut)')) : 'none',
              boxSizing: 'border-box'
            }} />
          ))}
        </div>

        {!mini ? (
          <button
            onClick={toggleToday}
            style={{
              height: 30 * s, padding: '0 ' + (13 * s) + 'px', borderRadius: 8 * s,
              background: postedToday ? 'transparent' : accent,
              color: postedToday ? 'var(--w-fg)' : onColor(accent),
              border: postedToday ? '1px solid var(--w-line)' : 'none',
              fontSize: 11.5 * s, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
              flexShrink: 0, fontFamily: fontStack
            }}
          >
            {postedToday ? 'Posted' : 'Mark today'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- PHOTO FRAME ---------------- */
function PhotoFrameW({ config: c, accent, s, fontStack, mini }) {
  const frame = c.frame || 'polaroid';
  const interval = Math.max(2, c.interval || 6);
  const caption = c.caption || '';

  const imgs = useMemo(() => {
    const raw = c.images;
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (typeof raw === 'string') list = raw.split(/[\n,]+/);
    return list.map(u => (u || '').trim()).filter(Boolean);
  }, [c.images]);

  const count = imgs.length;
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [failed, setFailed] = useState({});

  useEffect(() => { if (idx >= count) setIdx(0); }, [count, idx]);

  const auto = count > 1 && !mini;
  const now = useNow(auto, interval * 1000);
  const tickRef = useRef(0);
  useEffect(() => {
    if (!auto) return;
    tickRef.current += 1;
    if (tickRef.current > 1) setIdx(p => (p + 1) % count);
  }, [now, auto, count]);

  const go = (dir) => { if (count > 1) setIdx(p => (p + dir + count) % count); };
  const cur = imgs[idx];
  const isPolaroid = frame === 'polaroid';
  const isRounded = frame === 'rounded';

  const pad = isPolaroid ? 10 * s : (frame === 'none' ? 0 : 7 * s);
  const radius = isRounded ? 14 * s : (frame === 'none' ? 0 : 4 * s);
  const innerRadius = isRounded ? 9 * s : (isPolaroid ? 2 * s : 2.5 * s);

  const frameBg = isPolaroid ? '#fdfcf8' : 'var(--w-fg)';
  const frameShadow = frame === 'none'
    ? 'none'
    : (isPolaroid
        ? '0 1px 1px rgba(0,0,0,0.04), 0 10px 22px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)'
        : '0 8px 20px rgba(0,0,0,0.14), 0 2px 5px rgba(0,0,0,0.07)');

  const Empty = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 * s, color: 'var(--w-mut)' }}>
      <svg width={36 * s} height={36 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <circle cx="8.5" cy="8.5" r="1.6" />
        <path d="M21 15.5l-5-5L5 21" />
      </svg>
      <div style={{ fontSize: 11.5 * s, fontWeight: 500, letterSpacing: '0.01em' }}>Add image links</div>
    </div>
  );

  const Broken = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 * s, color: 'var(--w-mut)', background: 'var(--w-line)' }}>
      <svg width={28 * s} height={28 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M3 16.5l5-5 4 4M21 14l-3-3-2 2" />
        <path d="M3.5 3.5l17 17" />
      </svg>
      <div style={{ fontSize: 10.5 * s, fontWeight: 500 }}>Couldn't load</div>
    </div>
  );

  const Nav = ({ dir }) => (
    <button onClick={() => go(dir)} aria-label={dir < 0 ? 'Previous' : 'Next'}
      style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [dir < 0 ? 'left' : 'right']: 6 * s,
        width: 26 * s, height: 26 * s, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: 'rgba(20,20,20,0.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'grid', placeItems: 'center', opacity: 0.85, transition: 'opacity 0.15s, background 0.15s', padding: 0 }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(20,20,20,0.62)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.background = 'rgba(20,20,20,0.42)'; }}>
      <svg width={13 * s} height={13 * s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {dir < 0 ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', background: frameBg, padding: pad,
        paddingBottom: isPolaroid ? (caption ? 34 * s : 26 * s) : pad,
        borderRadius: radius, boxShadow: frameShadow, display: 'flex', flexDirection: 'column' }}>

        <div style={{ position: 'relative', width: 168 * s, aspectRatio: '1 / 1', maxWidth: '100%',
          borderRadius: innerRadius, overflow: 'hidden', background: 'var(--w-line)' }}>

          {count === 0 ? <Empty /> : (failed[cur] ? <Broken /> : (
            <>
              <img key={cur} src={cur} alt={caption || 'Photo'}
                onLoad={() => setLoaded(p => p[cur] ? p : { ...p, [cur]: true })}
                onError={() => setFailed(p => p[cur] ? p : { ...p, [cur]: true })}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                  display: 'block', opacity: loaded[cur] ? 1 : 0, transition: 'opacity 0.5s ease' }} />
              {!loaded[cur] && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <div style={{ width: 16 * s, height: 16 * s, borderRadius: 99, border: `2px solid var(--w-mut)`,
                    borderTopColor: 'transparent', animation: 'nc_pf_spin 0.7s linear infinite', opacity: 0.5 }} />
                </div>
              )}
            </>
          ))}

          {!mini && count > 1 && !failed[cur] && <><Nav dir={-1} /><Nav dir={1} /></>}

          {isPolaroid && count > 1 && (
            <div style={{ position: 'absolute', top: 7 * s, right: 7 * s, fontSize: 9.5 * s, fontWeight: 600,
              color: '#fff', background: 'rgba(20,20,20,0.4)', backdropFilter: 'blur(3px)',
              padding: `${1.5 * s}px ${6 * s}px`, borderRadius: 99, letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums' }}>{idx + 1}/{count}</div>
          )}
        </div>

        {isPolaroid && caption && (
          <div style={{ marginTop: 8 * s, textAlign: 'center', fontSize: 13 * s, color: '#3a3733',
            fontWeight: 500, lineHeight: 1.2, fontFamily: '"Caveat", "Bradley Hand", "Segoe Script", cursive',
            letterSpacing: '0.01em' }}>{caption}</div>
        )}
      </div>

      {!isPolaroid && caption && (
        <div style={{ fontSize: 12.5 * s, color: 'var(--w-mut)', fontWeight: 500, textAlign: 'center',
          lineHeight: 1.3, maxWidth: 200 * s }}>{caption}</div>
      )}

      {count > 1 && (
        <div style={{ display: 'flex', gap: 5 * s, alignItems: 'center' }}>
          {imgs.map((_, i) => (
            <button key={i} onClick={() => !mini && setIdx(i)} aria-label={'Go to ' + (i + 1)}
              style={{ width: i === idx ? 16 * s : 5 * s, height: 5 * s, borderRadius: 99, border: 'none',
                padding: 0, cursor: mini ? 'default' : 'pointer',
                background: i === idx ? accent : 'var(--w-line)', transition: 'width 0.25s ease, background 0.25s ease' }} />
          ))}
        </div>
      )}

      <style>{'@keyframes nc_pf_spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}

/* ---------------- QUOTE CARD ---------------- */
function QuoteCardW({ config: c, accent, s, fontStack, mini }) {
  const category = c.category || 'motivation';
  const rotation = c.rotation || 'daily';
  const showAuthor = c.showAuthor !== false;

  const BANK = useMemo(() => ({
    motivation: [
      { t: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
      { t: 'Well done is better than well said.', a: 'Benjamin Franklin' },
      { t: 'Act as if what you do makes a difference. It does.', a: 'William James' },
      { t: 'Quality is not an act, it is a habit.', a: 'Aristotle' },
      { t: 'Do what you can, with what you have, where you are.', a: 'Theodore Roosevelt' },
      { t: 'The future depends on what you do today.', a: 'Mahatma Gandhi' },
      { t: 'Little by little, one travels far.', a: 'J.R.R. Tolkien' },
      { t: 'Discipline is choosing between what you want now and what you want most.', a: 'Abraham Lincoln' },
      { t: 'Start where you are. Use what you have. Do what you can.', a: 'Arthur Ashe' },
      { t: 'The way to get started is to quit talking and begin doing.', a: 'Walt Disney' }
    ],
    calm: [
      { t: 'Almost everything will work again if you unplug it for a few minutes, including you.', a: 'Anne Lamott' },
      { t: 'Within you there is a stillness to which you can retreat at any time.', a: 'Hermann Hesse' },
      { t: 'Nature does not hurry, yet everything is accomplished.', a: 'Lao Tzu' },
      { t: 'Smile, breathe and go slowly.', a: 'Thich Nhat Hanh' },
      { t: 'Tension is who you think you should be. Relaxation is who you are.', a: 'Chinese Proverb' },
      { t: 'Quiet the mind, and the soul will speak.', a: 'Ma Jaya Sati Bhagavati' },
      { t: 'Adopt the pace of nature: her secret is patience.', a: 'Ralph Waldo Emerson' },
      { t: 'Peace comes from within. Do not seek it without.', a: 'Buddha' },
      { t: 'In the midst of movement and chaos, keep stillness inside of you.', a: 'Deepak Chopra' },
      { t: 'Rest is not idleness, it is the key to a better self.', a: 'John Lubbock' }
    ],
    wisdom: [
      { t: 'Knowing yourself is the beginning of all wisdom.', a: 'Aristotle' },
      { t: 'The only true wisdom is in knowing you know nothing.', a: 'Socrates' },
      { t: 'It is not the man who has too little, but the man who craves more, that is poor.', a: 'Seneca' },
      { t: 'We suffer more often in imagination than in reality.', a: 'Seneca' },
      { t: 'He who has a why to live can bear almost any how.', a: 'Friedrich Nietzsche' },
      { t: 'The unexamined life is not worth living.', a: 'Socrates' },
      { t: 'What we think, we become.', a: 'Buddha' },
      { t: 'Waste no more time arguing about what a good person should be. Be one.', a: 'Marcus Aurelius' },
      { t: 'The flame that burns twice as bright burns half as long.', a: 'Lao Tzu' },
      { t: 'A wise man makes his own decisions, an ignorant man follows public opinion.', a: 'Chinese Proverb' }
    ],
    creativity: [
      { t: 'Creativity is intelligence having fun.', a: 'Albert Einstein' },
      { t: 'You can’t use up creativity. The more you use, the more you have.', a: 'Maya Angelou' },
      { t: 'The chief enemy of creativity is good sense.', a: 'Pablo Picasso' },
      { t: 'Have no fear of perfection — you’ll never reach it.', a: 'Salvador Dalí' },
      { t: 'To create one’s own world takes courage.', a: 'Georgia O’Keeffe' },
      { t: 'Everything you can imagine is real.', a: 'Pablo Picasso' },
      { t: 'Inspiration exists, but it has to find you working.', a: 'Pablo Picasso' },
      { t: 'Make visible what, without you, might perhaps never have been seen.', a: 'Robert Bresson' },
      { t: 'An essential aspect of creativity is not being afraid to fail.', a: 'Edwin Land' },
      { t: 'Simplicity is the ultimate sophistication.', a: 'Leonardo da Vinci' }
    ]
  }), []);

  const list = BANK[category] || BANK.motivation;

  const seedFor = (rot) => {
    const d = new Date();
    if (rot === 'hourly') return Math.floor(Date.now() / 36e5);
    if (rot === 'daily') return Math.floor(Date.now() / 864e5);
    return Math.floor(Date.now() / (7 * 864e5));
  };

  const [bump, setBump] = useState(0);
  const [fade, setFade] = useState(false);

  const idx = useMemo(() => {
    if (rotation === 'shuffle') {
      return ((Math.floor(seedFor('daily')) + bump) % list.length + list.length) % list.length;
    }
    return (seedFor(rotation) % list.length + list.length) % list.length;
  }, [rotation, list, bump]);

  const q = list[idx] || list[0];

  const next = () => {
    setFade(true);
    setTimeout(() => { setBump(b => b + 1); setFade(false); }, 180);
  };

  const dyn = luminance(accent) > 0.78;
  const mark = dyn ? 'var(--w-line)' : accent;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: 26 * s, position: 'relative', overflow: 'hidden', fontFamily: fontStack }}>
      <div aria-hidden style={{ position: 'absolute', top: 8 * s, left: 18 * s, fontSize: 110 * s, lineHeight: 0.8, fontWeight: 800, fontFamily: 'Georgia, "Times New Roman", serif', color: mark, opacity: 0.1, pointerEvents: 'none', userSelect: 'none' }}>{'“'}</div>

      <div style={{ width: '100%', maxWidth: 420 * s, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * s, position: 'relative', zIndex: 1, transition: 'opacity 0.18s ease, transform 0.18s ease', opacity: fade ? 0 : 1, transform: fade ? `translateY(${4 * s}px)` : 'none' }}>
        <div style={{ fontSize: (q.t.length > 90 ? 17 : q.t.length > 55 ? 19.5 : 23) * s, fontWeight: 500, lineHeight: 1.42, letterSpacing: '-0.012em', textAlign: 'center', color: 'var(--w-fg)' }}>
          {q.t}
        </div>

        {showAuthor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 * s }}>
            <span style={{ width: 18 * s, height: 1.5, background: accent, borderRadius: 2, opacity: 0.55 }} />
            <span style={{ fontSize: 12.5 * s, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--w-mut)' }}>{q.a}</span>
          </div>
        )}
      </div>

      {!mini && (rotation === 'shuffle') && (
        <button onClick={next} aria-label="New quote" style={{ position: 'absolute', bottom: 14 * s, right: 14 * s, width: 30 * s, height: 30 * s, borderRadius: 99, display: 'grid', placeItems: 'center', background: 'transparent', border: `1px solid var(--w-line)`, color: 'var(--w-mut)', cursor: 'pointer', zIndex: 2 }}>
          <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ---------------- DICE ROLLER ---------------- */
function DiceRollerW({ config: c, accent, s, fontStack, mini }) {
  const count = Math.max(1, Math.min(6, c.count || 2));
  const sides = c.sides || 6;
  const showTotal = c.showTotal !== false;

  const roll = useCallback((n, sd) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push(1 + Math.floor(Math.random() * sd));
    return out;
  }, []);

  const [vals, setVals] = useState(() => roll(count, sides));
  const [rolling, setRolling] = useState(false);
  const [tick, setTick] = useState(0);
  const timer = useRef(null);
  const settle = useRef(null);

  // keep dice array in sync if config count/sides change
  useEffect(() => {
    setVals(prev => {
      const next = [];
      for (let i = 0; i < count; i++) next.push(prev[i] && prev[i] <= sides ? prev[i] : 1 + Math.floor(Math.random() * sides));
      return next;
    });
  }, [count, sides]);

  useEffect(() => () => { clearInterval(timer.current); clearTimeout(settle.current); }, []);

  const doRoll = useCallback(() => {
    clearInterval(timer.current);
    clearTimeout(settle.current);
    setRolling(true);
    timer.current = setInterval(() => {
      setVals(roll(count, sides));
      setTick(t => t + 1);
    }, 70);
    settle.current = setTimeout(() => {
      clearInterval(timer.current);
      setVals(roll(count, sides));
      setRolling(false);
    }, 560);
  }, [count, sides, roll]);

  const total = vals.reduce((a, b) => a + (b || 0), 0);

  // pip layouts for a d6 face (3x3 grid positions)
  const PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const Die = ({ v, idx }) => {
    const size = (mini ? 40 : 56) * s;
    const r = size * 0.2;
    const pad = size * 0.18;
    const gap = (size - pad * 2);
    const pipR = size * 0.082;
    const wob = rolling ? ((idx % 2 === 0 ? 1 : -1) * ((tick % 2) * 7 - 3.5)) : 0;
    const usePips = sides === 6;
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: r,
          background: 'var(--w-fg)',
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          transform: 'rotate(' + wob + 'deg) scale(' + (rolling ? 1.04 : 1) + ')',
          transition: rolling ? 'none' : 'transform 0.18s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: '0 ' + (4 * s) + 'px ' + (12 * s) + 'px rgba(0,0,0,0.14)',
          flexShrink: 0,
        }}
      >
        {usePips ? (
          <div style={{ position: 'absolute', inset: pad, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
            {Array.from({ length: 9 }).map((_, p) => (
              <div key={p} style={{ display: 'grid', placeItems: 'center' }}>
                {PIPS[v] && PIPS[v].indexOf(p) !== -1 ? (
                  <span style={{ width: pipR * 2, height: pipR * 2, borderRadius: 99, background: accent }} />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: size * 0.42, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v}</span>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 * s, padding: 18 * s, fontFamily: fontStack }}>
      <div
        onClick={mini ? undefined : doRoll}
        role={mini ? undefined : 'button'}
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 * s, cursor: mini ? 'default' : 'pointer', maxWidth: '100%' }}
      >
        {vals.map((v, i) => <Die key={i} v={v} idx={i} />)}
      </div>

      {showTotal ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 * s }}>
          <div style={{ fontSize: (mini ? 24 : 32) * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--w-fg)' }}>{total}</div>
          <div style={{ fontSize: 10 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{count > 1 ? 'total · ' + count + 'd' + sides : 'd' + sides}</div>
        </div>
      ) : (
        <div style={{ fontSize: 10 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{count + 'd' + sides}</div>
      )}

      {!mini ? (
        <button
          onClick={doRoll}
          disabled={rolling}
          style={{
            height: 34 * s,
            padding: '0 ' + (18 * s) + 'px',
            borderRadius: 8 * s,
            background: accent,
            color: onColor(accent),
            fontSize: 13 * s,
            fontWeight: 600,
            letterSpacing: '0.02em',
            border: 'none',
            cursor: rolling ? 'default' : 'pointer',
            opacity: rolling ? 0.7 : 1,
            transition: 'opacity 0.2s, transform 0.12s',
            fontFamily: fontStack,
          }}
        >
          {rolling ? 'Rolling…' : 'Roll'}
        </button>
      ) : null}
    </div>
  );
}

/* ---------------- MAGIC 8-BALL ---------------- */
function Magic8BallW({ config: c, accent, s, fontStack, mini }) {
  const answers = useMemo(() => {
    const a = Array.isArray(c.answers) ? c.answers.filter(x => x && String(x).trim()) : [];
    return a.length ? a : ['It is certain', 'Without a doubt', 'Most likely', 'Ask again later', "Don't count on it", 'My reply is no', 'Very doubtful', 'Cannot predict now'];
  }, [c.answers]);

  const ballColor = c.ballColor || '#18181a';
  const ink = onColor(ballColor);

  const [idx, setIdx] = useState(() => Math.floor(Math.random() * answers.length));
  const [phase, setPhase] = useState('idle'); // idle | shaking | reveal
  const [revealKey, setRevealKey] = useState(0);
  const timers = useRef([]);

  useEffect(() => () => { timers.current.forEach(t => clearTimeout(t)); }, []);

  const shake = useCallback(() => {
    if (phase === 'shaking') return;
    timers.current.forEach(t => clearTimeout(t));
    timers.current = [];
    setPhase('shaking');
    timers.current.push(setTimeout(() => {
      setIdx(Math.floor(Math.random() * answers.length));
      setRevealKey(k => k + 1);
      setPhase('reveal');
    }, 850));
  }, [phase, answers.length]);

  const D = 168 * s;
  const win = 60 * s; // triangle window diameter
  const answer = answers[idx] || '…';

  // size answer text to the window
  const len = answer.length;
  const aSize = (len > 26 ? 7.4 : len > 18 ? 8.6 : len > 11 ? 10 : 11.5) * s;

  const shaking = phase === 'shaking';
  const idle = phase === 'idle';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 * s, padding: 18 * s, fontFamily: fontStack }}>
      <style>{`
        @keyframes nc8_shake { 0%,100%{transform:translate(0,0) rotate(0)} 12%{transform:translate(-5px,2px) rotate(-4deg)} 25%{transform:translate(5px,-3px) rotate(4deg)} 40%{transform:translate(-6px,-2px) rotate(-5deg)} 55%{transform:translate(6px,3px) rotate(5deg)} 70%{transform:translate(-4px,2px) rotate(-3deg)} 85%{transform:translate(4px,-2px) rotate(3deg)} }
        @keyframes nc8_rise { 0%{opacity:0;transform:scale(0.55)} 60%{opacity:1} 100%{opacity:1;transform:scale(1)} }
        @keyframes nc8_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
      `}</style>

      <div style={{ position: 'relative', width: D, height: D, animation: shaking ? 'nc8_shake 0.85s ease-in-out' : 'none' }}>
        {/* drop shadow */}
        <div style={{ position: 'absolute', bottom: -6 * s, left: '50%', transform: 'translateX(-50%)', width: D * 0.62, height: 10 * s, background: 'rgba(0,0,0,0.22)', borderRadius: '50%', filter: 'blur(4px)' }} />

        {/* ball body */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle at 34% 28%, ${lighten(ballColor, 0.34)} 0%, ${ballColor} 46%, ${lighten(ballColor, -0.12)} 100%)`,
          boxShadow: `inset 0 ${-6 * s}px ${18 * s}px rgba(0,0,0,0.45), 0 ${6 * s}px ${16 * s}px rgba(0,0,0,0.22)`,
          display: 'grid', placeItems: 'center'
        }}>
          {/* specular highlight */}
          <div style={{ position: 'absolute', top: D * 0.13, left: D * 0.2, width: D * 0.26, height: D * 0.18, borderRadius: '50%', background: 'rgba(255,255,255,0.32)', filter: 'blur(3px)', transform: 'rotate(-18deg)' }} />

          {/* the 8 window — inner dark disc */}
          <div style={{
            width: win * 2.0, height: win * 2.0, borderRadius: '50%',
            background: `radial-gradient(circle at 50% 38%, ${lighten(ballColor, 0.12)} 0%, ${lighten(ballColor, -0.22)} 78%)`,
            boxShadow: `inset 0 0 ${10 * s}px rgba(0,0,0,0.7)`,
            display: 'grid', placeItems: 'center', overflow: 'hidden'
          }}>
            {/* triangle window */}
            <div style={{ position: 'relative', width: win * 1.6, height: win * 1.6, display: 'grid', placeItems: 'center' }}>
              <svg width={win * 1.6} height={win * 1.6} viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <radialGradient id="nc8win" cx="50%" cy="42%" r="62%">
                    <stop offset="0%" stopColor="#1c2d6e" stopOpacity="0.96" />
                    <stop offset="100%" stopColor="#070b22" stopOpacity="0.99" />
                  </radialGradient>
                </defs>
                <polygon points="50,12 90,82 10,82" fill="url(#nc8win)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </svg>

              {/* fluid / text area */}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', paddingTop: win * 0.55, textAlign: 'center' }}>
                {idle ? (
                  <span style={{ fontSize: 26 * s, fontWeight: 800, color: 'rgba(255,255,255,0.9)', lineHeight: 1, animation: 'nc8_float 3s ease-in-out infinite' }}>8</span>
                ) : shaking ? (
                  <span style={{ fontSize: 9 * s, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>···</span>
                ) : (
                  <span key={revealKey} style={{
                    fontSize: aSize, fontWeight: 700, lineHeight: 1.18, padding: `0 ${10 * s}px`,
                    color: 'rgba(225,232,255,0.97)', textShadow: '0 0 6px rgba(120,150,255,0.45)',
                    animation: 'nc8_rise 0.6s cubic-bezier(0.2,0.8,0.2,1) both'
                  }}>{answer}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!mini && (
        <button onClick={shake} disabled={shaking} style={{
          height: 36 * s, padding: `0 ${20 * s}px`, borderRadius: 99,
          background: accent, color: onColor(accent), border: 'none',
          fontSize: 13 * s, fontWeight: 600, fontFamily: fontStack,
          letterSpacing: '0.01em', cursor: shaking ? 'default' : 'pointer',
          opacity: shaking ? 0.65 : 1, transition: 'opacity 0.2s, transform 0.1s',
          display: 'inline-flex', alignItems: 'center', gap: 7 * s
        }}>
          <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke={onColor(accent)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v4h-4" />
          </svg>
          {shaking ? 'Shaking…' : idle ? 'Ask the ball' : 'Ask again'}
        </button>
      )}

      {mini && !idle && (
        <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The ball has spoken</div>
      )}
    </div>
  );
}

/* ---------------- ASCII BANNER ---------------- */
function AsciiBannerW({ config: c, accent, s, fontStack, mini }) {
  const text = (c.text != null ? c.text : 'HELLO');
  const font = c.font || 'standard';
  const align = c.align || 'left';

  // 5-row pixel glyphs, each cell '#' or ' '. Width varies; we pad with one blank col.
  const GLYPHS = useMemo(() => ({
    'A': ['.##.', '#..#', '####', '#..#', '#..#'],
    'B': ['###.', '#..#', '###.', '#..#', '###.'],
    'C': ['.###', '#...', '#...', '#...', '.###'],
    'D': ['###.', '#..#', '#..#', '#..#', '###.'],
    'E': ['####', '#...', '###.', '#...', '####'],
    'F': ['####', '#...', '###.', '#...', '#...'],
    'G': ['.###', '#...', '#.##', '#..#', '.###'],
    'H': ['#..#', '#..#', '####', '#..#', '#..#'],
    'I': ['###', '.#.', '.#.', '.#.', '###'],
    'J': ['..##', '...#', '...#', '#..#', '.##.'],
    'K': ['#..#', '#.#.', '##..', '#.#.', '#..#'],
    'L': ['#...', '#...', '#...', '#...', '####'],
    'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
    'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
    'O': ['.##.', '#..#', '#..#', '#..#', '.##.'],
    'P': ['###.', '#..#', '###.', '#...', '#...'],
    'Q': ['.##.', '#..#', '#..#', '#.##', '.###'],
    'R': ['###.', '#..#', '###.', '#.#.', '#..#'],
    'S': ['.###', '#...', '.##.', '...#', '###.'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..'],
    'U': ['#..#', '#..#', '#..#', '#..#', '.##.'],
    'V': ['#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'W': ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
    'X': ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
    'Y': ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
    'Z': ['####', '...#', '.##.', '#...', '####'],
    '0': ['.##.', '#.##', '#.##', '##.#', '.##.'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###.', '...#', '.##.', '#...', '####'],
    '3': ['###.', '...#', '.##.', '...#', '###.'],
    '4': ['#..#', '#..#', '####', '...#', '...#'],
    '5': ['####', '#...', '###.', '...#', '###.'],
    '6': ['.###', '#...', '###.', '#..#', '.##.'],
    '7': ['####', '...#', '..#.', '.#..', '.#..'],
    '8': ['.##.', '#..#', '.##.', '#..#', '.##.'],
    '9': ['.##.', '#..#', '.###', '...#', '###.'],
    '!': ['#', '#', '#', '.', '#'],
    '?': ['###.', '...#', '.##.', '....', '.#..'],
    '.': ['.', '.', '.', '.', '#'],
    ',': ['.', '.', '.', '#', '#'],
    "'": ['#', '#', '.', '.', '.'],
    '-': ['....', '....', '####', '....', '....'],
    '+': ['...', '.#.', '###', '.#.', '...'],
    '/': ['...#', '..#.', '.#..', '#...', '#...'],
    '&': ['.##.', '#..#', '.##.', '#.#.', '.#.#'],
    '@': ['.###.', '#.#.#', '#.###', '#....', '.###.'],
    '#': ['.#.#.', '#####', '.#.#.', '#####', '.#.#.'],
    '*': ['.#.', '###', '.#.', '...', '...'],
    ':': ['.', '#', '.', '#', '.'],
    ' ': ['..', '..', '..', '..', '..']
  }), []);

  const ROWS = 5;

  const lines = useMemo(() => {
    const raw = String(text).toUpperCase().split('\n');
    return raw.map((line) => {
      const chars = line.split('');
      const rowStrings = [];
      for (let r = 0; r < ROWS; r++) {
        let rowStr = '';
        chars.forEach((ch, ci) => {
          const g = GLYPHS[ch] || GLYPHS[' '];
          rowStr += g[r];
          if (ci < chars.length - 1) rowStr += ' '; // 1-col gap between letters
        });
        rowStrings.push(rowStr);
      }
      return rowStrings;
    });
  }, [text, GLYPHS]);

  // longest line width (in cells) for sizing
  const maxCols = useMemo(() => {
    let m = 1;
    lines.forEach((ls) => { ls.forEach((r) => { if (r.length > m) m = r.length; }); });
    return m;
  }, [lines]);

  const wrapRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => { if (ro) ro.disconnect(); };
  }, []);

  const totalRows = lines.length * (ROWS + 1) - 1; // 1 blank row between text-lines
  // glyph cell = a square-ish char; pick size to fit box (cols * cw <= w, rows*ch <= h)
  const cw = box.w && box.h
    ? Math.max(3 * s, Math.min(
        (box.w) / (maxCols * 0.62),
        (box.h) / (totalRows * 1.05)
      ))
    : 10 * s;
  const fontPx = cw;
  const lineH = fontPx * 1.04;

  // Build full grid rows incl. blank separators between text lines.
  const grid = useMemo(() => {
    const out = [];
    lines.forEach((ls, li) => {
      ls.forEach((r) => out.push(r));
      if (li < lines.length - 1) out.push(''); // separator
    });
    return out;
  }, [lines]);

  const renderCell = (ch, key) => {
    const on = ch === '#';
    return (
      <span
        key={key}
        style={{
          color: on ? accent : 'transparent',
          opacity: on ? 1 : 0
        }}
      >{on ? '█' : ' '}</span>
    );
  };

  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', padding: 16 * s, boxSizing: 'border-box', gap: 8 * s, fontFamily: fontStack }}>
      {c.label ? (
        <div style={{ fontSize: 10.5 * s, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, textAlign: align }}>{c.label}</div>
      ) : null}
      <div
        ref={wrapRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: justify === 'center' ? 'center' : justify === 'flex-end' ? 'flex-end' : 'flex-start',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: fontPx,
            lineHeight: lineH + 'px',
            letterSpacing: font === 'block' ? '0' : '0.04em',
            whiteSpace: 'pre',
            fontWeight: font === 'block' ? 700 : 400,
            textAlign: align,
            fontVariantNumeric: 'tabular-nums',
            userSelect: 'text'
          }}
        >
          {grid.map((rowStr, ri) => (
            <div key={ri} style={{ display: 'block', height: lineH + 'px' }}>
              {rowStr.length === 0
                ? renderCell(' ', 'sep')
                : rowStr.split('').map((ch, ci) => renderCell(ch, ci))}
            </div>
          ))}
        </div>
      </div>
      {!mini && c.showText ? (
        <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', textAlign: align, fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(text).replace(/\n/g, ' ')}</div>
      ) : null}
    </div>
  );
}

/* ---------------- METRONOME ---------------- */
function MetronomeW({ config: c, accent, s, fontStack, mini }) {
  const bpm = Math.min(240, Math.max(30, c.bpm || 120));
  const sig = c.timeSignature || '4/4';
  const beatsPerBar = Math.max(1, parseInt(String(sig).split('/')[0], 10) || 4);
  const soundOn = c.sound !== false;

  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);
  const [side, setSide] = useState(-1);

  const acRef = useRef(null);
  const timerRef = useRef(null);
  const beatRef = useRef(0);

  const interval = 60000 / bpm;

  const click = useCallback((accentBeat) => {
    if (!soundOn) return;
    try {
      let ac = acRef.current;
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        acRef.current = ac;
      }
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square';
      osc.frequency.value = accentBeat ? 1500 : 950;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(accentBeat ? 0.32 : 0.18, t + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }, [soundOn]);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    beatRef.current = 0;
    setBeat(0);
    setSide(-1);
    click(true);
    setSide(1);
    timerRef.current = setInterval(() => {
      beatRef.current = (beatRef.current + 1) % beatsPerBar;
      const b = beatRef.current;
      setBeat(b);
      setSide(p => -p);
      click(b === 0);
    }, interval);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [running, interval, beatsPerBar, click]);

  const toggle = () => setRunning(r => !r);

  // Pendulum geometry
  const W = 132 * s, H = 108 * s;
  const cx = W / 2, pivotY = H - 10 * s, len = H - 30 * s;
  const ang = (running ? side : 0) * 24; // degrees
  const swingDur = running ? (interval / 1000) : 0.4;

  const bob = (() => {
    const rad = (ang * Math.PI) / 180;
    return { x: cx + Math.sin(rad) * len, y: pivotY - Math.cos(rad) * len };
  })();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 16 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s }}>
        <div style={{ fontSize: 32 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{bpm}</div>
        <div style={{ fontSize: 11 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>bpm</div>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <line x1={cx} y1={pivotY} x2={bob.x} y2={bob.y} stroke="var(--w-line)" strokeWidth={2.5 * s} strokeLinecap="round"
          style={{ transition: `all ${swingDur}s ${running ? 'ease-in-out' : 'ease-out'}` }} />
        <circle cx={bob.x} cy={bob.y} r={9 * s} fill={accent}
          style={{ transition: `all ${swingDur}s ${running ? 'ease-in-out' : 'ease-out'}` }} />
        <circle cx={cx} cy={pivotY} r={4 * s} fill="var(--w-fg)" />
        <rect x={cx - 22 * s} y={pivotY + 1 * s} width={44 * s} height={5 * s} rx={2.5 * s} fill="var(--w-line)" />
      </svg>

      <div style={{ display: 'flex', gap: 6 * s }}>
        {Array.from({ length: beatsPerBar }).map((_, i) => {
          const active = running && i === beat;
          const isOne = i === 0;
          return (
            <span key={i} style={{
              width: (isOne ? 9 : 7) * s, height: (isOne ? 9 : 7) * s, borderRadius: 99,
              background: active ? accent : (isOne ? 'var(--w-mut)' : 'var(--w-line)'),
              transform: active ? 'scale(1.35)' : 'scale(1)',
              transition: 'transform 0.12s ease, background 0.12s ease',
              alignSelf: 'center'
            }} />
          );
        })}
      </div>

      {!mini && (
        <button onClick={toggle} style={{
          height: 34 * s, padding: `0 ${18 * s}px`, borderRadius: 8 * s, border: 'none',
          background: running ? 'var(--w-line)' : accent, color: running ? 'var(--w-fg)' : onColor(accent),
          fontSize: 13 * s, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 * s,
          fontFamily: fontStack
        }}>
          <Icon name={running ? 'pause' : 'play'} size={13 * s} color={running ? 'var(--w-fg)' : onColor(accent)} />
          {running ? 'Stop' : 'Start'}
        </button>
      )}
    </div>
  );
}

/* ---------------- GRADIENT MESH ---------------- */
function GradientMeshW({ config: c, accent, s, fontStack, mini }) {
  const palette = (Array.isArray(c.colors) && c.colors.length ? c.colors : ['#C2417B', '#2A6FDB', '#1F8A5B']).filter(Boolean);
  const colors = palette.length ? palette : [accent];
  const speed = typeof c.speed === 'number' ? c.speed : 1;
  const grain = c.grain !== false;
  const label = (c.label || '').trim();

  const now = useNow(speed > 0, 50);
  const t = (now.getTime() / 1000) * speed * 0.18;

  // Stable per-color motion seeds derived from index — deterministic, no Math.random in render path.
  const blobs = useMemo(() => {
    const seed = (n) => {
      const x = Math.sin(n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    return colors.map((col, i) => {
      const a = seed(i + 1);
      const b = seed(i + 7.3);
      const d = seed(i + 3.1);
      return {
        col,
        cx: 0.18 + a * 0.64,
        cy: 0.18 + b * 0.64,
        rx: 0.34 + d * 0.22,
        ry: 0.30 + a * 0.24,
        px: 0.5 + b * 0.7,
        py: 0.42 + d * 0.7,
        phx: a * Math.PI * 2,
        phy: b * Math.PI * 2
      };
    });
  }, [colors.join(',')]);

  const uid = useMemo(() => 'gm' + Math.floor(Math.random() * 1e9).toString(36), []);

  const base = colors.length > 2 ? colors[2] : (colors[0] || accent);
  const darkBase = mix(base, '#0b0d12', 0.74);

  const stops = blobs.map((blb, i) => {
    const cx = blb.cx + Math.sin(t * blb.px + blb.phx) * 0.18;
    const cy = blb.cy + Math.cos(t * blb.py + blb.phy) * 0.18;
    return { ...blb, x: clamp(cx, 0.05, 0.95), y: clamp(cy, 0.05, 0.95) };
  });

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function hx(h) {
    let v = (h || '').replace('#', '');
    if (v.length === 3) v = v.split('').map(ch => ch + ch).join('');
    const n = parseInt(v || '000000', 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, amt) {
    const A = hx(a), B = hx(b);
    const r = Math.round(A[0] + (B[0] - A[0]) * amt);
    const g = Math.round(A[1] + (B[1] - A[1]) * amt);
    const bl = Math.round(A[2] + (B[2] - A[2]) * amt);
    return '#' + [r, g, bl].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function rgba(h, al) { const [r, g, b] = hx(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + al + ')'; }

  const textTone = luminance(base) > 0.5 ? '#0c0e14' : '#ffffff';

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRadius: 'inherit', fontFamily: fontStack }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          {stops.map((b, i) => (
            <radialGradient key={'g' + i} id={uid + '-r' + i} cx={b.x} cy={b.y} r={Math.max(b.rx, b.ry)} gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor={rgba(b.col, 0.95)} />
              <stop offset="45%" stopColor={rgba(b.col, 0.55)} />
              <stop offset="100%" stopColor={rgba(b.col, 0)} />
            </radialGradient>
          ))}
          <filter id={uid + '-blur'}><feGaussianBlur stdDeviation="6" /></filter>
          <filter id={uid + '-grain'}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
          </filter>
          <linearGradient id={uid + '-veil'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={rgba('#000000', 0)} />
            <stop offset="100%" stopColor={rgba('#000000', label ? 0.34 : 0.16)} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill={darkBase} />
        <g filter={'url(#' + uid + '-blur)'}>
          {stops.map((b, i) => (
            <rect key={'rb' + i} x="-10" y="-10" width="120" height="120" fill={'url(#' + uid + '-r' + i + ')'} style={{ mixBlendMode: 'screen' }} />
          ))}
        </g>
        <rect x="0" y="0" width="100" height="100" fill={'url(#' + uid + '-veil)'} />
        {grain ? <rect x="0" y="0" width="100" height="100" filter={'url(#' + uid + '-grain)'} opacity="0.5" style={{ mixBlendMode: 'overlay' }} /> : null}
      </svg>

      {label ? (
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 22 * s, maxWidth: '88%' }}>
          <div style={{ fontSize: 25 * s, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.08, color: textTone, textShadow: textTone === '#ffffff' ? '0 1px 16px rgba(0,0,0,0.35)' : 'none' }}>{label}</div>
          {c.sublabel ? <div style={{ marginTop: 7 * s, fontSize: 12.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: textTone, opacity: 0.78 }}>{c.sublabel}</div> : null}
        </div>
      ) : null}

      {!mini && c.dots !== false ? (
        <div style={{ position: 'absolute', bottom: 11 * s, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 * s, zIndex: 1 }}>
          {colors.slice(0, 6).map((col, i) => (
            <span key={'d' + i} style={{ width: 6 * s, height: 6 * s, borderRadius: 99, background: col, boxShadow: '0 0 0 1px rgba(255,255,255,0.25)' }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- STARFIELD ---------------- */
function StarfieldW({ config: c, accent, s, fontStack, mini }) {
  const count = Math.max(20, Math.min(400, c.particles || 120));
  const starColor = c.starColor || '#ffffff';
  const speed = typeof c.speed === 'number' ? c.speed : 0.5;
  const twinkle = c.twinkle !== false;
  const shooting = c.shooting !== false;

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const starsRef = useRef(null);
  const shootRef = useRef([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef(0);

  const hexToRgb = (hex) => {
    let h = (hex || '#ffffff').replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const star = hexToRgb(starColor);
  const acc = hexToRgb(accent);

  const buildStars = (w, h) => {
    const arr = new Array(count);
    for (let i = 0; i < count; i++) {
      const depth = Math.random();
      arr[i] = {
        x: Math.random() * w,
        y: Math.random() * h,
        depth,
        r: (0.4 + depth * 1.5),
        tw: Math.random() * Math.PI * 2,
        twS: 0.6 + Math.random() * 1.6,
        tint: Math.random() < 0.18
      };
    }
    starsRef.current = arr;
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext('2d');
    let mounted = true;
    let last = performance.now();
    let nextShoot = 2000 + Math.random() * 4000;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      sizeRef.current = { w, h, dpr };
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!starsRef.current) buildStars(w, h);
    };
    resize();
    const ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', resize);

    const draw = (t) => {
      if (!mounted) return;
      let dt = (t - last) / 16.6667;
      last = t;
      if (dt > 4) dt = 4;
      const { w, h } = sizeRef.current;
      const stars = starsRef.current || [];

      ctx.clearRect(0, 0, w, h);

      const drift = speed * dt;
      for (let i = 0; i < stars.length; i++) {
        const st = stars[i];
        st.y += drift * (0.25 + st.depth * 1.1);
        if (st.y > h + 2) { st.y = -2; st.x = Math.random() * w; }
        let a = 0.35 + st.depth * 0.55;
        if (twinkle) {
          st.tw += st.twS * 0.04 * dt;
          a *= 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(st.tw));
        }
        const col = st.tint ? acc : star;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, 6.283185);
        ctx.fillStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + a.toFixed(3) + ')';
        ctx.fill();
      }

      if (shooting) {
        nextShoot -= dt * 16.6667;
        if (nextShoot <= 0 && shootRef.current.length < 2) {
          nextShoot = 4000 + Math.random() * 7000;
          const fromLeft = Math.random() < 0.5;
          shootRef.current.push({
            x: fromLeft ? -20 : w + 20,
            y: Math.random() * h * 0.5,
            vx: (fromLeft ? 1 : -1) * (3.4 + Math.random() * 1.6),
            vy: 1.6 + Math.random() * 1.2,
            life: 1
          });
        }
        const sh = shootRef.current;
        for (let i = sh.length - 1; i >= 0; i--) {
          const m = sh[i];
          m.x += m.vx * dt * 3;
          m.y += m.vy * dt * 3;
          m.life -= 0.012 * dt;
          if (m.life <= 0 || m.x < -60 || m.x > w + 60 || m.y > h + 60) { sh.splice(i, 1); continue; }
          const tx = m.x - m.vx * 9, ty = m.y - m.vy * 9;
          const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
          grad.addColorStop(0, 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',' + (m.life).toFixed(2) + ')');
          grad.addColorStop(1, 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
    };
  }, [count, starColor, accent, speed, twinkle, shooting]);

  const bgTop = lighten(accent, -0.55);
  const bgBot = lighten(accent, -0.78);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: fontStack }}>
      <div ref={wrapRef} style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden', background: 'radial-gradient(120% 100% at 50% 0%, ' + bgTop + ' 0%, ' + bgBot + ' 75%)' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(140% 120% at 50% 120%, ' + accent + '33 0%, transparent 55%)' }} />
        {c.label ? (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 16 * s, textAlign: 'center', fontSize: 11 * s, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, color: onColor(bgBot) === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>{c.label}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- LAVA LAMP ---------------- */
function LavaLampW({ config: c, accent, s, fontStack, mini }) {
  const blobColor = c.blobColor || accent || '#E0563B';
  const liquidColor = c.liquidColor || '#3a1a55';
  const count = Math.max(2, Math.min(10, c.blobCount || 6));
  const speed = c.speed || 1;

  const now = useNow(true, 50);
  const t = (now.getTime() / 1000) * speed;

  // unique filter id so multiple instances don't collide
  const uid = useRef('ll' + Math.random().toString(36).slice(2, 8)).current;

  // viewBox lamp dimensions
  const VW = 100, VH = 160;

  // lamp silhouette: narrow neck at top widening to a rounded body at bottom
  const lampPath = useMemo(() => {
    return 'M 32 6 ' +
      'C 32 4 34 3 36 3 L 64 3 C 66 3 68 4 68 6 ' +
      'L 60 40 ' +
      'C 76 52 86 78 86 108 ' +
      'C 86 138 72 152 50 152 ' +
      'C 28 152 14 138 14 108 ' +
      'C 14 78 24 52 40 40 ' +
      'Z';
  }, []);

  // stable per-blob params derived from index (deterministic, no re-randomizing)
  const blobs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const seed = i * 12.9898;
      const frac = (n) => { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); };
      const x = 30 + frac(seed) * 40;          // horizontal center 30..70
      const r = 9 + frac(seed + 1.3) * 9;      // radius 9..18
      const phase = frac(seed + 2.7) * Math.PI * 2;
      const period = 7 + frac(seed + 4.1) * 9; // seconds per rise/fall cycle
      const drift = 3 + frac(seed + 5.5) * 5;  // horizontal sway amount
      const dPer = 4 + frac(seed + 6.6) * 5;
      arr.push({ x, r, phase, period, drift, dPer });
    }
    return arr;
  }, [count]);

  // luminance check to keep highlight subtle on light liquids
  const liqLum = luminance(liquidColor);
  const glowColor = lighten(blobColor, 0.25);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 * s, boxSizing: 'border-box', fontFamily: fontStack }}>
      <div style={{ position: 'relative', height: '100%', aspectRatio: '100 / 160', maxWidth: '100%' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={uid + '-liq'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lighten(liquidColor, 0.08)} />
              <stop offset="55%" stopColor={liquidColor} />
              <stop offset="100%" stopColor={lighten(liquidColor, -0.18)} />
            </linearGradient>
            <radialGradient id={uid + '-glow'} cx="50%" cy="92%" r="60%">
              <stop offset="0%" stopColor={glowColor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={uid + '-blob'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lighten(blobColor, 0.22)} />
              <stop offset="100%" stopColor={lighten(blobColor, -0.12)} />
            </linearGradient>
            <linearGradient id={uid + '-cap'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--w-line)" />
              <stop offset="100%" stopColor="var(--w-mut)" />
            </linearGradient>
            {/* the gooey metaball filter: blur then sharpen alpha so overlaps merge */}
            <filter id={uid + '-goo'} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
              <feColorMatrix in="blur" type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
            <clipPath id={uid + '-clip'}>
              <path d={lampPath} />
            </clipPath>
          </defs>

          {/* glass body fill */}
          <path d={lampPath} fill={`url(#${uid}-liq)`} />

          <g clipPath={`url(#${uid}-clip)`}>
            {/* heat glow at the base */}
            <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-glow)`} />

            {/* gooey blobs */}
            <g filter={`url(#${uid}-goo)`}>
              {blobs.map((b, i) => {
                // vertical travel between ~44 (just under neck) and ~146 (near base)
                const topY = 46, botY = 144;
                const ph = (t / b.period) * Math.PI * 2 + b.phase;
                const yN = (Math.sin(ph) + 1) / 2; // 0..1, 0=top
                // ease so blobs linger at extremes like real lava
                const eased = yN * yN * (3 - 2 * yN);
                const cy = topY + (botY - topY) * eased;
                const cx = b.x + Math.sin((t / b.dPer) * Math.PI * 2 + b.phase) * b.drift;
                // squash slightly based on vertical speed direction for organic feel
                const sp = Math.cos(ph);
                const rx = b.r * (1 + sp * 0.06);
                const ry = b.r * (1 - sp * 0.06);
                return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-blob)`} />;
              })}
              {/* a couple of small drifting droplets for liveliness */}
              {[0, 1].map((i) => {
                const ph = (t / (5 + i * 3)) * Math.PI * 2 + i * 2.1;
                const yN = (Math.sin(ph) + 1) / 2;
                const cy = 50 + (140 - 50) * yN;
                const cx = 40 + i * 22 + Math.sin(t / 3 + i) * 4;
                return <circle key={'d' + i} cx={cx} cy={cy} r={4.5} fill={`url(#${uid}-blob)`} />;
              })}
            </g>

            {/* glass highlight streak */}
            <path d="M 26 50 C 22 78 22 110 30 138" fill="none"
              stroke="#ffffff" strokeOpacity={liqLum > 0.55 ? 0.18 : 0.28} strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 70 56 C 74 82 74 108 68 132" fill="none"
              stroke="#ffffff" strokeOpacity={liqLum > 0.55 ? 0.08 : 0.12} strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* glass outline */}
          <path d={lampPath} fill="none" stroke="var(--w-line)" strokeWidth="1.4" />

          {/* top cap / cone */}
          <path d="M 30 6 L 70 6 L 64 -2 C 64 -5 60 -7 50 -7 C 40 -7 36 -5 36 -2 Z"
            fill={`url(#${uid}-cap)`} stroke="var(--w-line)" strokeWidth="1" />

          {/* base */}
          <path d="M 30 150 C 30 146 34 145 50 145 C 66 145 70 146 70 150 L 76 162 C 76 166 70 168 50 168 C 30 168 24 166 24 162 Z"
            fill={`url(#${uid}-cap)`} stroke="var(--w-line)" strokeWidth="1" />
          {/* base ridges */}
          <line x1="32" y1="156" x2="68" y2="156" stroke="var(--w-line)" strokeWidth="0.8" strokeOpacity="0.6" />
        </svg>

        {c.label ? (
          <div style={{ position: 'absolute', bottom: -6 * s, left: 0, right: 0, textAlign: 'center', fontSize: 10.5 * s, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, transform: 'translateY(100%)' }}>{c.label}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- IMAGE GALLERY ---------------- */
function ImageGalleryW({ config: c, accent, s, fontStack, mini }) {
  const imgs = useMemo(() => {
    const raw = Array.isArray(c.images) ? c.images : [];
    return raw.map(it => typeof it === 'string' ? { url: it, caption: '' } : { url: (it && it.url) || '', caption: (it && it.caption) || '' }).filter(it => it.url);
  }, [c.images]);
  const layout = c.layout || 'carousel';
  const autoplay = c.autoplay !== false;
  const showCaptions = !!c.captions;
  const speed = Math.max(2, c.speed || 4) * 1000;

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = imgs.length;
  const safeIdx = n ? ((idx % n) + n) % n : 0;

  useEffect(() => { if (idx >= n && n) setIdx(0); }, [n, idx]);

  const live = (layout === 'carousel' || layout === 'slideshow') && autoplay && !paused && n > 1 && !mini;
  const tick = useNow(live, speed);
  const lastRef = useRef(0);
  useEffect(() => {
    if (!live) return;
    const t = tick.getTime();
    if (t !== lastRef.current) { lastRef.current = t; setIdx(i => i + 1); }
  }, [tick, live]);

  const go = (d) => setIdx(i => i + d);
  const goto = (i) => setIdx(i);

  const Empty = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 * s, padding: 20 * s, textAlign: 'center' }}>
      <div style={{ width: 46 * s, height: 46 * s, borderRadius: 12 * s, display: 'grid', placeItems: 'center', background: 'var(--w-line)', color: 'var(--w-mut)' }}>
        <svg width={24 * s} height={24 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2.5" />
          <circle cx="8.5" cy="8.5" r="1.6" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <div style={{ fontSize: 13.5 * s, fontWeight: 600, color: 'var(--w-fg)' }}>No images yet</div>
      <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', maxWidth: 200 * s, lineHeight: 1.4 }}>Add image URLs in the widget settings to build your album.</div>
    </div>
  );

  const Caption = ({ text }) => {
    if (!showCaptions || !text) return null;
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: `${18 * s}px ${12 * s}px ${10 * s}px`, background: 'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))', color: '#fff', fontSize: 12 * s, fontWeight: 500, lineHeight: 1.35, pointerEvents: 'none' }}>
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{text}</span>
      </div>
    );
  };

  const Frame = ({ item, fit }) => (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--w-line)' }}>
      <img src={item.url} alt={item.caption || ''} draggable={false} style={{ width: '100%', height: '100%', objectFit: fit || 'cover', display: 'block' }} />
      <Caption text={item.caption} />
    </div>
  );

  const NavBtn = ({ dir }) => (
    <button onClick={() => go(dir)} aria-label={dir < 0 ? 'Previous' : 'Next'} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [dir < 0 ? 'left' : 'right']: 8 * s, width: 30 * s, height: 30 * s, borderRadius: 99, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)', color: '#fff', border: 'none', cursor: 'pointer', zIndex: 3 }}>
      <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {dir < 0 ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );

  const Dots = () => (
    <div style={{ display: 'flex', gap: 6 * s, alignItems: 'center', justifyContent: 'center' }}>
      {imgs.map((_, i) => {
        const on = i === safeIdx;
        return <button key={i} onClick={() => goto(i)} aria-label={'Go to image ' + (i + 1)} style={{ width: (on ? 18 : 6) * s, height: 6 * s, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0, background: on ? accent : 'var(--w-line)', transition: 'width 0.28s ease, background 0.28s ease' }} />;
      })}
    </div>
  );

  if (n === 0) return <Empty />;

  if (layout === 'grid') {
    const cols = n <= 1 ? 1 : (n <= 4 ? 2 : 3);
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 * s, alignContent: 'center' }}>
          {imgs.map((item, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 10 * s, overflow: 'hidden', aspectRatio: '1 / 1', background: 'var(--w-line)' }}>
              <img src={item.url} alt={item.caption || ''} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <Caption text={item.caption} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const slideshow = layout === 'slideshow';

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 * s, padding: 12 * s, fontFamily: fontStack, boxSizing: 'border-box' }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, borderRadius: 14 * s, overflow: 'hidden', background: 'var(--w-line)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {imgs.map((item, i) => {
          const active = i === safeIdx;
          return (
            <div key={i} style={{ position: 'absolute', inset: 0, opacity: active ? 1 : 0, transform: slideshow ? 'none' : `scale(${active ? 1 : 1.04})`, transition: 'opacity 0.6s ease, transform 0.7s ease', zIndex: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}>
              <Frame item={item} fit={slideshow ? 'contain' : 'cover'} />
            </div>
          );
        })}
        {!mini && n > 1 && layout === 'carousel' ? <><NavBtn dir={-1} /><NavBtn dir={1} /></> : null}
        <div style={{ position: 'absolute', top: 8 * s, right: 8 * s, padding: `${3 * s}px ${7 * s}px`, borderRadius: 99, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10.5 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums', zIndex: 3 }}>{safeIdx + 1}/{n}</div>
      </div>
      {n > 1 ? <Dots /> : null}
    </div>
  );
}

/* ---------------- VISITED PLACES ---------------- */
function VisitedMapW({ config: c, accent, s, fontStack, mini }) {
  const hi = c.highlight || accent || '#1F8A5B';
  const showCount = c.showCount !== false;

  const COUNTRIES = useMemo(() => [
    { id: 'US', name: 'United States', path: 'M40 58 L92 56 L96 64 L86 74 L72 80 L58 78 L46 70 Z' },
    { id: 'CA', name: 'Canada', path: 'M44 38 L102 36 L100 52 L92 54 L48 56 L42 48 Z' },
    { id: 'MX', name: 'Mexico', path: 'M58 80 L74 80 L80 88 L74 96 L66 92 L60 86 Z' },
    { id: 'BR', name: 'Brazil', path: 'M108 108 L130 104 L138 116 L132 134 L118 138 L110 124 Z' },
    { id: 'AR', name: 'Argentina', path: 'M110 138 L124 136 L122 154 L114 166 L108 152 Z' },
    { id: 'CL', name: 'Chile', path: 'M104 130 L110 132 L110 162 L104 158 Z' },
    { id: 'PE', name: 'Peru', path: 'M98 110 L110 112 L110 124 L100 122 Z' },
    { id: 'CO', name: 'Colombia', path: 'M98 96 L110 98 L110 110 L98 108 Z' },
    { id: 'GB', name: 'United Kingdom', path: 'M172 50 L178 48 L180 56 L174 58 Z' },
    { id: 'FR', name: 'France', path: 'M176 58 L186 58 L188 68 L178 70 L174 64 Z' },
    { id: 'ES', name: 'Spain', path: 'M166 66 L178 66 L180 74 L168 76 L164 70 Z' },
    { id: 'PT', name: 'Portugal', path: 'M162 68 L166 68 L166 76 L162 76 Z' },
    { id: 'IT', name: 'Italy', path: 'M186 66 L192 64 L196 78 L190 78 L188 70 Z' },
    { id: 'DE', name: 'Germany', path: 'M186 52 L196 52 L198 62 L188 64 L184 58 Z' },
    { id: 'NL', name: 'Netherlands', path: 'M183 50 L189 50 L189 55 L183 55 Z' },
    { id: 'CH', name: 'Switzerland', path: 'M185 62 L191 62 L191 66 L185 66 Z' },
    { id: 'NO', name: 'Norway', path: 'M188 34 L196 32 L200 48 L192 50 L188 40 Z' },
    { id: 'SE', name: 'Sweden', path: 'M196 36 L204 36 L204 52 L196 52 Z' },
    { id: 'PL', name: 'Poland', path: 'M198 52 L210 52 L210 60 L198 60 Z' },
    { id: 'GR', name: 'Greece', path: 'M200 70 L210 70 L210 78 L200 78 Z' },
    { id: 'TR', name: 'Turkey', path: 'M210 66 L230 66 L230 74 L210 74 Z' },
    { id: 'EG', name: 'Egypt', path: 'M206 84 L220 84 L220 96 L206 96 Z' },
    { id: 'MA', name: 'Morocco', path: 'M160 80 L176 80 L176 90 L160 90 Z' },
    { id: 'ZA', name: 'South Africa', path: 'M196 138 L214 138 L216 150 L200 152 L194 144 Z' },
    { id: 'KE', name: 'Kenya', path: 'M218 108 L228 108 L228 118 L218 118 Z' },
    { id: 'NG', name: 'Nigeria', path: 'M184 100 L198 100 L198 110 L184 110 Z' },
    { id: 'RU', name: 'Russia', path: 'M210 36 L320 32 L322 52 L260 56 L212 54 Z' },
    { id: 'IN', name: 'India', path: 'M252 86 L272 84 L276 100 L262 110 L252 96 Z' },
    { id: 'CN', name: 'China', path: 'M268 60 L312 58 L314 78 L286 82 L268 74 Z' },
    { id: 'JP', name: 'Japan', path: 'M324 66 L332 62 L336 76 L328 80 L324 72 Z' },
    { id: 'KR', name: 'South Korea', path: 'M314 70 L322 70 L322 78 L314 78 Z' },
    { id: 'TH', name: 'Thailand', path: 'M288 96 L298 96 L298 110 L288 108 Z' },
    { id: 'VN', name: 'Vietnam', path: 'M296 94 L304 96 L304 112 L298 110 Z' },
    { id: 'ID', name: 'Indonesia', path: 'M292 116 L320 116 L322 126 L294 126 Z' },
    { id: 'AU', name: 'Australia', path: 'M300 132 L336 130 L340 150 L312 156 L298 144 Z' },
    { id: 'NZ', name: 'New Zealand', path: 'M344 152 L352 150 L354 162 L346 164 Z' },
    { id: 'AE', name: 'UAE', path: 'M236 88 L244 88 L244 94 L236 94 Z' },
    { id: 'SA', name: 'Saudi Arabia', path: 'M222 84 L240 84 L242 98 L226 100 L220 92 Z' },
    { id: 'IS', name: 'Iceland', path: 'M158 38 L168 38 L168 44 L158 44 Z' },
    { id: 'IE', name: 'Ireland', path: 'M166 50 L172 50 L172 56 L166 56 Z' }
  ], []);

  const byId = useMemo(() => {
    const m = {}; COUNTRIES.forEach(co => { m[co.id] = co; }); return m;
  }, [COUNTRIES]);

  const cfgList = Array.isArray(c.countries) ? c.countries : [];

  const [local, setLocal] = useState(() => {
    try {
      const raw = localStorage.getItem('nc_visitedMap_countries');
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
    } catch (e) {}
    return cfgList;
  });

  const cfgKey = cfgList.join(',');
  const firstCfg = useRef(true);
  useEffect(() => {
    if (firstCfg.current) { firstCfg.current = false; return; }
    setLocal(cfgList);
  }, [cfgKey]);

  useEffect(() => {
    try { localStorage.setItem('nc_visitedMap_countries', JSON.stringify(local)); } catch (e) {}
  }, [local]);

  const visited = useMemo(() => {
    const set = {}; local.forEach(id => { if (byId[id]) set[id] = true; }); return set;
  }, [local, byId]);

  const count = Object.keys(visited).length;
  const total = COUNTRIES.length;

  const [hover, setHover] = useState(null);

  const toggle = useCallback((id) => {
    if (mini) return;
    setLocal(p => p.indexOf(id) >= 0 ? p.filter(x => x !== id) : [...p, id]);
  }, [mini]);

  const hoverName = hover ? (byId[hover] ? byId[hover].name : null) : null;
  const pct = total ? Math.round((count / total) * 100) : 0;

  const seaFill = 'var(--w-line)';
  const landIdle = `color-mix(in srgb, var(--w-fg) 12%, transparent)`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 * s, padding: `${12 * s}px ${15 * s}px`, fontFamily: fontStack, color: 'var(--w-fg)' }}>
      {showCount ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', gap: 8 * s }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s }}>
            <span style={{ fontSize: 25 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', color: hi, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            <span style={{ fontSize: 10.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{count === 1 ? 'place' : 'places'} visited</span>
          </div>
          <span style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pct}% · {count}/{total}</span>
        </div>
      ) : null}

      <div style={{ position: 'relative', width: '100%', maxWidth: 400 * s, alignSelf: 'center', lineHeight: 0 }}>
        <svg viewBox="0 0 360 180" width="100%" style={{ display: 'block', overflow: 'visible', maxWidth: 360 * s, margin: '0 auto' }}>
          <rect x="0" y="0" width="360" height="180" rx="10" fill={seaFill} opacity="0.35" />
          {[36, 72, 108, 144].map(y => (
            <line key={'h' + y} x1="0" y1={y} x2="360" y2={y} stroke="var(--w-line)" strokeWidth="0.5" opacity="0.5" />
          ))}
          {[90, 180, 270].map(x => (
            <line key={'v' + x} x1={x} y1="0" x2={x} y2="180" stroke="var(--w-line)" strokeWidth="0.5" opacity="0.5" />
          ))}
          {COUNTRIES.map(co => {
            const on = !!visited[co.id];
            const isHover = hover === co.id;
            return (
              <path
                key={co.id}
                d={co.path}
                onClick={() => toggle(co.id)}
                onMouseEnter={() => setHover(co.id)}
                onMouseLeave={() => setHover(h => h === co.id ? null : h)}
                fill={on ? hi : landIdle}
                stroke={on ? hi : 'var(--w-line)'}
                strokeWidth={on ? 1 : 0.6}
                strokeLinejoin="round"
                style={{
                  cursor: mini ? 'default' : 'pointer',
                  opacity: isHover ? (on ? 0.85 : 0.6) : 1,
                  transition: 'fill 0.25s ease, opacity 0.15s ease'
                }}
              />
            );
          })}
        </svg>

        {hoverName ? (
          <div style={{ position: 'absolute', top: 4 * s, left: '50%', transform: 'translateX(-50%)', padding: `${3 * s}px ${9 * s}px`, borderRadius: 6 * s, background: visited[hover] ? hi : 'var(--w-fg)', color: onColor(visited[hover] ? hi : '#222'), fontSize: 11 * s, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
            {hoverName}
          </div>
        ) : null}
      </div>

      {showCount && !mini ? (
        <div style={{ width: '100%', maxWidth: 400 * s, alignSelf: 'center', height: 5 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: hi, transition: 'width 0.4s ease' }} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- AMBIENT PLAYER ---------------- */
function AmbientPlayerW({ config: c, accent, s, fontStack, mini }) {
  const theme = c.theme || 'warm';
  const initMix = Array.isArray(c.mix) && c.mix.length ? c.mix : ['cafe', 'rain'];
  const initVol = typeof c.volume === 'number' ? c.volume : 0.6;

  const SOUNDS = useMemo(() => [
    { id: 'cafe',  label: 'Café',    icon: 'M4 4h12v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V4zM16 5h2a2 2 0 0 1 0 4h-2M3 15h14' },
    { id: 'rain',  label: 'Rain',    icon: 'M6 13a4 4 0 0 1 1-7.5A5 5 0 0 1 17 7a3.5 3.5 0 0 1-.5 7H6zM7 17l-1 2M11 17l-1 2M15 17l-1 2' },
    { id: 'city',  label: 'City',    icon: 'M3 19V8l4-2v13M9 19V4l5-1v16M16 19v-8l3 1v7M2 19h18' },
    { id: 'waves', label: 'Waves',   icon: 'M2 9c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2M2 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2' },
    { id: 'fire',  label: 'Fire',    icon: 'M10 2c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-2-1-3 2 1 3 3 3 5a6 6 0 1 1-12 0c0-4 4-5 6-9z' },
    { id: 'wind',  label: 'Wind',    icon: 'M2 7h11a2.5 2.5 0 1 0-2.5-2.5M2 12h15a2.5 2.5 0 1 1-2.5 2.5M2 17h9a2 2 0 1 0-2 2' },
  ], []);

  const themes = {
    warm:  { bg1: '#2a1c20', bg2: '#3a2228', fg: '#f3e3df', mut: '#c8a99f' },
    cool:  { bg1: '#18222e', bg2: '#1f2e3c', fg: '#e2edf5', mut: '#9fb6c8' },
    forest:{ bg1: '#162420', bg2: '#1d3329', fg: '#e0f0e6', mut: '#9fc4ac' },
    night: { bg1: '#1a1a22', bg2: '#23232e', fg: '#e8e6f0', mut: '#a8a4bc' },
  };
  const T = themes[theme] || themes.warm;

  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(() => {
    try { const v = localStorage.getItem('nc_ambientPlayer_vol'); return v != null ? +v : initVol; } catch (e) { return initVol; }
  });
  const [active, setActive] = useState(() => {
    try { const v = JSON.parse(localStorage.getItem('nc_ambientPlayer_mix')); return Array.isArray(v) ? v : initMix; } catch (e) { return initMix; }
  });

  useEffect(() => { try { localStorage.setItem('nc_ambientPlayer_vol', String(vol)); } catch (e) {} }, [vol]);
  useEffect(() => { try { localStorage.setItem('nc_ambientPlayer_mix', JSON.stringify(active)); } catch (e) {} }, [active]);

  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const nodesRef = useRef({});

  const ensureCtx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = vol;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    return ctxRef.current;
  }, [vol]);

  const makeNoiseBuffer = useCallback((ctx) => {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }, []);

  const buildVoice = useCallback((ctx, master, id) => {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(master);
    const parts = [];

    const noiseSrc = () => {
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx);
      src.loop = true;
      return src;
    };

    if (id === 'rain') {
      const src = noiseSrc();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
      src.connect(hp); hp.connect(lp); lp.connect(out); src.start();
      parts.push(src);
    } else if (id === 'cafe') {
      const src = noiseSrc();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
      const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 400;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.25;
      const lfoG = ctx.createGain(); lfoG.gain.value = 200;
      lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      src.connect(lp); lp.connect(lp2); lp2.connect(out); src.start();
      parts.push(src, lfo);
    } else if (id === 'city') {
      const src = noiseSrc();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      const hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 70;
      const humG = ctx.createGain(); humG.gain.value = 0.04;
      hum.connect(humG); humG.connect(out); hum.start();
      src.connect(lp); lp.connect(out); src.start();
      parts.push(src, hum);
    } else if (id === 'waves') {
      const src = noiseSrc();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const swell = ctx.createGain(); swell.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.45;
      lfo.connect(lfoG); lfoG.connect(swell.gain); lfo.start();
      src.connect(lp); lp.connect(swell); swell.connect(out); src.start();
      parts.push(src, lfo);
    } else if (id === 'fire') {
      const src = noiseSrc();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
      const crackle = ctx.createGain(); crackle.gain.value = 0.6;
      const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 7;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.35;
      lfo.connect(lfoG); lfoG.connect(crackle.gain); lfo.start();
      src.connect(lp); lp.connect(crackle); crackle.connect(out); src.start();
      parts.push(src, lfo);
    } else if (id === 'wind') {
      const src = noiseSrc();
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15;
      const lfoG = ctx.createGain(); lfoG.gain.value = 300;
      lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
      src.connect(bp); bp.connect(out); src.start();
      parts.push(src, lfo);
    } else {
      const src = noiseSrc();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1000;
      src.connect(lp); lp.connect(out); src.start();
      parts.push(src);
    }
    return { out, parts };
  }, [makeNoiseBuffer]);

  const stopAll = useCallback(() => {
    const ctx = ctxRef.current;
    const map = nodesRef.current;
    Object.keys(map).forEach((id) => {
      const v = map[id];
      try {
        if (ctx) v.out.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        v.parts.forEach((p) => { try { p.stop(ctx.currentTime + 0.4); } catch (e) {} });
      } catch (e) {}
    });
    nodesRef.current = {};
  }, []);

  // sync voices to active+playing
  useEffect(() => {
    if (!playing) { stopAll(); return; }
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const master = masterRef.current;
    const map = nodesRef.current;
    const target = 0.85;
    active.forEach((id) => {
      if (!map[id]) {
        const v = buildVoice(ctx, master, id);
        v.out.gain.setTargetAtTime(target, ctx.currentTime, 0.5);
        map[id] = v;
      }
    });
    Object.keys(map).forEach((id) => {
      if (!active.includes(id)) {
        const v = map[id];
        try {
          v.out.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
          v.parts.forEach((p) => { try { p.stop(ctx.currentTime + 0.5); } catch (e) {} });
        } catch (e) {}
        delete map[id];
      }
    });
  }, [playing, active, ensureCtx, buildVoice, stopAll]);

  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(vol, ctxRef.current.currentTime, 0.05);
    }
  }, [vol]);

  useEffect(() => () => {
    try { stopAll(); if (ctxRef.current) ctxRef.current.close(); } catch (e) {}
  }, [stopAll]);

  const now = useNow(playing, 90);
  const t = now.getTime() / 1000;

  const toggleSound = (id) => {
    setActive((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const fg = T.fg, mut = T.mut;
  const cardPad = 18 * s;
  const activeCount = active.length;

  const Equalizer = () => {
    const bars = 5;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 * s, height: 16 * s }}>
        {Array.from({ length: bars }).map((_, i) => {
          const h = playing && activeCount > 0
            ? 0.3 + 0.7 * Math.abs(Math.sin(t * (1.6 + i * 0.45) + i))
            : 0.18;
          return <span key={i} style={{ width: 2.5 * s, height: `${h * 100}%`, background: accent, borderRadius: 2 * s, transition: 'height 90ms linear' }} />;
        })}
      </div>
    );
  };

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      gap: 14 * s, padding: cardPad,
      background: `radial-gradient(120% 120% at 30% 0%, ${T.bg2} 0%, ${T.bg1} 70%)`,
      borderRadius: 'inherit', fontFamily: fontStack, color: fg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s, minWidth: 0 }}>
          <div style={{ fontSize: 14.5 * s, fontWeight: 650, letterSpacing: '-0.01em' }}>{c.title || 'Ambient'}</div>
          <div style={{ fontSize: 11 * s, color: mut, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeCount === 0 ? 'no sounds' : active.map((id) => (SOUNDS.find((x) => x.id === id) || {}).label || id).join(' · ')}
          </div>
        </div>
        <Equalizer />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 * s }}>
        {SOUNDS.map((sd) => {
          const on = active.includes(sd.id);
          return (
            <button key={sd.id} onClick={() => toggleSound(sd.id)} title={sd.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 5 * s, padding: `${9 * s}px ${4 * s}px`, borderRadius: 11 * s, cursor: 'pointer',
              background: on ? accent : 'rgba(255,255,255,0.05)',
              border: `1px solid ${on ? accent : 'rgba(255,255,255,0.09)'}`,
              color: on ? onColor(accent) : fg,
              transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              boxShadow: on ? `0 4px 14px ${accent}44` : 'none',
            }}>
              <svg width={18 * s} height={18 * s} viewBox="0 0 20 20" fill="none"
                stroke={on ? onColor(accent) : mut} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={sd.icon} />
              </svg>
              <span style={{ fontSize: 9.5 * s, fontWeight: 600, opacity: on ? 1 : 0.85 }}>{sd.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 * s }}>
        {!mini && (
          <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} style={{
            width: 38 * s, height: 38 * s, flex: '0 0 auto', borderRadius: 99, cursor: 'pointer',
            display: 'grid', placeItems: 'center', background: accent, color: onColor(accent),
            border: 'none', boxShadow: `0 4px 14px ${accent}55`,
          }}>
            {playing ? (
              <svg width={15 * s} height={15 * s} viewBox="0 0 16 16" fill={onColor(accent)}>
                <rect x="3.5" y="2.5" width="3" height="11" rx="1" /><rect x="9.5" y="2.5" width="3" height="11" rx="1" />
              </svg>
            ) : (
              <svg width={15 * s} height={15 * s} viewBox="0 0 16 16" fill={onColor(accent)} style={{ marginLeft: 1.5 * s }}>
                <path d="M4 2.8v10.4a1 1 0 0 0 1.5.86l8.5-5.2a1 1 0 0 0 0-1.72L5.5 1.94A1 1 0 0 0 4 2.8z" />
              </svg>
            )}
          </button>
        )}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 * s }}>
          <svg width={14 * s} height={14 * s} viewBox="0 0 20 20" fill="none" stroke={mut} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8v4h3l4 3V5L7 8H4zM14 7a4 4 0 0 1 0 6" />
          </svg>
          <div style={{ position: 'relative', flex: 1, height: 4 * s, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${vol * 100}%`, borderRadius: 99, background: accent }} />
            <input type="range" min="0" max="1" step="0.01" value={vol}
              onChange={(e) => setVol(+e.target.value)}
              style={{ position: 'absolute', inset: 0, width: '100%', margin: 0, opacity: 0, cursor: 'pointer' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${vol * 100}%`, width: 11 * s, height: 11 * s, borderRadius: 99, background: '#fff', transform: 'translate(-50%, -50%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
          </div>
          <span style={{ fontSize: 10.5 * s, color: mut, fontVariantNumeric: 'tabular-nums', width: 26 * s, textAlign: 'right' }}>{Math.round(vol * 100)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- CALCULATOR ---------------- */
function CalculatorW({ config: c, accent, s, fontStack, mini }) {
  const mode = c.mode || 'basic';
  const precision = typeof c.precision === 'number' ? c.precision : 2;

  const round = (n) => {
    if (!isFinite(n)) return '0';
    const p = Math.pow(10, precision);
    let r = Math.round((n + Number.EPSILON) * p) / p;
    if (Object.is(r, -0)) r = 0;
    let str = r.toFixed(precision);
    if (precision > 0) str = str.replace(/\.?0+$/, '');
    return str;
  };

  const fmtNum = (str) => {
    if (str === '' || str === '-') return str;
    const neg = str.startsWith('-');
    let body = neg ? str.slice(1) : str;
    const [intPart, decPart] = body.split('.');
    const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + withSep + (decPart !== undefined ? '.' + decPart : '');
  };

  // ---- BASIC CALCULATOR ----
  function Basic() {
    const [acc, setAcc] = useState(null);
    const [op, setOp] = useState(null);
    const [cur, setCur] = useState('0');
    const [fresh, setFresh] = useState(true);
    const [hist, setHist] = useState('');

    const compute = (a, b, o) => {
      a = parseFloat(a); b = parseFloat(b);
      if (o === '+') return a + b;
      if (o === '-') return a - b;
      if (o === '×') return a * b;
      if (o === '÷') return b === 0 ? NaN : a / b;
      return b;
    };

    const inputDigit = (d) => {
      if (fresh) { setCur(d); setFresh(false); return; }
      if (cur === '0') { setCur(d); return; }
      if (cur.replace(/[-.]/g, '').length >= 12) return;
      setCur(cur + d);
    };
    const inputDot = () => {
      if (fresh) { setCur('0.'); setFresh(false); return; }
      if (!cur.includes('.')) setCur(cur + '.');
    };
    const toggleSign = () => {
      if (cur === '0' || cur === 'Error') return;
      setCur(cur.startsWith('-') ? cur.slice(1) : '-' + cur);
    };
    const percent = () => {
      const v = parseFloat(cur) / 100;
      setCur(round(v)); setFresh(true);
    };
    const clearAll = () => { setAcc(null); setOp(null); setCur('0'); setFresh(true); setHist(''); };
    const chooseOp = (o) => {
      if (cur === 'Error') return;
      if (op !== null && !fresh && acc !== null) {
        const r = compute(acc, cur, op);
        if (!isFinite(r)) { clearAll(); setCur('Error'); return; }
        const rr = round(r);
        setAcc(rr); setCur(rr); setHist(fmtNum(rr) + ' ' + o);
      } else {
        setAcc(cur); setHist(fmtNum(cur) + ' ' + o);
      }
      setOp(o); setFresh(true);
    };
    const equals = () => {
      if (op === null || acc === null) return;
      const r = compute(acc, cur, op);
      if (!isFinite(r)) { clearAll(); setCur('Error'); return; }
      const rr = round(r);
      setHist(fmtNum(acc) + ' ' + op + ' ' + fmtNum(cur) + ' =');
      setCur(rr); setAcc(null); setOp(null); setFresh(true);
    };

    const Key = ({ label, on, kind, span }) => {
      const bg = kind === 'eq' ? accent : kind === 'op' ? lighten(accent, 0.86) : 'var(--w-line)';
      const fg = kind === 'eq' ? onColor(accent) : kind === 'op' ? accent : 'var(--w-fg)';
      const active = kind === 'op' && op === label && fresh;
      return (
        <button onClick={on} style={{
          gridColumn: span ? 'span 2' : 'auto',
          height: 30 * s, borderRadius: 9 * s, border: 'none', cursor: 'pointer',
          background: active ? accent : kind === 'fn' ? 'transparent' : bg,
          color: active ? onColor(accent) : kind === 'fn' ? 'var(--w-mut)' : fg,
          fontSize: 15 * s, fontWeight: kind === 'fn' ? 500 : 600,
          fontFamily: fontStack, fontVariantNumeric: 'tabular-nums',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.12s, color 0.12s', WebkitTapHighlightColor: 'transparent',
        }}>{label}</button>
      );
    };

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 1 * s, padding: `0 ${4 * s}px`, minHeight: 34 * s }}>
          <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums', minHeight: 13 * s, letterSpacing: '0.01em', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hist}</div>
          <div style={{ fontSize: 28 * s, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', color: cur === 'Error' ? accent : 'var(--w-fg)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cur === 'Error' ? 'Error' : fmtNum(cur)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 * s }}>
          <Key label="AC" kind="fn" on={clearAll} />
          <Key label="±" kind="fn" on={toggleSign} />
          <Key label="%" kind="fn" on={percent} />
          <Key label="÷" kind="op" on={() => chooseOp('÷')} />
          <Key label="7" on={() => inputDigit('7')} />
          <Key label="8" on={() => inputDigit('8')} />
          <Key label="9" on={() => inputDigit('9')} />
          <Key label="×" kind="op" on={() => chooseOp('×')} />
          <Key label="4" on={() => inputDigit('4')} />
          <Key label="5" on={() => inputDigit('5')} />
          <Key label="6" on={() => inputDigit('6')} />
          <Key label="−" kind="op" on={() => chooseOp('-')} />
          <Key label="1" on={() => inputDigit('1')} />
          <Key label="2" on={() => inputDigit('2')} />
          <Key label="3" on={() => inputDigit('3')} />
          <Key label="+" kind="op" on={() => chooseOp('+')} />
          <Key label="0" span on={() => inputDigit('0')} />
          <Key label="." on={inputDot} />
          <Key label="=" kind="eq" on={equals} />
        </div>
      </div>
    );
  }

  // ---- PERCENTAGE ----
  function Percent() {
    const [pct, setPct] = useState('15');
    const [base, setBase] = useState('200');
    const p = parseFloat(pct) || 0;
    const b = parseFloat(base) || 0;
    const portion = (p / 100) * b;

    const Field = ({ label, value, onChange, suffix }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * s, flex: 1 }}>
        <div style={{ fontSize: 10 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 * s, borderBottom: `1.5px solid var(--w-line)`, paddingBottom: 4 * s }}>
          <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--w-fg)', fontSize: 22 * s, fontWeight: 600, fontFamily: fontStack, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', minWidth: 0, padding: 0 }} />
          <span style={{ fontSize: 13 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{suffix}</span>
        </div>
      </div>
    );

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 * s }}>
        <div style={{ display: 'flex', gap: 16 * s }}>
          <Field label="Percent" value={pct} onChange={setPct} suffix="%" />
          <Field label="Of" value={base} onChange={setBase} suffix="" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s, padding: `${12 * s}px ${16 * s}px`, borderRadius: 12 * s, background: lighten(accent, 0.9) }}>
          <div style={{ fontSize: 10 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>Result</div>
          <div style={{ fontSize: 30 * s, fontWeight: 700, color: accent, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(round(portion))}</div>
        </div>
      </div>
    );
  }

  // ---- TIP ----
  function Tip() {
    const [bill, setBill] = useState('48.00');
    const [tip, setTip] = useState(c.defaultTip != null ? c.defaultTip : 18);
    const [split, setSplit] = useState(1);
    const b = parseFloat(bill) || 0;
    const tipAmt = b * (tip / 100);
    const total = b + tipAmt;
    const per = total / split;
    const cur = c.currency || '$';

    const presets = [15, 18, 20, 25];

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 * s }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 * s }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 * s, flex: 1 }}>
            <div style={{ fontSize: 10 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>Bill</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 * s, borderBottom: `1.5px solid var(--w-line)`, paddingBottom: 4 * s }}>
              <span style={{ fontSize: 18 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{cur}</span>
              <input inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value.replace(/[^0-9.]/g, ''))} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--w-fg)', fontSize: 24 * s, fontWeight: 600, fontFamily: fontStack, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', minWidth: 0, padding: 0 }} />
            </div>
          </div>
          {!mini ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
              <button onClick={() => setSplit((v) => Math.max(1, v - 1))} style={{ width: 26 * s, height: 26 * s, borderRadius: 8 * s, border: `1.5px solid var(--w-line)`, background: 'transparent', color: 'var(--w-fg)', fontSize: 16 * s, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>−</button>
              <span style={{ fontSize: 15 * s, fontWeight: 700, minWidth: 16 * s, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{split}</span>
              <button onClick={() => setSplit((v) => Math.min(50, v + 1))} style={{ width: 26 * s, height: 26 * s, borderRadius: 8 * s, border: `1.5px solid var(--w-line)`, background: 'transparent', color: 'var(--w-fg)', fontSize: 16 * s, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 6 * s }}>
          {presets.map((pp) => {
            const on = tip === pp;
            return (
              <button key={pp} onClick={() => setTip(pp)} style={{ flex: 1, height: 30 * s, borderRadius: 8 * s, border: `1.5px solid ${on ? accent : 'var(--w-line)'}`, background: on ? accent : 'transparent', color: on ? onColor(accent) : 'var(--w-fg)', fontSize: 12.5 * s, fontWeight: 600, fontFamily: fontStack, cursor: 'pointer', fontVariantNumeric: 'tabular-nums', transition: 'all 0.12s' }}>{pp}%</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s, padding: `${10 * s}px ${14 * s}px`, borderRadius: 12 * s, background: lighten(accent, 0.9) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * s }}>
            <div style={{ fontSize: 9.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{split > 1 ? 'Per person' : 'Total'}</div>
            <div style={{ fontSize: 26 * s, fontWeight: 700, color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{cur}{fmtNum(round(per))}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 * s, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 * s }}>
              <div style={{ fontSize: 9 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>Tip</div>
              <div style={{ fontSize: 14 * s, fontWeight: 600, color: 'var(--w-fg)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cur}{fmtNum(round(tipAmt))}</div>
            </div>
            {split > 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 * s }}>
                <div style={{ fontSize: 9 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>Total</div>
                <div style={{ fontSize: 14 * s, fontWeight: 600, color: 'var(--w-fg)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cur}{fmtNum(round(total))}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${14 * s}px ${16 * s}px`, fontFamily: fontStack, boxSizing: 'border-box' }}>
      {mode === 'percent' ? <Percent /> : mode === 'tip' ? <Tip /> : <Basic />}
    </div>
  );
}

/* ---------------- UNIT CONVERTER ---------------- */
function UnitConverterW({ config: c, accent, s, fontStack, mini }) {
  const CATS = useMemo(() => ({
    length: {
      label: 'Length',
      units: [
        { v: 'mm', l: 'mm', k: 0.001 },
        { v: 'cm', l: 'cm', k: 0.01 },
        { v: 'm', l: 'm', k: 1 },
        { v: 'km', l: 'km', k: 1000 },
        { v: 'in', l: 'in', k: 0.0254 },
        { v: 'ft', l: 'ft', k: 0.3048 },
        { v: 'yd', l: 'yd', k: 0.9144 },
        { v: 'mi', l: 'mi', k: 1609.344 },
      ],
    },
    weight: {
      label: 'Weight',
      units: [
        { v: 'mg', l: 'mg', k: 0.001 },
        { v: 'g', l: 'g', k: 1 },
        { v: 'kg', l: 'kg', k: 1000 },
        { v: 't', l: 't', k: 1e6 },
        { v: 'oz', l: 'oz', k: 28.3495 },
        { v: 'lb', l: 'lb', k: 453.592 },
        { v: 'st', l: 'st', k: 6350.29 },
      ],
    },
    temp: {
      label: 'Temp',
      units: [
        { v: 'C', l: '°C' },
        { v: 'F', l: '°F' },
        { v: 'K', l: 'K' },
      ],
    },
    volume: {
      label: 'Volume',
      units: [
        { v: 'ml', l: 'ml', k: 0.001 },
        { v: 'l', l: 'L', k: 1 },
        { v: 'tsp', l: 'tsp', k: 0.00492892 },
        { v: 'tbsp', l: 'tbsp', k: 0.0147868 },
        { v: 'cup', l: 'cup', k: 0.236588 },
        { v: 'pt', l: 'pt', k: 0.473176 },
        { v: 'qt', l: 'qt', k: 0.946353 },
        { v: 'gal', l: 'gal', k: 3.78541 },
      ],
    },
    data: {
      label: 'Data',
      units: [
        { v: 'B', l: 'B', k: 1 },
        { v: 'KB', l: 'KB', k: 1024 },
        { v: 'MB', l: 'MB', k: 1048576 },
        { v: 'GB', l: 'GB', k: 1073741824 },
        { v: 'TB', l: 'TB', k: 1099511627776 },
      ],
    },
  }), []);

  const [catKey, setCatKey] = useState(() => (CATS[c.category] ? c.category : 'length'));
  useEffect(() => { if (CATS[c.category] && c.category !== catKey) setCatKey(c.category); }, [c.category]);
  const cat = CATS[catKey] || CATS.length;

  const pick = (val, idx) => {
    const u = cat.units.find(x => x.v === val);
    return u ? u.v : cat.units[Math.min(idx, cat.units.length - 1)].v;
  };

  const [amount, setAmount] = useState(() => {
    const a = c.amount;
    return (a === 0 || a) ? String(a) : '1';
  });
  const [from, setFrom] = useState(() => pick(c.from, 0));
  const [to, setTo] = useState(() => pick(c.to, 1));

  const prevCat = useRef(catKey);
  useEffect(() => {
    if (prevCat.current !== catKey) {
      setFrom(cat.units[0].v);
      setTo(cat.units[Math.min(1, cat.units.length - 1)].v);
      prevCat.current = catKey;
    }
  }, [catKey, cat]);

  useEffect(() => { setFrom(pick(c.from, 0)); setTo(pick(c.to, 1)); }, [c.from, c.to]);
  useEffect(() => { const a = c.amount; if (a === 0 || a) setAmount(String(a)); }, [c.amount]);

  const convert = (n, f, t) => {
    if (catKey === 'temp') {
      let cel;
      if (f === 'C') cel = n; else if (f === 'F') cel = (n - 32) * 5 / 9; else cel = n - 273.15;
      if (t === 'C') return cel; if (t === 'F') return cel * 9 / 5 + 32; return cel + 273.15;
    }
    const uf = cat.units.find(x => x.v === f), ut = cat.units.find(x => x.v === t);
    if (!uf || !ut) return n;
    return n * uf.k / ut.k;
  };

  const raw = parseFloat(amount);
  const valid = !isNaN(raw) && amount !== '' && amount !== '-' && amount !== '.';
  const result = valid ? convert(raw, from, to) : 0;

  const fmtNum = (n) => {
    if (!isFinite(n)) return '—';
    const abs = Math.abs(n);
    let out;
    if (n === 0) out = '0';
    else if (abs < 0.0001 || abs >= 1e12) out = n.toExponential(3);
    else {
      const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
      out = parseFloat(n.toFixed(digits)).toString();
    }
    if (out.indexOf('e') === -1 && out.indexOf('.') === -1) {
      const neg = out[0] === '-';
      const grp = (neg ? out.slice(1) : out).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      out = (neg ? '-' : '') + grp;
    }
    return out;
  };

  const labelOf = (v) => { const u = cat.units.find(x => x.v === v); return u ? u.l : v; };
  const swap = () => { setFrom(to); setTo(from); };
  const showCats = c.showCategories !== false;

  const selStyle = {
    cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    border: '1px solid var(--w-line)', borderRadius: 8 * s, background: 'transparent',
    color: 'var(--w-fg)', fontFamily: fontStack, fontWeight: 600, fontSize: 12 * s,
    padding: `${5 * s}px ${8 * s}px`, lineHeight: 1, outline: 'none', textAlign: 'center',
  };

  const inputStyle = {
    textAlign: 'left', border: 'none', outline: 'none', background: 'transparent',
    color: 'var(--w-fg)', fontFamily: fontStack, fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em', padding: 0, fontSize: 26 * s, fontWeight: 700,
    width: '100%', minWidth: 0,
  };

  const renderRow = (isFrom) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10 * s, width: '100%',
      padding: `${9 * s}px ${12 * s}px`, borderRadius: 12 * s,
      border: '1px solid var(--w-line)',
      background: isFrom ? 'transparent' : (valid ? lighten(accent, 0.9) : 'transparent'),
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8.5 * s, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginBottom: 2 * s }}>
          {isFrom ? 'From' : 'To'}
        </div>
        {isFrom ? (
          <input
            type="text" inputMode="decimal" value={amount}
            onChange={e => { const v = e.target.value; if (/^-?\d*\.?\d*$/.test(v)) setAmount(v); }}
            style={inputStyle}
          />
        ) : (
          <div style={{ fontSize: 26 * s, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: valid ? accent : 'var(--w-mut)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {valid ? fmtNum(result) : '—'}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <select
          value={isFrom ? from : to}
          onChange={e => (isFrom ? setFrom : setTo)(e.target.value)}
          style={selStyle}
        >
          {cat.units.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 * s, padding: 15 * s, fontFamily: fontStack }}>
      {showCats && !mini && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 * s, justifyContent: 'center' }}>
          {Object.keys(CATS).map(k => {
            const on = k === catKey;
            return (
              <button key={k} onClick={() => setCatKey(k)} style={{
                cursor: 'pointer', borderRadius: 999, fontWeight: 600, fontFamily: fontStack,
                fontSize: 10.5 * s, padding: `${3.5 * s}px ${9 * s}px`, lineHeight: 1, transition: 'all 0.12s ease',
                border: 'none', background: on ? accent : 'transparent',
                color: on ? onColor(accent) : 'var(--w-mut)',
                boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--w-line)',
              }}>{CATS[k].label}</button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
        {renderRow(true)}
        {!mini && (
          <button onClick={swap} aria-label="Swap units" style={{
            cursor: 'pointer', width: 28 * s, height: 28 * s, borderRadius: 999,
            display: 'grid', placeItems: 'center', flexShrink: 0,
            border: '1px solid var(--w-line)', background: 'var(--w-bg, transparent)', color: 'var(--w-mut)',
            transition: 'all 0.12s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--w-mut)'; e.currentTarget.style.borderColor = 'var(--w-line)'; }}
          >
            <svg width={13 * s} height={13 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}>
              <path d="M7 4v16M7 4l-3 3M7 4l3 3" />
              <path d="M17 20V4M17 20l3-3M17 20l-3-3" />
            </svg>
          </button>
        )}
      </div>

      {renderRow(false)}
    </div>
  );
}

/* ---------------- AGENDA LIST ---------------- */
function AgendaListW({ config: c, accent, s, fontStack, mini }) {
  const RANGES = {
    today: {
      label: 'Today',
      events: [
        { day: 'Tue', date: 4, mon: 'Jun', time: '09:30', end: '10:00', title: 'Standup & sprint sync', cal: 'Work', tone: accent, allDay: false },
        { day: 'Tue', date: 4, mon: 'Jun', time: '11:00', end: '12:00', title: '1:1 with Priya', cal: 'Work', tone: '#7C3AED', allDay: false },
        { day: 'Tue', date: 4, mon: 'Jun', time: '13:15', end: '13:45', title: 'Lunch — Café Oeste', cal: 'Personal', tone: '#0EA5A4', allDay: false },
        { day: 'Tue', date: 4, mon: 'Jun', time: '15:00', end: '16:30', title: 'Design review: Q3 widgets', cal: 'Work', tone: accent, allDay: false },
        { day: 'Tue', date: 4, mon: 'Jun', time: '18:00', end: '19:00', title: 'Gym — leg day', cal: 'Personal', tone: '#0EA5A4', allDay: false },
        { day: 'Tue', date: 4, mon: 'Jun', time: '20:30', end: '21:30', title: 'Call mom', cal: 'Personal', tone: '#D97706', allDay: false }
      ]
    },
    week: {
      label: 'This week',
      events: [
        { day: 'Tue', date: 4, mon: 'Jun', time: '15:00', end: '16:30', title: 'Design review: Q3 widgets', cal: 'Work', tone: accent, allDay: false },
        { day: 'Wed', date: 5, mon: 'Jun', time: '10:00', end: '11:00', title: 'Roadmap planning', cal: 'Work', tone: accent, allDay: false },
        { day: 'Wed', date: 5, mon: 'Jun', time: '19:30', end: '22:00', title: 'Dinner with Sam', cal: 'Personal', tone: '#0EA5A4', allDay: false },
        { day: 'Thu', date: 6, mon: 'Jun', time: null, end: null, title: 'Ship v2.4 release', cal: 'Work', tone: '#D97706', allDay: true },
        { day: 'Fri', date: 7, mon: 'Jun', time: '09:00', end: '09:30', title: 'Weekly review', cal: 'Work', tone: accent, allDay: false },
        { day: 'Sat', date: 8, mon: 'Jun', time: '08:00', end: '11:00', title: 'Trail run — Sintra', cal: 'Personal', tone: '#0EA5A4', allDay: false },
        { day: 'Sun', date: 9, mon: 'Jun', time: null, end: null, title: "Dad's birthday", cal: 'Family', tone: '#DB2777', allDay: true }
      ]
    },
    month: {
      label: 'This month',
      events: [
        { day: 'Thu', date: 6, mon: 'Jun', time: null, end: null, title: 'Ship v2.4 release', cal: 'Work', tone: '#D97706', allDay: true },
        { day: 'Mon', date: 10, mon: 'Jun', time: '14:00', end: '15:00', title: 'Investor update call', cal: 'Work', tone: accent, allDay: false },
        { day: 'Wed', date: 12, mon: 'Jun', time: '18:30', end: '23:00', title: 'Team offsite — rooftop', cal: 'Work', tone: '#7C3AED', allDay: false },
        { day: 'Sat', date: 15, mon: 'Jun', time: null, end: null, title: 'Flight to Berlin', cal: 'Travel', tone: '#0EA5A4', allDay: true },
        { day: 'Tue', date: 18, mon: 'Jun', time: '11:00', end: '12:00', title: 'Dentist', cal: 'Personal', tone: '#D97706', allDay: false },
        { day: 'Fri', date: 21, mon: 'Jun', time: '20:00', end: '23:30', title: 'Album launch party', cal: 'Personal', tone: '#DB2777', allDay: false },
        { day: 'Mon', date: 24, mon: 'Jun', time: null, end: null, title: 'Quarter close', cal: 'Work', tone: accent, allDay: true }
      ]
    }
  };

  const range = RANGES[c.range] || RANGES.week;
  const cap = mini ? 3 : 4;
  const count = Math.max(1, Math.min(cap, +c.count || cap));
  const events = range.events.slice(0, count);
  const calName = (() => {
    const u = (c.icalUrl || '').trim();
    if (!u) return 'My Calendar';
    try {
      const m = u.replace(/^webcal:\/\//, '').replace(/^https?:\/\//, '').split('/')[0];
      return m || 'My Calendar';
    } catch (e) { return 'My Calendar'; }
  })();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: `${14 * s}px ${15 * s}px`, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s, minWidth: 0 }}>
          <span style={{ width: 26 * s, height: 26 * s, borderRadius: 8 * s, flexShrink: 0, display: 'grid', placeItems: 'center', background: lighten(accent, 0.82), border: `1px solid ${lighten(accent, 0.6)}` }}>
            <Icon name="calendar" color={accent} variant="outline" size={15 * s} sw={1.8} />
          </span>
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 7 * s }}>
            <div style={{ fontSize: 13 * s, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{calName}</div>
            <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500, flexShrink: 0 }}>{range.label}</div>
          </div>
        </div>
        {!mini && (
          <span style={{ fontSize: 10.5 * s, fontWeight: 600, color: accent, background: lighten(accent, 0.84), padding: `${2.5 * s}px ${7 * s}px`, borderRadius: 99, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{events.length}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 * s, padding: `${6 * s}px 0`, borderTop: i === 0 ? 'none' : '1px solid var(--w-line)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 30 * s, flexShrink: 0 }}>
              <div style={{ fontSize: 9 * s, fontWeight: 700, color: 'var(--w-mut)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ev.day}</div>
              <div style={{ fontSize: 15.5 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{ev.date}</div>
            </div>
            <div style={{ width: 3 * s, alignSelf: 'stretch', borderRadius: 99, background: ev.tone, flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 * s, justifyContent: 'center' }}>
              <div style={{ fontSize: 12.5 * s, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s, fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: ev.allDay ? ev.tone : 'var(--w-mut)' }}>{ev.allDay ? 'All day' : ev.time}{!ev.allDay && ev.end ? <span style={{ color: 'var(--w-mut)', fontWeight: 500 }}>–{ev.end}</span> : null}</span>
                {!mini && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 * s, paddingLeft: 7 * s, borderLeft: '1px solid var(--w-line)' }}>
                    <span style={{ width: 6 * s, height: 6 * s, borderRadius: 99, background: ev.tone, flexShrink: 0 }} />
                    {ev.cal}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- CURRENCY CONVERTER ---------------- */
function CurrencyConverterW({ config: c, accent, s, fontStack, mini }) {
  // Baked-in realistic FX snapshot. NO network. Rates are units of currency per 1 USD.
  const FX = {
    USD: { sym: '$', flag: '🇺🇸', name: 'US Dollar', rate: 1 },
    EUR: { sym: '€', flag: '🇪🇺', name: 'Euro', rate: 0.9215 },
    GBP: { sym: '£', flag: '🇬🇧', name: 'British Pound', rate: 0.7886 },
    JPY: { sym: '¥', flag: '🇯🇵', name: 'Japanese Yen', rate: 157.32 },
    CHF: { sym: 'Fr', flag: '🇨🇭', name: 'Swiss Franc', rate: 0.8942 },
    CAD: { sym: '$', flag: '🇨🇦', name: 'Canadian Dollar', rate: 1.3704 },
    AUD: { sym: '$', flag: '🇦🇺', name: 'Australian Dollar', rate: 1.5098 },
    INR: { sym: '₹', flag: '🇮🇳', name: 'Indian Rupee', rate: 83.46 },
    CNY: { sym: '¥', flag: '🇨🇳', name: 'Chinese Yuan', rate: 7.2412 },
    SGD: { sym: '$', flag: '🇸🇬', name: 'Singapore Dollar', rate: 1.3492 },
    BRL: { sym: 'R$', flag: '🇧🇷', name: 'Brazilian Real', rate: 5.4218 },
    MXN: { sym: '$', flag: '🇲🇽', name: 'Mexican Peso', rate: 18.224 },
  };
  // 24h % drift baked per currency vs USD (sample), drives the up/down tint + sparkline shape.
  const DRIFT = { USD: 0, EUR: 0.18, GBP: -0.12, JPY: 0.34, CHF: -0.07, CAD: 0.09, AUD: -0.21, INR: 0.04, CNY: -0.03, SGD: 0.11, BRL: 0.41, MXN: -0.16 };

  const base = FX[c.base] ? c.base : 'USD';
  const targetsRaw = Array.isArray(c.targets) && c.targets.length ? c.targets : ['EUR', 'GBP'];
  const targets = targetsRaw.filter(t => FX[t] && t !== base).slice(0, 4);
  const tgts = targets.length ? targets : (base === 'EUR' ? ['USD', 'GBP'] : ['EUR', 'GBP']);
  const amount = (typeof c.amount === 'number' && isFinite(c.amount)) ? c.amount : 100;
  const showSpark = c.showSpark !== false;

  const fmt = (n, code) => {
    const dp = code === 'JPY' ? 0 : 2;
    return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  };
  // pair rate: how many units of `to` per 1 unit of `from`
  const pairRate = (from, to) => FX[to].rate / FX[from].rate;

  // deterministic seeded sparkline (28 pts) ending at current pair rate, slope follows drift delta.
  const sparkPts = (from, to) => {
    const end = pairRate(from, to);
    const slope = (DRIFT[to] - DRIFT[from]) / 100; // fractional 24h change
    const start = end / (1 + slope);
    let seed = (from.charCodeAt(0) * 131 + to.charCodeAt(0) * 977) % 9973;
    const N = 28, out = [];
    for (let i = 0; i < N; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const noise = ((seed % 1000) / 1000 - 0.5) * Math.abs(end - start || end * 0.004) * 0.9;
      const t = i / (N - 1);
      out.push(start + (end - start) * t + noise);
    }
    out[N - 1] = end;
    return out;
  };

  const Spark = ({ data, color, up }) => {
    const w = 100, h = 30;
    const min = Math.min(...data), max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / span) * (h - 4) - 2]);
    const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ` L${w} ${h} L0 ${h} Z`;
    const gid = 'sp_' + color.replace('#', '') + (up ? 'u' : 'd');
    return (
      <svg width={64 * s} height={20 * s} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={color} />
      </svg>
    );
  };

  const upC = accent;
  const downC = '#D85A4A';
  const bSym = FX[base].sym;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: 20 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      {/* Base amount header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, fontSize: 11 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>
            <span style={{ fontSize: 13 * s }}>{FX[base].flag}</span>{base}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 * s, marginTop: 3 * s }}>
            <span style={{ fontSize: 16 * s, fontWeight: 600, color: 'var(--w-mut)' }}>{bSym}</span>
            <span style={{ fontSize: 32 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(amount, base)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'var(--w-mut)', paddingBottom: 2 * s }}>
          <svg width={18 * s} height={18 * s} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h14l-3.5-3.5M21 16H7l3.5 3.5" /></svg>
        </div>
      </div>

      {/* Converted rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 * s, borderTop: '1px solid var(--w-line)', paddingTop: 13 * s }}>
        {tgts.map(code => {
          const r = pairRate(base, code);
          const converted = amount * r;
          const delta = DRIFT[code] - DRIFT[base];
          const up = delta >= 0;
          const col = up ? upC : downC;
          return (
            <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s, minWidth: 0 }}>
                <span style={{ fontSize: 17 * s, lineHeight: 1 }}>{FX[code].flag}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5 * s, fontWeight: 600, lineHeight: 1.15 }}>{code}</div>
                  <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 * s }}>
                    <span>{r.toFixed(code === 'JPY' ? 2 : 4)}</span>
                    <span style={{ color: col, fontWeight: 600 }}>{up ? '▲' : '▼'}{Math.abs(delta).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 * s }}>
                {showSpark && !mini && <Spark data={sparkPts(base, code)} color={col} up={up} />}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 16.5 * s, fontWeight: 700, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{FX[code].sym}{fmt(converted, code)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!mini && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 500, letterSpacing: '0.04em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 * s }}>
            <span style={{ width: 5 * s, height: 5 * s, borderRadius: 99, background: accent, display: 'inline-block', boxShadow: `0 0 0 ${2.5 * s}px ${lighten(accent, 0.7)}` }} />
            Mid-market
          </span>
          <span style={{ textTransform: 'uppercase' }}>Updated 14:02 UTC</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- CRYPTO TICKER ---------------- */
function CryptoTickerW({ config: c, accent, s, fontStack, mini }) {
  // Baked-in realistic sample dataset. NO network. Config SELECTS/LABELS this data.
  const COINS = {
    BTC: { name: 'Bitcoin',  usd: 67432.18, ch: 2.34,  spark: [63100, 63480, 62950, 64210, 64980, 64320, 65510, 66040, 65720, 66890, 67210, 66980, 67432] },
    ETH: { name: 'Ethereum', usd: 3518.74,  ch: 1.62,  spark: [3402, 3388, 3441, 3470, 3455, 3498, 3462, 3510, 3489, 3521, 3504, 3530, 3519] },
    SOL: { name: 'Solana',   usd: 168.92,   ch: 5.18,  spark: [152.4, 154.1, 153.6, 157.2, 160.0, 159.1, 162.8, 164.3, 163.1, 166.7, 167.9, 167.2, 168.9] },
    BNB: { name: 'BNB',      usd: 592.41,   ch: -0.84, spark: [601, 598, 603, 599, 596, 600, 594, 597, 595, 593, 596, 591, 592] },
    XRP: { name: 'XRP',      usd: 0.5217,   ch: -1.47, spark: [0.531, 0.529, 0.533, 0.528, 0.525, 0.527, 0.522, 0.524, 0.521, 0.520, 0.523, 0.519, 0.522] },
    ADA: { name: 'Cardano',  usd: 0.4483,   ch: 3.09,  spark: [0.431, 0.428, 0.435, 0.439, 0.441, 0.437, 0.444, 0.446, 0.443, 0.449, 0.447, 0.451, 0.448] },
    DOGE: { name: 'Dogecoin', usd: 0.1582,  ch: 7.42,  spark: [0.144, 0.146, 0.145, 0.149, 0.152, 0.150, 0.154, 0.156, 0.153, 0.158, 0.157, 0.159, 0.158] },
    AVAX: { name: 'Avalanche', usd: 36.28,  ch: -2.11, spark: [37.6, 37.2, 37.8, 37.1, 36.7, 37.0, 36.4, 36.6, 36.1, 36.5, 36.0, 36.4, 36.3] },
    DOT: { name: 'Polkadot', usd: 7.142,    ch: 0.96,  spark: [7.04, 7.01, 7.09, 7.12, 7.08, 7.15, 7.10, 7.17, 7.13, 7.16, 7.11, 7.18, 7.14] },
    LINK: { name: 'Chainlink', usd: 18.47,  ch: 4.27,  spark: [17.4, 17.6, 17.5, 17.9, 18.1, 18.0, 18.3, 18.5, 18.2, 18.6, 18.4, 18.5, 18.47] },
    MATIC: { name: 'Polygon', usd: 0.7218,  ch: -3.52, spark: [0.752, 0.748, 0.755, 0.747, 0.741, 0.744, 0.736, 0.739, 0.732, 0.728, 0.731, 0.724, 0.722] },
    LTC: { name: 'Litecoin', usd: 84.16,    ch: 1.18,  spark: [82.4, 82.1, 82.9, 83.4, 83.1, 83.8, 83.3, 84.0, 83.6, 84.2, 83.9, 84.3, 84.16] },
  };

  // Fiat label + conversion (sample static rates; data is baked, no fetch).
  const FIAT = {
    USD: { sym: '$', rate: 1, dec: 2 },
    EUR: { sym: '€', rate: 0.92, dec: 2 },
    GBP: { sym: '£', rate: 0.79, dec: 2 },
    JPY: { sym: '¥', rate: 156.4, dec: 0 },
    INR: { sym: '₹', rate: 83.3, dec: 0 },
  };

  const fiatKey = (c.fiat && FIAT[c.fiat]) ? c.fiat : 'USD';
  const f = FIAT[fiatKey];
  const showSpark = c.sparkline !== false;

  const raw = Array.isArray(c.symbols) && c.symbols.length ? c.symbols : ['BTC', 'ETH', 'SOL'];
  const symbols = raw.map(x => String(x).toUpperCase()).filter(x => COINS[x]).slice(0, mini ? 3 : 6);
  const list = (symbols.length ? symbols : ['BTC', 'ETH', 'SOL']).map(sym => ({ sym, ...COINS[sym] }));

  const fmtPrice = usd => {
    const v = usd * f.rate;
    let dec = f.dec;
    if (v < 1) dec = 4; else if (v < 100) dec = Math.max(dec, 2);
    return f.sym + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  const up = '#16a34a', down = '#dc2626';

  const Spark = ({ pts, color }) => {
    const w = (mini ? 46 : 60) * s, h = (mini ? 18 : 22) * s;
    const min = Math.min(...pts), max = Math.max(...pts), span = (max - min) || 1;
    const stepX = w / (pts.length - 1);
    const xy = pts.map((p, i) => [i * stepX, h - ((p - min) / span) * (h - 2 * s) - s]);
    const d = xy.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
    const area = d + ' L' + w.toFixed(1) + ' ' + h.toFixed(1) + ' L0 ' + h.toFixed(1) + ' Z';
    const gid = 'sp_' + pts.length + '_' + Math.round(min * 100) + '_' + Math.round(max * 100);
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={d} fill="none" stroke={color} strokeWidth={1.6 * s} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r={2 * s} fill={color} />
      </svg>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: (mini ? 8 : 11) * s, padding: (mini ? 14 : 18) * s }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s }}>
          <span style={{ width: 7 * s, height: 7 * s, borderRadius: 99, background: accent, boxShadow: `0 0 ${7 * s}px ${accent}`, flexShrink: 0 }} />
          <span style={{ fontSize: 11 * s, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)' }}>Markets</span>
        </div>
        <span style={{ fontSize: 10.5 * s, fontWeight: 600, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>{fiatKey}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {list.map((d, idx) => {
          const pos = d.ch >= 0, col = pos ? up : down;
          return (
            <div key={d.sym} style={{ display: 'flex', alignItems: 'center', gap: (mini ? 8 : 12) * s, padding: `${(mini ? 6 : 8) * s}px 0`, borderTop: idx ? '1px solid var(--w-line)' : 'none' }}>
              <div style={{ width: (mini ? 28 : 32) * s, height: (mini ? 28 : 32) * s, borderRadius: 99, flexShrink: 0, display: 'grid', placeItems: 'center', background: lighten(accent, luminance(accent) > 0.5 ? -0.04 : 0.78), color: accent, fontSize: (mini ? 10 : 11) * s, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {d.sym.slice(0, 3)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: (mini ? 12.5 : 13.5) * s, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.sym}</div>
                {!mini && <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500, lineHeight: 1.2 }}>{d.name}</div>}
              </div>
              {showSpark && !mini ? <Spark pts={d.spark} color={col} /> : null}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: (mini ? 12.5 : 13.5) * s, fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{fmtPrice(d.usd)}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 * s, fontSize: 10.5 * s, fontWeight: 700, color: col, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                  <svg width={8 * s} height={8 * s} viewBox="0 0 12 12" style={{ display: 'block', transform: pos ? 'none' : 'rotate(180deg)' }}><path d="M6 2 L10 9 L2 9 Z" fill={col} /></svg>
                  {Math.abs(d.ch).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- STOCK TICKER ---------------- */
function StockTickerW({ config: c, accent, s, fontStack, mini }) {
  const STOCKS = {
    AAPL: { name: 'Apple Inc.', price: 229.87, chg: 2.41, pct: 1.06, series: [225, 224.6, 225.8, 226.4, 225.9, 227.1, 226.7, 228.0, 227.4, 228.6, 229.1, 228.3, 229.0, 230.2, 229.6, 228.9, 229.7, 230.4, 229.9, 230.6, 229.4, 230.1, 229.5, 229.87] },
    MSFT: { name: 'Microsoft', price: 467.32, chg: 5.18, pct: 1.12, series: [460, 461.2, 460.5, 462.8, 463.4, 462.1, 464.0, 463.3, 465.1, 464.6, 466.0, 465.4, 466.8, 465.9, 467.5, 466.7, 468.1, 467.0, 468.4, 467.6, 466.9, 467.8, 467.1, 467.32] },
    NVDA: { name: 'NVIDIA', price: 138.94, chg: -1.87, pct: -1.33, series: [141, 141.6, 140.8, 141.2, 140.4, 140.9, 139.8, 140.3, 139.5, 140.0, 139.1, 139.6, 138.7, 139.2, 138.4, 138.9, 139.4, 138.6, 139.0, 138.2, 138.8, 138.3, 139.1, 138.94] },
    GOOGL: { name: 'Alphabet', price: 178.45, chg: 1.12, pct: 0.63, series: [176.8, 177.1, 176.6, 177.4, 177.0, 177.8, 177.3, 178.0, 177.6, 178.2, 177.9, 178.5, 178.1, 177.7, 178.3, 178.9, 178.4, 177.8, 178.6, 178.2, 178.7, 178.0, 178.5, 178.45] },
    TSLA: { name: 'Tesla', price: 341.16, chg: 8.74, pct: 2.63, series: [330, 331.4, 330.8, 332.6, 333.1, 334.5, 333.9, 335.7, 336.2, 335.4, 337.0, 338.3, 337.6, 339.1, 338.4, 340.0, 339.3, 340.8, 341.5, 340.6, 341.9, 340.9, 341.4, 341.16] },
    AMZN: { name: 'Amazon', price: 207.89, chg: -0.94, pct: -0.45, series: [209, 208.7, 209.2, 208.4, 208.9, 208.1, 208.6, 207.8, 208.3, 207.5, 208.0, 207.2, 207.7, 208.2, 207.4, 207.9, 207.1, 207.6, 208.1, 207.3, 207.8, 207.0, 207.5, 207.89] },
    META: { name: 'Meta', price: 612.43, chg: 7.86, pct: 1.30, series: [602, 603.4, 602.8, 604.6, 605.1, 604.3, 606.0, 605.4, 607.2, 606.6, 608.0, 607.4, 609.1, 608.5, 610.0, 609.3, 611.0, 610.4, 611.8, 611.0, 612.2, 611.4, 612.6, 612.43] },
    SPY: { name: 'S&P 500 ETF', price: 596.18, chg: 1.43, pct: 0.24, series: [594, 594.6, 594.2, 595.1, 594.8, 595.5, 595.0, 595.8, 595.3, 596.0, 595.6, 596.3, 595.9, 595.4, 596.1, 596.7, 596.2, 595.7, 596.4, 596.0, 596.5, 595.8, 596.3, 596.18] },
  };

  const SYM = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
  const cur = SYM[c.currency] || '$';
  const symbols = (Array.isArray(c.symbols) && c.symbols.length ? c.symbols : ['AAPL', 'MSFT'])
    .map(x => String(x).toUpperCase())
    .filter(x => STOCKS[x]);
  const list = (symbols.length ? symbols : ['AAPL', 'MSFT']).map(sym => ({ sym, ...STOCKS[sym] }));

  const up = '#0f9d58';
  const down = '#d93838';
  const fmt = n => (Math.abs(n) >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toFixed(2));

  const Spark = ({ series, color, w, h }) => {
    const min = Math.min(...series), max = Math.max(...series);
    const span = max - min || 1;
    const pts = series.map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return [x, y];
    });
    const dLine = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const dArea = dLine + ` L${w} ${h} L0 ${h} Z`;
    const gid = 'sg' + Math.round(w) + '_' + color.replace('#', '');
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={dArea} fill={`url(#${gid})`} />
        <path d={dLine} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const lead = list[0];
  const leadColor = lead.chg >= 0 ? up : down;
  const rows = list.slice(1, mini ? 3 : 3);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: `${14 * s}px ${16 * s}px`, fontVariantNumeric: 'tabular-nums' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s }}>
          <div style={{ width: 6 * s, height: 6 * s, borderRadius: '50%', background: accent, boxShadow: `0 0 0 ${3 * s}px ${lighten(accent, 0.45)}` }} />
          <div style={{ fontSize: 11.5 * s, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)' }}>Watchlist</div>
        </div>
        <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{c.currency || 'USD'}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid var(--w-line)', paddingBottom: 9 * s, gap: 10 * s }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s }}>
            <div style={{ fontSize: 13 * s, fontWeight: 700, letterSpacing: '0.02em' }}>{lead.sym}</div>
            <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 * s, marginTop: 3 * s }}>
            <div style={{ fontSize: 25 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{cur}{fmt(lead.price)}</div>
            <div style={{ fontSize: 11 * s, fontWeight: 600, color: leadColor }}>
              {lead.chg >= 0 ? '▲' : '▼'} {Math.abs(lead.pct).toFixed(2)}%
            </div>
          </div>
        </div>
        {c.sparkline && !mini && <Spark series={lead.series} color={leadColor} w={72 * s} h={34 * s} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * s }}>
        {rows.map(r => {
          const col = r.chg >= 0 ? up : down;
          return (
            <div key={r.sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
              <div style={{ fontSize: 12 * s, fontWeight: 700, letterSpacing: '0.02em', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sym}</div>
              {c.sparkline && !mini && <Spark series={r.series} color={col} w={48 * s} h={16 * s} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 * s }}>
                <div style={{ fontSize: 12 * s, fontWeight: 600 }}>{cur}{fmt(r.price)}</div>
                <div style={{ fontSize: 10.5 * s, fontWeight: 600, color: col, minWidth: 44 * s, textAlign: 'right' }}>{r.chg >= 0 ? '+' : '−'}{Math.abs(r.pct).toFixed(2)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- WEATHER ---------------- */
function WeatherForecastW({ config: c, accent, s, fontStack, mini }) {
  const FORECAST_DATA = {
    Lisbon: {
      tz: 'Atlantic time', cond: 'Mostly sunny', icon: 'sun', now: 23, hi: 26, lo: 16,
      feels: 24, hum: 48, wind: 12, pop: 8,
      hourly: [['Now','sun',23],['1pm','sun',25],['2pm','sun',26],['3pm','sun',25],['4pm','cloud',24],['5pm','cloud',22],['6pm','cloud',20],['7pm','rain',18]],
      days: [['Mon','sun',26,16,5],['Tue','cloud',23,15,20],['Wed','rain',19,14,75],['Thu','sun',24,15,10],['Fri','sun',27,17,5],['Sat','cloud',24,16,30],['Sun','sun',25,16,10]]
    },
    London: {
      tz: 'GMT', cond: 'Light rain', icon: 'rain', now: 14, hi: 16, lo: 9,
      feels: 12, hum: 81, wind: 19, pop: 70,
      hourly: [['Now','rain',14],['1pm','rain',15],['2pm','cloud',16],['3pm','cloud',16],['4pm','cloud',15],['5pm','rain',14],['6pm','rain',13],['7pm','cloud',12]],
      days: [['Mon','rain',16,9,70],['Tue','cloud',16,10,40],['Wed','cloud',14,9,35],['Thu','sun',18,11,10],['Fri','cloud',17,10,25],['Sat','rain',15,9,65],['Sun','cloud',16,10,30]]
    },
    'New York': {
      tz: 'EST', cond: 'Partly cloudy', icon: 'cloud', now: 19, hi: 22, lo: 12,
      feels: 19, hum: 56, wind: 15, pop: 25,
      hourly: [['Now','cloud',19],['1pm','cloud',21],['2pm','sun',22],['3pm','sun',22],['4pm','cloud',21],['5pm','cloud',19],['6pm','cloud',17],['7pm','rain',15]],
      days: [['Mon','cloud',22,12,25],['Tue','sun',24,13,5],['Wed','sun',25,14,5],['Thu','rain',20,13,60],['Fri','cloud',21,12,30],['Sat','sun',23,13,10],['Sun','cloud',22,13,20]]
    },
    Tokyo: {
      tz: 'JST', cond: 'Clear', icon: 'sun', now: 21, hi: 24, lo: 15,
      feels: 21, hum: 52, wind: 9, pop: 5,
      hourly: [['Now','sun',21],['1pm','sun',23],['2pm','sun',24],['3pm','sun',24],['4pm','sun',23],['5pm','cloud',21],['6pm','cloud',19],['7pm','cloud',17]],
      days: [['Mon','sun',24,15,5],['Tue','sun',25,16,5],['Wed','cloud',23,16,30],['Thu','cloud',22,15,40],['Fri','rain',19,14,70],['Sat','sun',24,15,10],['Sun','sun',25,16,5]]
    }
  };

  const d = FORECAST_DATA[c.city] || FORECAST_DATA.Lisbon;
  const conv = t => c.units === 'F' ? Math.round(t * 9 / 5 + 32) : t;
  const u = c.units === 'F' ? '°F' : '°C';

  // Resolve how many forecast days the Outlook slider wants (3..7).
  const reqDays = Math.max(3, Math.min(7, Math.round(c.days || 5)));

  // Build the day list, synthesizing extra plausible days if the baked
  // sample has fewer entries than requested.
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const iconCycle = ['sun', 'cloud', 'rain', 'sun', 'cloud'];
  const baseDays = d.days;
  const allDays = [];
  for (let i = 0; i < reqDays; i++) {
    if (i < baseDays.length) {
      allDays.push(baseDays[i]);
    } else {
      // Synthesize a plausible day derived from city averages.
      const k = i - baseDays.length;
      const day = dayNames[i % 7];
      const ic = iconCycle[(i + (c.city ? c.city.length : 0)) % iconCycle.length];
      const hi = d.hi + ((k % 3) - 1);
      const lo = d.lo + (((k + 1) % 3) - 1);
      const pop = ic === 'rain' ? 60 + (k % 3) * 8 : ic === 'cloud' ? 25 + (k % 3) * 5 : 8 + (k % 3) * 4;
      allDays.push([day, ic, hi, lo, pop]);
    }
  }

  const days = mini ? allDays.slice(0, Math.min(reqDays, 4)) : allDays;
  const nDays = days.length;

  // Sparkline path from hourly temps
  const temps = d.hourly.map(h => h[2]);
  const sMin = Math.min(...temps), sMax = Math.max(...temps);
  const span = Math.max(1, sMax - sMin);
  const W = 240, H = 30;
  const pts = temps.map((t, i) => {
    const x = (i / (temps.length - 1)) * W;
    const y = H - ((t - sMin) / span) * (H - 6) - 3;
    return [x, y];
  });
  const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const areaPath = linePath + ' L' + W + ' ' + H + ' L0 ' + H + ' Z';
  const gid = 'wf_grad_' + (c.city || 'x').replace(/\s/g, '');

  const showSpark = c.showHourly && !mini && nDays <= 4;

  // Range across the whole shown forecast for the temperature bars.
  const allHi = Math.max(...days.map(x => x[2]));
  const allLo = Math.min(...days.map(x => x[3]));
  const rangeSpan = Math.max(1, allHi - allLo);

  // Per-row vertical padding shrinks as more days are shown so 7 rows
  // still fit the 232px embed at s=1.
  const rowPad = nDays >= 7 ? 1.5 : nDays >= 6 ? 2 : nDays >= 5 ? 3 : 4;
  const dayFont = nDays >= 7 ? 10.5 : 11;

  const Pill = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 * s, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 9 * s, color: 'var(--w-mut)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 12 * s, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 * s, padding: (mini ? 12 : 13) * s }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13 * s, fontWeight: 700, letterSpacing: '-0.01em' }}>{c.city}</div>
          <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.cond} · {d.tz}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' }}>{conv(d.now)}<span style={{ fontSize: 14 * s, fontWeight: 600, color: 'var(--w-mut)' }}>{u}</span></div>
            <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 1 * s }}>H {conv(d.hi)}°&nbsp;&nbsp;L {conv(d.lo)}°</div>
          </div>
          <div style={{ color: accent }}><WeatherGlyph kind={d.icon} size={(mini ? 34 : 40) * s} color={accent} /></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 * s, borderTop: '1px solid var(--w-line)', borderBottom: '1px solid var(--w-line)', padding: (3 * s) + 'px 0' }}>
        <Pill label="Feels" value={conv(d.feels) + '°'} />
        <Pill label="Rain" value={d.pop + '%'} />
        <Pill label="Humidity" value={d.hum + '%'} />
        <Pill label="Wind" value={d.wind + ' km/h'} />
      </div>

      {showSpark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * s }}>
          <svg width="100%" height={18 * s} viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={'url(#' + gid + ')'} />
            <path d={linePath} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill={accent} vectorEffect="non-scaling-stroke" />)}
          </svg>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {days.map(([day, ic, hi, lo, pop], di) => (
          <div key={day + '-' + di} style={{ display: 'flex', alignItems: 'center', gap: 8 * s, padding: (rowPad * s) + 'px 0' }}>
            <div style={{ fontSize: dayFont * s, fontWeight: 600, width: 30 * s, color: 'var(--w-fg)' }}>{day}</div>
            <WeatherGlyph kind={ic} size={14 * s} color="var(--w-mut)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 * s, width: 34 * s, color: accent, fontSize: 9.5 * s, fontWeight: 600, opacity: pop >= 30 ? 1 : 0.35 }}>
              <svg width={8 * s} height={8 * s} viewBox="0 0 24 24" fill={accent}><path d="M12 2 C12 2 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 2 12 2 Z" /></svg>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pop}%</span>
            </div>
            <div style={{ flex: 1, height: 4 * s, borderRadius: 99, background: 'var(--w-line)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: ((lo - allLo) / rangeSpan * 100) + '%', right: (100 - (hi - allLo) / rangeSpan * 100) + '%', borderRadius: 99, background: 'linear-gradient(90deg, ' + lighten(accent, 0.35) + ', ' + accent + ')' }} />
            </div>
            <div style={{ display: 'flex', gap: 5 * s, width: 50 * s, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: dayFont * s, fontWeight: 600 }}>{conv(hi)}°</span>
              <span style={{ fontSize: dayFont * s, fontWeight: 500, color: 'var(--w-mut)' }}>{conv(lo)}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ON THIS DAY ---------------- */
function OnThisDayW({ config: c, accent, s, fontStack, mini }) {
  const now = useNow(true, 60000);
  const onAcc = onColor(accent);
  const category = c.category || 'events';
  const count = Math.max(1, Math.min(3, c.count || 1));
  const lang = c.language || 'en';

  // Baked-in sample dataset keyed by category. NO network. Looks fully populated.
  const HISTORY = {
    events: [
      { y: 1789, t: { en: 'The first U.S. Congress convened at Federal Hall in New York City, formally launching the federal government.', es: 'El primer Congreso de EE. UU. se reunió en Federal Hall en Nueva York, inaugurando formalmente el gobierno federal.', fr: "Le premier Congrès des États-Unis se réunit au Federal Hall de New York, lançant officiellement le gouvernement fédéral." }, tag: 'Politics' },
      { y: 1919, t: { en: 'The League of Nations held its inaugural council meeting in Paris, the first global body for collective security.', es: 'La Sociedad de Naciones celebró su primera reunión de consejo en París, el primer organismo mundial de seguridad colectiva.', fr: "La Société des Nations tient sa première réunion du conseil à Paris, premier organe mondial de sécurité collective." }, tag: 'World' },
      { y: 1969, t: { en: 'A live broadcast carried the first images of crew preparing for a historic orbital rendezvous to millions of homes.', es: 'Una transmisión en vivo llevó a millones de hogares las primeras imágenes de la tripulación preparando un encuentro orbital histórico.', fr: "Une diffusion en direct apporte à des millions de foyers les premières images d'un rendez-vous orbital historique." }, tag: 'Science' },
    ],
    births: [
      { y: 1878, t: { en: 'Carl Sandburg, the American poet and biographer who won three Pulitzer Prizes, was born in Galesburg, Illinois.', es: 'Nace Carl Sandburg, poeta y biógrafo estadounidense ganador de tres premios Pulitzer, en Galesburg, Illinois.', fr: "Naissance de Carl Sandburg, poète et biographe américain lauréat de trois prix Pulitzer, à Galesburg, Illinois." }, tag: 'Literature' },
      { y: 1926, t: { en: 'Miles Davis, the trumpeter whose restless reinventions reshaped modern jazz, was born in Alton, Illinois.', es: 'Nace Miles Davis, el trompetista cuyas constantes reinvenciones transformaron el jazz moderno, en Alton, Illinois.', fr: "Naissance de Miles Davis, le trompettiste dont les réinventions incessantes ont transformé le jazz moderne, à Alton." }, tag: 'Music' },
      { y: 1953, t: { en: 'A pioneering computer scientist who later shaped early networked systems was born in a small university town.', es: 'Nace en una pequeña ciudad universitaria un científico de la computación pionero que daría forma a los primeros sistemas en red.', fr: "Naissance, dans une petite ville universitaire, d'un informaticien pionnier des premiers systèmes en réseau." }, tag: 'Technology' },
    ],
    discoveries: [
      { y: 1543, t: { en: 'Copernicus published "On the Revolutions of the Celestial Spheres," placing the Sun at the center of the cosmos.', es: 'Copérnico publicó "Sobre las revoluciones de las esferas celestes", colocando al Sol en el centro del cosmos.', fr: "Copernic publie « Des révolutions des sphères célestes », plaçant le Soleil au centre du cosmos." }, tag: 'Astronomy' },
      { y: 1928, t: { en: 'Alexander Fleming noted that a mold inhibiting bacterial growth — soon named penicillin — could fight infection.', es: 'Alexander Fleming observó que un moho que inhibía el crecimiento bacteriano —pronto llamado penicilina— podía combatir infecciones.', fr: "Alexander Fleming remarque qu'une moisissure inhibant la croissance bactérienne — bientôt nommée pénicilline — combat l'infection." }, tag: 'Medicine' },
      { y: 1996, t: { en: 'Researchers announced the first confirmed planet orbiting a distant Sun-like star, opening the exoplanet era.', es: 'Investigadores anunciaron el primer planeta confirmado orbitando una estrella lejana similar al Sol, abriendo la era de los exoplanetas.', fr: "Des chercheurs annoncent la première planète confirmée autour d'une étoile lointaine semblable au Soleil, ouvrant l'ère des exoplanètes." }, tag: 'Physics' },
    ],
  };

  const CAT_LABEL = { events: { en: 'Event', es: 'Suceso', fr: 'Événement' }, births: { en: 'Born', es: 'Nacimiento', fr: 'Naissance' }, discoveries: { en: 'Discovery', es: 'Descubrimiento', fr: 'Découverte' } };
  const ON_LABEL = { en: 'On this day', es: 'Tal día como hoy', fr: 'Ce jour-là' };
  const MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  };

  const pool = HISTORY[category] || HISTORY.events;
  const month = now.getMonth();
  const day = now.getDate();
  // Deterministic per-day selection so it "refreshes every morning".
  const seed = (month + 1) * 31 + day;
  const ordered = pool.slice().sort((a, b) => ((a.y * seed) % 97) - ((b.y * seed) % 97));
  const items = ordered.slice(0, count);
  const tr = m => (m && m[lang]) || (m && m.en) || '';
  const mName = (MONTHS[lang] || MONTHS.en)[month];
  const dateStr = lang === 'en' ? mName + ' ' + day : day + ' ' + mName;
  const yearsAgo = items[0] ? now.getFullYear() - items[0].y : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: 22 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 * s, minWidth: 0 }}>
          <div style={{ width: 30 * s, height: 30 * s, borderRadius: 9 * s, background: accent, color: onAcc, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" fill="none" stroke={onAcc} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9.5 * s, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)' }}>{(ON_LABEL[lang] || ON_LABEL.en)}</div>
            <div style={{ fontSize: 14.5 * s, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateStr}</div>
          </div>
        </div>
        {!mini && items[0] && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 19 * s, fontWeight: 800, color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{items[0].y}</div>
            <div style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{yearsAgo} yrs ago</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 * s }}>
        {items.map((it, idx) => (
          <div key={it.y + '-' + idx} style={{ display: 'flex', gap: 11 * s }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 * s }}>
              <div style={{ width: 7 * s, height: 7 * s, borderRadius: '50%', background: accent, boxShadow: '0 0 0 ' + (3 * s) + 'px ' + lighten(accent, luminance(accent) > 0.5 ? -0.04 : 0.34) }} />
              {count > 1 && idx < items.length - 1 && <div style={{ width: 1.5 * s, flex: 1, background: 'var(--w-line)', marginTop: 4 * s, minHeight: 14 * s }} />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, marginBottom: 3 * s }}>
                {count > 1 && <span style={{ fontSize: 11 * s, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>{it.y}</span>}
                <span style={{ fontSize: 8.5 * s, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--w-mut)', padding: (2 * s) + 'px ' + (6 * s) + 'px', border: '1px solid var(--w-line)', borderRadius: 5 * s, lineHeight: 1.3 }}>{(CAT_LABEL[category] || CAT_LABEL.events)[lang] || (CAT_LABEL[category] || CAT_LABEL.events).en} · {it.tag}</span>
              </div>
              <div style={{ fontSize: (count > 1 ? 12.5 : 14.5) * s, lineHeight: 1.42, fontWeight: 500, color: 'var(--w-fg)', letterSpacing: '-0.005em', textWrap: 'pretty', display: '-webkit-box', WebkitLineClamp: count > 1 ? 3 : 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tr(it.t)}</div>
            </div>
          </div>
        ))}
      </div>

      {!mini && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s, borderTop: '1px solid var(--w-line)', paddingTop: 11 * s }}>
          <div style={{ width: 5 * s, height: 5 * s, borderRadius: '50%', background: accent, flexShrink: 0 }} />
          <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>Refreshes every morning · {pool.length} stories on file</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- GITHUB HEATMAP ---------------- */
function GithubHeatmapW({ config: c, accent, s, fontStack, mini }) {
  const username = c.username || 'octocat';
  const scheme = c.scheme || 'github';
  const year = c.year || 2026;
  const showStreak = c.showStreak !== false;

  // ---- Baked sample dataset, seeded per-username so it looks like a real account ----
  const SAMPLE = {
    octocat:    { total: 1843, streak: 47, longest: 91, busy: 0.78, seed: 1337 },
    torvalds:   { total: 3120, streak: 12, longest: 64, busy: 0.92, seed: 4204 },
    gaearon:    { total: 2406, streak: 63, longest: 118, busy: 0.84, seed: 7781 },
    sindresorhus: { total: 4287, streak: 129, longest: 204, busy: 0.96, seed: 9012 },
  };
  const hashName = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
  const profile = SAMPLE[username] || (() => {
    const h = hashName(username);
    return { total: 800 + (h % 2600), streak: 4 + (h % 70), longest: 30 + (h % 150), busy: 0.55 + (h % 40) / 100, seed: h };
  })();

  // ---- Color ramp for the chosen scheme ----
  const baseHue = (() => {
    const map = { github: '#26a641', ocean: '#2563EB', violet: '#7C3AED', sunset: '#EA580C', accent: accent };
    return map[scheme] || '#26a641';
  })();
  const levelColor = (lvl) => {
    if (lvl <= 0) return 'var(--w-line)';
    const frac = lvl / 4;
    return lighten(baseHue, (1 - frac) * 0.74);
  };

  // ---- Seeded 7 x 53 grid (deterministic, no network) ----
  const COLS = mini ? 30 : 53;
  const rand = (() => { let st = profile.seed >>> 0; return () => { st ^= st << 13; st ^= st >>> 17; st ^= st << 5; st >>>= 0; return st / 4294967295; }; })();
  const grid = useMemo(() => {
    const weeks = [];
    for (let w = 0; w < COLS; w++) {
      const col = [];
      // weekday bias: slightly less activity on weekends, a gentle seasonal swell mid-year
      const seasonal = 0.55 + 0.45 * Math.sin((w / COLS) * Math.PI);
      for (let d = 0; d < 7; d++) {
        const weekendDamp = (d === 0 || d === 6) ? 0.55 : 1;
        const r = rand();
        const score = r * profile.busy * seasonal * weekendDamp;
        let lvl = 0;
        if (score > 0.62) lvl = 4;
        else if (score > 0.46) lvl = 3;
        else if (score > 0.30) lvl = 2;
        else if (score > 0.15) lvl = 1;
        col.push(lvl);
      }
      weeks.push(col);
    }
    return weeks;
  }, [profile.seed, COLS, profile.busy]);

  // ---- Month labels mapped across the columns ----
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels = useMemo(() => {
    const out = [];
    let last = -1;
    for (let w = 0; w < COLS; w++) {
      const m = Math.floor((w / COLS) * 12);
      if (m !== last && w > 0) { out.push({ col: w, name: MONTHS[m] }); last = m; }
      else if (w === 0) { out.push({ col: 0, name: MONTHS[0] }); last = 0; }
    }
    return out;
  }, [COLS]);

  const fmt = (n) => n.toLocaleString('en-US');

  const GAP = 3 * s;
  const CELL = (mini ? 9 : 11) * s;
  const RAD = 2.5 * s;
  const STEP = CELL + GAP;
  const gridW = COLS * STEP - GAP;
  const dows = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const labelW = mini ? 0 : 26 * s;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 * s, padding: (mini ? 14 : 18) * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 * s, minWidth: 0 }}>
          <span style={{ width: 26 * s, height: 26 * s, borderRadius: 99, flexShrink: 0, display: 'grid', placeItems: 'center', background: baseHue, color: onColor(baseHue) }}>
            <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.34 9.34 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" /></svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5 * s, fontWeight: 600, color: 'var(--w-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
            <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(profile.total)} contributions in {year}</div>
          </div>
        </div>
        {showStreak && !mini && (
          <div style={{ display: 'flex', gap: 14 * s, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 18 * s, fontWeight: 700, lineHeight: 1, color: accent, fontVariantNumeric: 'tabular-nums' }}>{profile.streak}</div>
              <div style={{ fontSize: 9.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>streak</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 18 * s, fontWeight: 700, lineHeight: 1, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{profile.longest}</div>
              <div style={{ fontSize: 9.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>best</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ overflow: 'hidden' }}>
        <svg width="100%" viewBox={`0 0 ${labelW + gridW} ${(mini ? 0 : 12 * s) + 7 * STEP - GAP}`} style={{ display: 'block', maxWidth: labelW + gridW }}>
          {!mini && monthLabels.map((m) => (
            <text key={'m' + m.col} x={labelW + m.col * STEP} y={9 * s} fontSize={9.5 * s} fill="var(--w-mut)" fontWeight="600" fontFamily={fontStack}>{m.name}</text>
          ))}
          {!mini && dows.map((dl, di) => dl ? (
            <text key={'d' + di} x={labelW - 6 * s} y={(mini ? 0 : 12 * s) + di * STEP + CELL * 0.78} fontSize={9 * s} fill="var(--w-mut)" fontWeight="600" textAnchor="end" fontFamily={fontStack}>{dl}</text>
          ) : null)}
          {grid.map((col, wi) => col.map((lvl, di) => (
            <rect key={wi + '-' + di}
              x={labelW + wi * STEP}
              y={(mini ? 0 : 12 * s) + di * STEP}
              width={CELL} height={CELL} rx={RAD} ry={RAD}
              fill={levelColor(lvl)} />
          )))}
        </svg>
      </div>

      {!mini && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 * s }}>
          <span style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={'lg' + l} style={{ width: CELL, height: CELL, borderRadius: RAD, background: levelColor(l), display: 'inline-block' }} />
          ))}
          <span style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>More</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- GITHUB STARS ---------------- */
function GithubStarsW({ config: c, accent, s, fontStack, mini }) {
  const REPOS = {
    'facebook/react': { stars: 232400, forks: 47600, watchers: 6500, lang: 'JavaScript', langColor: '#f1e05a', desc: 'The library for web and native user interfaces', spark: [180, 184, 189, 191, 196, 202, 205, 210, 214, 219, 223, 228, 230, 232] },
    'vercel/next.js': { stars: 128900, forks: 27400, watchers: 1400, lang: 'JavaScript', langColor: '#f1e05a', desc: 'The React Framework for the Web', spark: [98, 102, 106, 109, 113, 116, 118, 121, 123, 125, 126, 127, 128, 129] },
    'tailwindlabs/tailwindcss': { stars: 84300, forks: 4300, watchers: 950, lang: 'CSS', langColor: '#563d7c', desc: 'A utility-first CSS framework for rapid UI development', spark: [62, 65, 67, 70, 72, 74, 76, 78, 79, 81, 82, 83, 84, 84] },
    'denoland/deno': { stars: 99100, forks: 5500, watchers: 1700, lang: 'Rust', langColor: '#dea584', desc: 'A modern runtime for JavaScript and TypeScript', spark: [88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 98, 99, 99] }
  };
  const d = REPOS[c.repo] || REPOS['facebook/react'];
  const [owner, name] = (c.repo || 'facebook/react').split('/');

  // animated star count
  const target = d.stars;
  const [shown, setShown] = useState(() => c.animate ? Math.round(target * 0.82) : target);
  useEffect(() => {
    if (!c.animate) { setShown(target); return; }
    let raf, start;
    const from = Math.round(target * 0.82);
    setShown(from);
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 1100, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (target - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, c.animate]);

  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
  const fmtFull = (n) => n.toLocaleString('en-US');

  // sparkline path
  const sp = d.spark;
  const spMin = Math.min(...sp), spMax = Math.max(...sp);
  const spW = 100, spH = 30;
  const spPath = sp.map((v, i) => {
    const x = (i / (sp.length - 1)) * spW;
    const y = spH - ((v - spMin) / (spMax - spMin || 1)) * spH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const spArea = spPath + ` L${spW},${spH} L0,${spH} Z`;
  const weekGain = d.spark[d.spark.length - 1] - d.spark[d.spark.length - 2];

  const Stat = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s }}>
      <span style={{ display: 'inline-flex', color: 'var(--w-mut)' }}>{icon}</span>
      <span style={{ fontSize: 13 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</span>
      <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{label}</span>
    </div>
  );

  const StarIcon = ({ sz, col, fill }) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill={fill ? col : 'none'} stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.55l-5.9 3.1 1.13-6.57-4.78-4.66 6.6-.96z" />
    </svg>
  );
  const ForkIcon = ({ sz, col }) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <circle cx="6" cy="5" r="2.2" /><circle cx="18" cy="5" r="2.2" /><circle cx="12" cy="19" r="2.2" />
      <path d="M6 7.2v3.3a3 3 0 003 3h6a3 3 0 003-3V7.2M12 13.5v3.3" />
    </svg>
  );
  const EyeIcon = ({ sz, col }) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.6" />
    </svg>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: (mini ? 9 : 12) * s, padding: (mini ? 14 : 16) * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, minWidth: 0 }}>
          <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" fill="var(--w-mut)" style={{ display: 'block', flexShrink: 0 }}>
            <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.6 3 8.5 7.2 9.9.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.4-3.5-1.4-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.3-.3-4.7-1.2-4.7-5.2 0-1.1.4-2 1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 015 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.8 1 1.7 1 2.8 0 4-2.4 4.9-4.7 5.2.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4.2-1.4 7.2-5.3 7.2-9.9C22.5 6.2 17.8 1.5 12 1.5z" />
          </svg>
          <span style={{ fontSize: 12.5 * s, color: 'var(--w-mut)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {owner} / <span style={{ color: 'var(--w-fg)', fontWeight: 700 }}>{name}</span>
          </span>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 * s, fontSize: 10 * s, fontWeight: 600, color: 'var(--w-mut)', flexShrink: 0 }}>
          <span style={{ width: 8 * s, height: 8 * s, borderRadius: '50%', background: d.langColor, display: 'inline-block' }} />
          {d.lang}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 * s }}>
          <div style={{ width: (mini ? 34 : 40) * s, height: (mini ? 34 : 40) * s, borderRadius: 11 * s, background: lighten(accent, 0.82), display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <StarIcon sz={(mini ? 19 : 23) * s} col={accent} fill />
          </div>
          <div>
            <span style={{ fontSize: (mini ? 26 : 33) * s, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{fmtFull(shown)}</span>
            <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600, marginTop: 3 * s, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Stars · +{weekGain}k this week</div>
          </div>
        </div>
        {!mini && (
          <svg width={spW * s * 0.9} height={spH * s} viewBox={`0 0 ${spW} ${spH}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id="ghsparkfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={spArea} fill="url(#ghsparkfill)" />
            <path d={spPath} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>

      {(c.showForks ?? true) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 * s, borderTop: '1px solid var(--w-line)', paddingTop: (mini ? 9 : 11) * s }}>
          <Stat icon={<ForkIcon sz={13 * s} col="var(--w-mut)" />} label="forks" value={fmt(d.forks)} />
          <Stat icon={<EyeIcon sz={13 * s} col="var(--w-mut)" />} label="watching" value={fmt(d.watchers)} />
        </div>
      )}
    </div>
  );
}

/* ---------------- NPM DOWNLOADS ---------------- */
function NpmDownloadsW({ config: c, accent, s, fontStack, mini }) {
  const NPM_DATA = {
    'react': {
      week: 38420511, month: 162880444, day: 6120483,
      hist: [31204113, 33890217, 35012988, 34221904, 36880412, 37210556, 38420511],
      prev: 36980142
    },
    'next': {
      week: 9120488, month: 38640221, day: 1480912,
      hist: [7480221, 7910334, 8120556, 8540912, 8730104, 8990417, 9120488],
      prev: 8810233
    },
    'vue': {
      week: 5240118, month: 22180944, day: 842017,
      hist: [4980221, 5010334, 5120118, 5080912, 5190104, 5210417, 5240118],
      prev: 5190882
    },
    'svelte': {
      week: 1042311, month: 4380122, day: 168044,
      hist: [812204, 868917, 902118, 948012, 982104, 1010417, 1042311],
      prev: 996142
    },
    'lodash': {
      week: 51280944, month: 218440122, day: 8210488,
      hist: [49880221, 50110334, 50620118, 50980912, 51190104, 51080417, 51280944],
      prev: 51420882
    },
    'axios': {
      week: 61420118, month: 261880944, day: 9840017,
      hist: [57880221, 58910334, 59820118, 60480912, 61090104, 61210417, 61420118],
      prev: 60810882
    },
    'zod': {
      week: 14820488, month: 62180221, day: 2380912,
      hist: [11480221, 12110334, 12820118, 13480912, 14090104, 14510417, 14820488],
      prev: 13980233
    },
    'typescript': {
      week: 72180944, month: 308440122, day: 11620488,
      hist: [68880221, 69910334, 70620118, 71080912, 71690104, 71910417, 72180944],
      prev: 71240882
    }
  };

  const key = (c.package || 'react').trim().toLowerCase();
  const d = NPM_DATA[key] || NPM_DATA['react'];
  const period = c.period || 'week';
  const periodLabel = period === 'day' ? 'Daily' : period === 'month' ? 'Monthly' : 'Weekly';
  const value = period === 'day' ? d.day : period === 'month' ? d.month : d.week;

  const delta = d.week - d.prev;
  const pct = d.prev ? (delta / d.prev) * 100 : 0;
  const up = delta >= 0;

  const fmt = n => {
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, '') + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return String(n);
  };

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const max = Math.max(...d.hist);
  const min = Math.min(...d.hist);
  const range = max - min || 1;

  const W = 240, H = 38;
  const n = d.hist.length;
  const gap = 6;
  const bw = (W - gap * (n - 1)) / n;
  const trendColor = up ? accent : '#e0564f';
  const showChart = c.showChart && !mini;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 * s, padding: 16 * s, fontFamily: fontStack, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 * s, minWidth: 0 }}>
          <div style={{ width: 26 * s, height: 26 * s, borderRadius: 6 * s, background: accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="13" rx="1.5" fill={onColor(accent)} />
              <path d="M8 10v5M11.5 10v5M11.5 13h2.2M15 10v5M18 10v5M15 10h3" stroke={accent} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14 * s, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{key}</div>
            <div style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{periodLabel} installs</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 * s, color: trendColor, fontSize: 12 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          <svg width={11 * s} height={11 * s} viewBox="0 0 24 24" fill="none" stroke={trendColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          {Math.abs(pct).toFixed(1)}%
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 * s }}>
        <div style={{ fontSize: (mini ? 26 : 30) * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</div>
        <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value.toLocaleString('en-US')}</div>
      </div>

      {showChart && (
        <div style={{ borderTop: '1px solid var(--w-line)', paddingTop: 8 * s }}>
          <svg width="100%" viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
            {d.hist.map((v, i) => {
              const h = 6 + ((v - min) / range) * (H - 6);
              const x = i * (bw + gap);
              const y = H - h;
              const isLast = i === n - 1;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={bw} height={h} rx={2.5}
                    fill={isLast ? accent : lighten(accent, 0.55)} />
                  <text x={x + bw / 2} y={H + 11} textAnchor="middle"
                    fontSize="9" fontWeight="600" fill="var(--w-mut)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}>{days[i]}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

/* ---------------- LATEST RELEASE ---------------- */
function LatestReleaseW({ config: c, accent, s, fontStack, mini }) {
  // Baked-in sample data. No network. Config SELECTS a release by source+id.
  const RELEASES = {
    npm: {
      astro:   { name: 'astro',            ver: 'v5.9.2',  date: 'May 28, 2026', kind: 'package', mgr: 'npm',  cmd: 'npm i astro@5.9.2',          notes: ['View Transitions stabilized', 'Faster cold builds (~18%)', 'Fix: hydration mismatch on islands'], prev: 'v5.9.1', stable: true },
      vite:    { name: 'vite',             ver: 'v6.3.0',  date: 'May 21, 2026', kind: 'package', mgr: 'npm',  cmd: 'npm i vite@6.3.0',           notes: ['Rolldown opt-in bundler', 'New environment API', 'Deprecate legacy CJS entry'], prev: 'v6.2.4', stable: true },
      zod:     { name: 'zod',              ver: 'v4.0.0',  date: 'Jun 01, 2026', kind: 'package', mgr: 'npm',  cmd: 'npm i zod@4.0.0',            notes: ['10x faster parsing', 'Tree-shakeable core', 'Breaking: error map signature'], prev: 'v3.25.1', stable: true },
    },
    github: {
      'withastro/astro': { name: 'withastro/astro', ver: 'v5.9.2', date: 'May 28, 2026', kind: 'repo', mgr: 'npm', cmd: 'npm i astro@5.9.2', notes: ['View Transitions stabilized', 'Faster cold builds (~18%)', 'Fix: hydration mismatch on islands'], prev: 'v5.9.1', stable: true },
      'denoland/deno':   { name: 'denoland/deno',   ver: 'v2.3.1', date: 'May 30, 2026', kind: 'repo', mgr: 'brew', cmd: 'brew upgrade deno', notes: ['Node compat: 96% of npm top-1k', 'deno deploy edge regions +4', 'Fix: permissions prompt on Windows'], prev: 'v2.3.0', stable: true },
    },
    pypi: {
      fastapi: { name: 'fastapi', ver: 'v0.115.0', date: 'May 19, 2026', kind: 'package', mgr: 'pip', cmd: 'pip install fastapi==0.115.0', notes: ['Pydantic v2.10 support', 'Async lifespan helpers', 'Docs: OpenAPI 3.1 examples'], prev: 'v0.114.2', stable: true },
      httpx:   { name: 'httpx',   ver: 'v0.28.0',  date: 'May 12, 2026', kind: 'package', mgr: 'pip', cmd: 'pip install httpx==0.28.0',   notes: ['HTTP/2 by default', 'Trio backend updates', 'Fix: proxy env parsing'], prev: 'v0.27.2', stable: false },
    },
  };
  const src = RELEASES[c.source] || RELEASES.npm;
  const d = src[c.id] || src[Object.keys(src)[0]] || RELEASES.npm.astro;
  const installCmd = (c.installCmd && c.installCmd.trim()) ? c.installCmd.trim() : d.cmd;

  const [copied, setCopied] = useState(false);
  const tref = useRef(null);
  const copy = () => {
    try { navigator.clipboard.writeText(installCmd); } catch (e) {}
    setCopied(true);
    clearTimeout(tref.current);
    tref.current = setTimeout(() => setCopied(false), 1400);
  };
  useEffect(() => () => clearTimeout(tref.current), []);

  const soft = lighten(accent, 0.86);
  const fg = onColor(accent);

  const SrcGlyph = ({ kind }) => {
    if (kind === 'repo') return (
      <svg width={18 * s} height={18 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3v12a3 3 0 0 0 3 3h9" /><path d="M6 15a3 3 0 0 0-3 3 3 3 0 0 0 3 3" /><path d="M18 9V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v9" /><circle cx="18" cy="12" r="2.2" />
      </svg>
    );
    return (
      <svg width={18 * s} height={18 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8 12 3 3 8v8l9 5 9-5Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
      </svg>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 13 * s, padding: 20 * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 * s, minWidth: 0 }}>
          <span style={{ width: 34 * s, height: 34 * s, borderRadius: 9 * s, flexShrink: 0, display: 'grid', placeItems: 'center', background: soft, color: accent }}>
            <SrcGlyph kind={d.kind} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5 * s, fontWeight: 650, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
            <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.source || 'npm'}</div>
          </div>
        </div>
        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 * s, height: 24 * s, padding: `0 ${10 * s}px`, borderRadius: 99, background: accent, color: fg, fontSize: 12.5 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {d.stable ? <svg width={9 * s} height={9 * s} viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" fill={fg} /></svg> : null}
          {d.ver}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s, fontSize: 11.5 * s, color: 'var(--w-mut)', fontWeight: 500 }}>
        <svg width={13 * s} height={13 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>Released {d.date}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>from {d.prev}</span>
      </div>

      {!mini && c.showNotes !== false && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * s, borderTop: '1px solid var(--w-line)', paddingTop: 11 * s }}>
          {d.notes.slice(0, 3).map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 * s, fontSize: 12 * s, lineHeight: 1.35, color: 'var(--w-fg)' }}>
              <span style={{ marginTop: 5.5 * s, width: 4.5 * s, height: 4.5 * s, borderRadius: 99, background: accent, flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>{n}</span>
            </div>
          ))}
        </div>
      )}

      {c.showInstall !== false && (
        <button onClick={copy} title="Copy install command"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s, width: '100%', textAlign: 'left',
            height: 38 * s, padding: `0 ${12 * s}px`, borderRadius: 9 * s, border: '1px solid var(--w-line)', background: 'var(--w-line)', color: 'var(--w-fg)', cursor: 'pointer' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 * s, minWidth: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 * s, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>$</span>
            {installCmd}
          </span>
          <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center', color: copied ? accent : 'var(--w-mut)' }}>
            {copied
              ? <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
              : <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>}
          </span>
        </button>
      )}
    </div>
  );
}

/* ---------------- BUILD STATUS ---------------- */
function BuildStatusW({ config: c, accent, s, fontStack, mini }) {
  // ---- Baked-in sample CI data, keyed by status. NO network. ----
  const REPO = c.repo || 'acme/payments-api';
  const BRANCH = c.branch || 'main';
  const PROVIDER = c.provider || 'github';
  const STATUS = c.status || 'passing';

  const PROVIDERS = {
    github: 'GitHub Actions',
    gitlab: 'GitLab CI',
    circle: 'CircleCI',
  };

  // Each run: a believable pipeline result with stages + duration
  const RESULTS = {
    passing: {
      label: 'Passing', tone: '#26a641', sym: 'check',
      sha: 'a1f4c92', msg: 'feat: cache settlement batches',
      author: 'mira', mins: 6, dur: '4m 12s', mins_label: '6 min ago',
      stages: [['Install', 'ok', '18s'], ['Lint', 'ok', '11s'], ['Test', 'ok', '2m 40s'], ['Build', 'ok', '1m 03s'], ['Deploy', 'ok', '0s']],
    },
    failing: {
      label: 'Failing', tone: '#e5534b', sym: 'x',
      sha: 'd7b30e1', msg: 'fix: retry idempotency key',
      author: 'jules', mins: 14, dur: '2m 51s', mins_label: '14 min ago',
      stages: [['Install', 'ok', '17s'], ['Lint', 'ok', '10s'], ['Test', 'fail', '2m 24s'], ['Build', 'skip', '—'], ['Deploy', 'skip', '—']],
    },
    running: {
      label: 'Running', tone: '#d9a32a', sym: 'spin',
      sha: '0c9ea58', msg: 'chore: bump prisma to 5.8',
      author: 'theo', mins: 0, dur: '1m 09s', mins_label: 'just now',
      stages: [['Install', 'ok', '16s'], ['Lint', 'ok', '12s'], ['Test', 'run', '41s'], ['Build', 'wait', '—'], ['Deploy', 'wait', '—']],
    },
  };

  const d = RESULTS[STATUS] || RESULTS.passing;

  // Last 14 builds as colored bars (seeded, deterministic) — current run = last bar
  const HISTORY = [1, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, STATUS === 'failing' ? 0 : STATUS === 'running' ? 2 : 1];
  const barColor = (v) => v === 1 ? '#26a641' : v === 0 ? '#e5534b' : '#d9a32a';

  const ratio = (() => {
    const pass = HISTORY.filter(v => v === 1).length;
    return Math.round((pass / HISTORY.length) * 100);
  })();

  const stageColor = (st) => st === 'ok' ? '#26a641' : st === 'fail' ? '#e5534b' : st === 'run' ? '#d9a32a' : 'var(--w-mut)';

  const StatusGlyph = ({ kind, size }) => {
    if (kind === 'check') return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={onColor(d.tone)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    );
    if (kind === 'x') return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={onColor(d.tone)} strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
    );
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={onColor(d.tone)} strokeWidth="2.6" strokeLinecap="round" style={{ animation: 'nc-bs-spin 0.9s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>
    );
  };

  const tinyDur = mini;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 13 * s, padding: 20 * s, fontVariantNumeric: 'tabular-nums' }}>
      <style>{`@keyframes nc-bs-spin{to{transform:rotate(360deg)}}@keyframes nc-bs-pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>

      {/* Header: repo + branch + provider */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, fontSize: 13.5 * s, fontWeight: 650, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <svg width={13 * s} height={13 * s} viewBox="0 0 24 24" fill="none" stroke="var(--w-mut)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="3" /><path d="M6 9v6M18 9v6M6 12h2a4 4 0 0 1 4 4v0M18 12h-2a4 4 0 0 0-4 4v0" /></svg>
            {REPO}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s, marginTop: 4 * s, fontSize: 11.5 * s, color: 'var(--w-mut)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3.5 * s, fontWeight: 600 }}>
              <svg width={11 * s} height={11 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
              {BRANCH}
            </span>
            <span style={{ opacity: 0.45 }}>·</span>
            <span>{PROVIDERS[PROVIDER] || PROVIDERS.github}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 40 * s, height: 40 * s, borderRadius: 11 * s, background: d.tone, boxShadow: `0 ${4 * s}px ${14 * s}px ${d.tone}3a` }}>
          <div style={d.sym === 'spin' ? { animation: 'nc-bs-spin 0.9s linear infinite', display: 'flex' } : { display: 'flex' }}>
            <StatusGlyph kind={d.sym} size={22 * s} />
          </div>
        </div>
      </div>

      {/* Big status line */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 * s, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 27 * s, fontWeight: 750, letterSpacing: '-0.02em', lineHeight: 1, color: d.tone, animation: d.sym === 'spin' ? 'nc-bs-pulse 1.4s ease-in-out infinite' : 'none' }}>{d.label}</div>
        <div style={{ fontSize: 12 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{d.dur} · {d.mins_label}</div>
      </div>

      {/* Commit chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s, fontSize: 11.5 * s, minWidth: 0 }}>
        <span style={{ flexShrink: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 650, fontSize: 11 * s, padding: `${3 * s}px ${7 * s}px`, borderRadius: 6 * s, background: lighten(accent, 0.86), color: accent, border: `1px solid ${lighten(accent, 0.72)}` }}>{d.sha}</span>
        <span style={{ color: 'var(--w-fg)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{d.msg}</span>
      </div>

      {/* Stage pipeline */}
      {!mini && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 5 * s }}>
          {d.stages.map(([name, st, t], i) => (
            <div key={name} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 * s, minWidth: 0 }}>
              <div style={{ height: 4 * s, borderRadius: 3 * s, background: st === 'wait' || st === 'skip' ? 'var(--w-line)' : stageColor(st), animation: st === 'run' ? 'nc-bs-pulse 1.2s ease-in-out infinite' : 'none' }} />
              <div style={{ fontSize: 9.5 * s, fontWeight: 600, color: st === 'wait' || st === 'skip' ? 'var(--w-mut)' : 'var(--w-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontVariantNumeric: 'tabular-nums' }}>{t}</div>
            </div>
          ))}
        </div>
      )}

      {/* History bars + success rate */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 * s, borderTop: '1px solid var(--w-line)', paddingTop: 11 * s }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 * s, height: 22 * s }}>
          {HISTORY.map((v, i) => (
            <div key={i} style={{ width: 5 * s, height: (v === 1 ? 22 : v === 2 ? 16 : 13) * s, borderRadius: 2 * s, background: barColor(v), opacity: i === HISTORY.length - 1 ? 1 : 0.78, animation: i === HISTORY.length - 1 && v === 2 ? 'nc-bs-pulse 1.2s ease-in-out infinite' : 'none' }} />
          ))}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15 * s, fontWeight: 700, lineHeight: 1, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{ratio}%</div>
          <div style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 600, marginTop: 2 * s }}>last 14 runs</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UPTIME MONITOR ---------------- */
function UptimeMonitorW({ config: c, accent, s, fontStack, mini }) {
  // ---- baked sample data: rolling 24h status per service. NO network. ----
  const SAMPLE = {
    'api.acme.io': {
      label: 'API', url: 'https://api.acme.io/health', ms: 142, region: 'us-east',
      hours: [1,1,1,1,1,1,1,1,0.82,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    },
    'app.acme.io': {
      label: 'Web App', url: 'https://app.acme.io', ms: 88, region: 'global',
      hours: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    },
    'cdn.acme.io': {
      label: 'CDN', url: 'https://cdn.acme.io', ms: 31, region: 'edge',
      hours: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    },
    'db.acme.io': {
      label: 'Database', url: 'https://db.acme.io', ms: 9, region: 'us-east',
      hours: [1,1,1,1,1,0,0,0.5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    },
    'auth.acme.io': {
      label: 'Auth', url: 'https://auth.acme.io', ms: 167, region: 'us-east',
      hours: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.7,1,1,1,1]
    }
  };
  const KEYS = Object.keys(SAMPLE);

  const picked = (() => {
    const eps = Array.isArray(c.endpoints) ? c.endpoints.filter(Boolean) : null;
    if (eps && eps.length) {
      return eps.slice(0, 6).map((ep, i) => {
        const host = String(ep).replace(/^https?:\/\//, '').replace(/\/.*$/, '') || KEYS[i % KEYS.length];
        const base = SAMPLE[host] || SAMPLE[KEYS[i % KEYS.length]];
        return { ...base, host, label: base.label && SAMPLE[host] ? base.label : (host.split('.')[0] || base.label) };
      });
    }
    return KEYS.map(k => ({ ...SAMPLE[k], host: k }));
  })();

  const upPct = h => 100 * h.reduce((a, b) => a + b, 0) / h.length;
  const stateOf = h => { const p = upPct(h); return p >= 99.95 ? 'up' : p >= 95 ? 'degraded' : 'down'; };

  const UP = accent;
  const AMBER = '#E0A33E';
  const DOWN = '#D9534F';
  const colorOf = st => st === 'up' ? UP : st === 'degraded' ? AMBER : DOWN;
  const cellColor = r => r >= 0.999 ? UP : r > 0 ? AMBER : DOWN;

  // ---- c.bars: number of status tick squares per row (resample hours -> N) ----
  const barCount = Math.max(4, Math.min(60, Math.round(Number(c.bars) || 30)));
  const resample = (hours, n) => {
    const src = (hours && hours.length) ? hours : [1];
    const out = [];
    for (let i = 0; i < n; i++) {
      // map output bucket i -> source range, take worst (min) value in range
      const a = Math.floor(i * src.length / n);
      const b = Math.max(a + 1, Math.floor((i + 1) * src.length / n));
      let min = 1;
      for (let j = a; j < b && j < src.length; j++) { const r = src[j]; if (r != null && r < min) min = r; }
      out.push(min);
    }
    return out;
  };

  const overall = (() => {
    const all = picked.reduce((a, m) => a.concat(m.hours), []);
    return upPct(all);
  })();
  const anyDown = picked.some(m => stateOf(m.hours) === 'down');
  const anyDeg = picked.some(m => stateOf(m.hours) === 'degraded');
  const sysState = anyDown ? 'down' : anyDeg ? 'degraded' : 'up';
  const sysLabel = sysState === 'up' ? 'All systems operational' : sysState === 'degraded' ? 'Degraded performance' : 'Major outage';
  const sysColor = colorOf(sysState);

  const title = c.title || 'Status';
  // ---- c.interval: window label surfaced in the UI ----
  const interval = (c.interval != null && String(c.interval).trim()) ? String(c.interval).trim() : '24 hours';

  const maxRows = mini ? 3 : 4;
  const rows = picked.slice(0, maxRows);
  const pad = (mini ? 14 : 16) * s;
  const gap = (mini ? 7 : 9) * s;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap, padding: pad, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s, minWidth: 0 }}>
          <span style={{ width: 8 * s, height: 8 * s, borderRadius: 99, background: sysColor, boxShadow: `0 0 0 ${3 * s}px ${sysColor}22`, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5 * s, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          {!mini && <span style={{ fontSize: 11 * s, color: sysState === 'up' ? 'var(--w-mut)' : sysColor, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sysLabel}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 * s, flexShrink: 0 }}>
          <span style={{ fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 500, whiteSpace: 'nowrap' }}>live</span>
          <span style={{ fontSize: 11.5 * s, fontWeight: 600, color: sysColor, fontVariantNumeric: 'tabular-nums' }}>{overall.toFixed(2)}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 1.5 * s, height: 16 * s, alignItems: 'stretch' }}>
        {resample(picked.reduce((acc, m) => acc, null) ? null : null, 0) /* no-op guard removed below */ }
        {(() => {
          // aggregate worst-of across all services, then resample to barCount squares
          const n = picked[0] ? picked[0].hours.length : 24;
          const agg = [];
          for (let i = 0; i < n; i++) {
            let min = 1;
            picked.forEach(m => { const r = m.hours[i]; if (r != null && r < min) min = r; });
            agg.push(min);
          }
          return resample(agg, barCount).map((r, hi) => (
            <div key={hi} title={`${barCount - 1 - hi} / ${barCount} ago`} style={{ flex: 1, borderRadius: 1.5 * s, background: cellColor(r), opacity: r >= 0.999 ? 1 : 0.92, minWidth: 0 }} />
          ));
        })()}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: gap * 0.7, borderTop: '1px solid var(--w-line)', paddingTop: gap * 0.85 }}>
        {rows.map((m, mi) => {
          const st = stateOf(m.hours);
          const col = colorOf(st);
          const pct = upPct(m.hours);
          const ticks = resample(m.hours, barCount);
          return (
            <div key={m.host + mi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * s }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 * s, minWidth: 0, flexShrink: 0 }}>
                <span style={{ width: 6 * s, height: 6 * s, borderRadius: 99, background: col, flexShrink: 0 }} />
                <span style={{ fontSize: 12 * s, fontWeight: 600, color: 'var(--w-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 84 * s }}>{m.label}</span>
                {!mini && <span style={{ fontSize: 10 * s, color: 'var(--w-mut)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{m.ms}ms</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 1 * s, height: 8 * s, flex: 1, minWidth: 0, maxWidth: 220 * s, alignItems: 'stretch' }}>
                  {ticks.map((r, ti) => (
                    <div key={ti} style={{ flex: 1, borderRadius: 1 * s, background: cellColor(r), opacity: r >= 0.999 ? 0.9 : 0.95, minWidth: 0 }} />
                  ))}
                </div>
                <span style={{ fontSize: 10.5 * s, fontWeight: 600, color: st === 'up' ? 'var(--w-mut)' : col, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{pct.toFixed(pct >= 99.995 ? 0 : 2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- SUBSCRIBER COUNT ---------------- */
function SubscriberCountW({ config: c, accent, s, fontStack, mini }) {
  // ---- Baked-in sample data, keyed by platform. NO network. ----
  const CHANNELS = {
    youtube: {
      label: 'YouTube', tint: '#FF0000', metricLabel: 'subscribers',
      '@mkbhd':       { name: 'Marques Brownlee', initials: 'MB', count: 19200000, delta: 8400,  spark: [62,70,55,80,90,72,110,98,130,120,150,142,170] },
      '@channel':     { name: 'Your Channel',      initials: 'YC', count: 12487,    delta: 142,   spark: [10,14,9,18,22,17,28,24,33,30,41,38,52] },
      '@veritasium':  { name: 'Veritasium',        initials: 'VS', count: 16800000, delta: 5200,  spark: [40,52,48,66,60,78,72,90,84,102,96,118,112] },
    },
    twitch: {
      label: 'Twitch', tint: '#9146FF', metricLabel: 'followers',
      '@channel':     { name: 'Your Stream',       initials: 'YS', count: 8423,     delta: 96,    spark: [8,12,7,15,11,19,16,24,20,29,25,34,31] },
      '@pokimane':    { name: 'pokimane',          initials: 'PK', count: 9300000,  delta: 1800,  spark: [30,42,38,55,50,68,62,80,74,92,86,104,98] },
    },
    tiktok: {
      label: 'TikTok', tint: '#00F2EA', metricLabel: 'followers',
      '@channel':     { name: 'Your Profile',      initials: 'YP', count: 54210,    delta: 980,   spark: [20,34,28,48,42,60,55,74,68,88,82,100,95] },
      '@khaby.lame':  { name: 'Khaby Lame',        initials: 'KL', count: 162000000, delta: 24000, spark: [50,66,60,82,76,98,92,114,108,130,124,146,140] },
    },
    patreon: {
      label: 'Patreon', tint: '#FF424D', metricLabel: 'patrons',
      '@channel':     { name: 'Your Page',         initials: 'YP', count: 1284,     delta: 11,    spark: [4,6,5,9,7,12,10,15,13,18,16,21,19] },
    },
  };

  const platform = CHANNELS[c.platform] ? c.platform : 'youtube';
  const grp = CHANNELS[platform];
  const handle = (c.handle && grp[c.handle]) ? c.handle : (grp['@channel'] ? '@channel' : Object.keys(grp).find(k => k.startsWith('@')));
  const ch = grp[handle] || grp['@channel'];
  const tint = accent;

  // ---- Animated roll-up toward the real count (odometer feel, NO network) ----
  const [shown, setShown] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) { setShown(ch.count); return; }
    startedRef.current = true;
    const target = ch.count, dur = 1400, t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(target * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setShown(target);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [ch.count]);

  const fmtCompact = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(0) + 'K';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };
  const fmtFull = (n) => n.toLocaleString('en-US');

  const useOdometer = (c.style || 'odometer') === 'odometer';
  const big = useOdometer ? fmtFull(shown) : fmtCompact(shown);
  const onAcc = onColor(tint);

  // ---- Sparkline path from sample array ----
  const spark = ch.spark;
  const sw = 132, sh = 30;
  const sMin = Math.min(...spark), sMax = Math.max(...spark);
  const span = (sMax - sMin) || 1;
  const pts = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * sw;
    const y = sh - ((v - sMin) / span) * (sh - 3) - 1.5;
    return [x, y];
  });
  const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const areaPath = linePath + ` L${sw} ${sh} L0 ${sh} Z`;
  const gid = 'sc_sp_' + platform;

  const avatarSize = (mini ? 32 : 42) * s;
  const bigSize = (mini ? 34 : useOdometer ? 40 : 52) * s;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: (mini ? 8 : 14) * s, padding: (mini ? 16 : 22) * s, fontFamily: fontStack }}>
      {/* header: avatar + name/handle + platform pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 * s }}>
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${lighten(tint, 0.22)}, ${tint})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: onAcc, fontWeight: 700, fontSize: avatarSize * 0.38, letterSpacing: '-0.01em',
          boxShadow: `0 0 0 ${2 * s}px var(--w-line)`,
        }}>{ch.initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: (mini ? 13 : 14.5) * s, fontWeight: 600, color: 'var(--w-fg)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</div>
          <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{handle}</div>
        </div>
        {!mini && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, padding: `${4 * s}px ${9 * s}px`, borderRadius: 99, background: 'var(--w-line)', flexShrink: 0 }}>
            <span style={{ width: 6 * s, height: 6 * s, borderRadius: '50%', background: tint, boxShadow: `0 0 ${5 * s}px ${tint}` }} />
            <span style={{ fontSize: 10.5 * s, fontWeight: 600, color: 'var(--w-fg)', letterSpacing: '0.02em' }}>{grp.label}</span>
          </div>
        )}
      </div>

      {/* big number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 * s, flexWrap: 'wrap' }}>
        <span style={{ fontSize: bigSize, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95, color: 'var(--w-fg)', fontVariantNumeric: 'tabular-nums' }}>{big}</span>
        <span style={{ fontSize: 12 * s, fontWeight: 500, color: 'var(--w-mut)', letterSpacing: '0.01em' }}>{grp.metricLabel}</span>
      </div>

      {/* footer: delta + sparkline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 * s, borderTop: '1px solid var(--w-line)', paddingTop: 11 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s }}>
          <svg width={11 * s} height={11 * s} viewBox="0 0 24 24" fill="none" stroke={tint} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l7-7 7 7" /></svg>
          <span style={{ fontSize: 13 * s, fontWeight: 700, color: tint, fontVariantNumeric: 'tabular-nums' }}>+{fmtCompact(ch.delta)}</span>
          <span style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500 }}>today</span>
        </div>
        {!mini && (
          <svg width={sw * s} height={sh * s} viewBox={`0 0 ${sw} ${sh}`} style={{ overflow: 'visible' }} preserveAspectRatio="none">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tint} stopOpacity="0.32" />
                <stop offset="100%" stopColor={tint} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gid})`} />
            <path d={linePath} fill="none" stroke={tint} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.4} fill={tint} />
          </svg>
        )}
      </div>
    </div>
  );
}

/* ---------------- FOLLOWER GOAL ---------------- */
function FollowerGoalW({ config: c, accent, s, fontStack, mini }) {
  // ---- Baked sample data, keyed by platform. NO network. ----
  const DATA = {
    youtube:   { label: 'YouTube',   noun: 'subscribers', current: 84210, perDay: 142, spark: [96, 110, 88, 134, 121, 175, 160], glyph: 'play' },
    instagram: { label: 'Instagram', noun: 'followers',   current: 41880, perDay: 96,  spark: [72, 64, 90, 81, 118, 104, 130], glyph: 'cam' },
    twitter:   { label: 'X',         noun: 'followers',   current: 23740, perDay: 58,  spark: [40, 55, 33, 61, 47, 72, 66], glyph: 'x' },
    tiktok:    { label: 'TikTok',    noun: 'followers',   current: 128400, perDay: 410, spark: [280, 340, 250, 520, 470, 610, 580], glyph: 'note' },
    twitch:    { label: 'Twitch',    noun: 'followers',   current: 12960, perDay: 37,  spark: [24, 30, 19, 41, 33, 52, 44], glyph: 'play' },
    github:    { label: 'GitHub',    noun: 'followers',   current: 6820,  perDay: 14,  spark: [9, 12, 7, 18, 11, 21, 16], glyph: 'code' },
  };

  const key = DATA[c.platform] ? c.platform : 'youtube';
  const d = DATA[key];
  const handle = c.handle || '@channel';
  const goal = Number.isFinite(+c.goal) && +c.goal > 0 ? +c.goal : 100000;
  const style = c.style === 'bar' ? 'bar' : 'ring';

  const current = d.current;
  const noun = d.noun;
  const perDay = d.perDay;
  const remaining = Math.max(0, goal - current);
  const raw = goal === 0 ? 0 : current / goal;
  const pct = Math.max(0, Math.min(1, raw));
  const reached = current >= goal;
  const etaDays = reached ? 0 : Math.ceil(remaining / Math.max(1, perDay));

  // animate the fill in
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    let frame;
    const startT = performance.now();
    const dur = 850;
    const tick = (t) => {
      const k = Math.min(1, (t - startT) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setAnim(pct * eased);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pct]);

  const fmtFull = (n) => Math.round(n).toLocaleString();
  const fmtShort = (n) => {
    const v = Math.round(n);
    if (v >= 1000000) return (v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'K';
    return v.toString();
  };

  const PlatGlyph = ({ size, color }) => {
    const sw = 1.8;
    if (d.glyph === 'play') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}><rect x="3" y="6" width="18" height="12" rx="3.4" stroke={color} strokeWidth={sw} /><path d="M10.4 9.5 L14.6 12 L10.4 14.5 Z" fill={color} /></svg>;
    if (d.glyph === 'cam') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke={color} strokeWidth={sw} /><circle cx="12" cy="12" r="4" stroke={color} strokeWidth={sw} /><circle cx="17" cy="7" r="1.1" fill={color} /></svg>;
    if (d.glyph === 'x') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}><path d="M5 5 L19 19 M19 5 L5 19" stroke={color} strokeWidth={sw + 0.3} strokeLinecap="round" /></svg>;
    if (d.glyph === 'note') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}><circle cx="9" cy="17.5" r="3" stroke={color} strokeWidth={sw} /><path d="M12 17.5 V5 C12 5 12.4 8 16.5 8.4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>;
    if (d.glyph === 'code') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}><path d="M9 7 L4.5 12 L9 17 M15 7 L19.5 12 L15 17" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>;
    return null;
  };

  // sparkline path
  const sp = d.spark;
  const spMax = Math.max(...sp), spMin = Math.min(...sp);
  const spRange = spMax - spMin || 1;
  const spW = 100, spH = 26;
  const spPts = sp.map((v, i) => {
    const x = (i / (sp.length - 1)) * spW;
    const y = spH - 3 - ((v - spMin) / spRange) * (spH - 6);
    return [x, y];
  });
  const spLine = spPts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const spArea = 'M0 ' + spH + ' ' + spPts.map(p => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ' L' + spW + ' ' + spH + ' Z';

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 * s, minWidth: 0 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30 * s, height: 30 * s, borderRadius: 9 * s, background: lighten(accent, 0.82), flexShrink: 0 }}>
        <PlatGlyph size={17 * s} color={accent} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5 * s, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{handle}</div>
        <div style={{ fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 500 }}>{d.label} {noun}</div>
      </div>
    </div>
  );

  const StatPair = (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderTop: '1px solid var(--w-line)', paddingTop: 12 * s }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 * s }}>
        <div style={{ fontSize: 10 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>Now</div>
        <div style={{ fontSize: 19 * s, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmtShort(current)}</div>
      </div>
      <div style={{ width: 1, background: 'var(--w-line)', margin: `2px ${12 * s}px` }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 * s }}>
        <div style={{ fontSize: 10 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>Goal</div>
        <div style={{ fontSize: 19 * s, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: accent }}>{fmtShort(goal)}</div>
      </div>
    </div>
  );

  // ---------- BAR STYLE ----------
  if (style === 'bar') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: 20 * s, fontFamily: fontStack, color: 'var(--w-fg)' }}>
        {Header}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 * s }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 22 * s, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: reached ? accent : 'var(--w-fg)' }}>{Math.round(anim * 100)}<span style={{ fontSize: 13 * s, fontWeight: 600 }}>%</span></span>
            <span style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtFull(current)} / {fmtFull(goal)}</span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: 12 * s, borderRadius: 99, background: 'var(--w-line)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${anim * 100}%`, minWidth: anim > 0 ? 12 * s : 0, borderRadius: 99, background: `linear-gradient(90deg, ${lighten(accent, 0.2)}, ${accent})` }} />
          </div>
        </div>
        {!mini && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 * s }}>
            <div style={{ fontSize: 11.5 * s, color: 'var(--w-mut)', fontWeight: 500, lineHeight: 1.45 }}>
              {reached
                ? <span style={{ color: accent, fontWeight: 600 }}>Milestone reached</span>
                : <><span style={{ color: 'var(--w-fg)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtFull(remaining)}</span> to go · ~{etaDays}d at +{perDay}/day</>}
            </div>
            <svg width={68 * s} height={26 * s} viewBox={`0 0 ${spW} ${spH}`} preserveAspectRatio="none" style={{ flexShrink: 0, overflow: 'visible' }}>
              <path d={spArea} fill={accent} opacity="0.12" />
              <path d={spLine} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={spPts[spPts.length - 1][0]} cy={spPts[spPts.length - 1][1]} r="2.6" fill={accent} />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // ---------- RING STYLE (default) ----------
  const R = 52, CIRC = 2 * Math.PI * R;
  const dim = (mini ? 116 : 138) * s;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: 18 * s, fontFamily: fontStack, color: 'var(--w-fg)' }}>
      {Header}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 * s }}>
        <div style={{ position: 'relative', width: dim, height: dim, flexShrink: 0 }}>
          <svg width={dim} height={dim} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="9" />
            <circle cx="64" cy="64" r={R} fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - anim)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 * s }}>
            <div style={{ fontSize: 27 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: reached ? accent : 'var(--w-fg)' }}>{Math.round(anim * 100)}<span style={{ fontSize: 14 * s, fontWeight: 600 }}>%</span></div>
            <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtShort(current)} / {fmtShort(goal)}</div>
          </div>
        </div>

        {!mini && (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 * s }}>
            <div>
              <div style={{ fontSize: 10 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginBottom: 3 * s }}>{reached ? 'Reached' : 'To goal'}</div>
              <div style={{ fontSize: 20 * s, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: reached ? accent : 'var(--w-fg)' }}>{reached ? fmtShort(current) : fmtFull(remaining)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * s }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, fontSize: 11 * s, fontWeight: 600, color: accent }}>
                <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="none"><path d="M5 16 L10 10 L14 13 L19 6" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 6 H19 V10" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>+{perDay}/day</span>
              </div>
              <svg width="100%" height={24 * s} viewBox={`0 0 ${spW} ${spH}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <path d={spArea} fill={accent} opacity="0.12" />
                <path d={spLine} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={spPts[spPts.length - 1][0]} cy={spPts[spPts.length - 1][1]} r="2.6" fill={accent} />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11.5 * s, fontWeight: 500, color: reached ? accent : 'var(--w-mut)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 * s }}>
        {reached ? (
          <><Icon name="check" color={accent} variant="filled" size={14 * s} /><span style={{ fontWeight: 600 }}>Milestone reached</span></>
        ) : (
          <><Icon name="flag" color={accent} size={13 * s} /><span><span style={{ color: 'var(--w-fg)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>~{etaDays} days</span> to {fmtShort(goal)} at this pace</span></>
        )}
      </div>
    </div>
  );
}

/* ---------------- TWITCH STATUS ---------------- */
function TwitchStatusW({ config: c, accent, s, fontStack, mini }) {
  // Baked-in sample channels — config SELECTS by channel name. NO network.
  const CHANNELS = {
    channelname: { display: 'channelname', live: true, viewers: 4827, title: 'Ranked grind to Diamond — !commands', game: 'VALORANT', category: 'FPS', uptimeMin: 167, started: '2h 47m', followers: 128400, tags: ['English', 'Competitive'] },
    pixelcafe: { display: 'PixelCafe', live: true, viewers: 312, title: 'cozy pixel art commissions ✦ lofi beats', game: 'Art', category: 'Just Chatting', uptimeMin: 94, started: '1h 34m', followers: 21900, tags: ['Cozy', 'Art'] },
    speedlab: { display: 'SpeedLab', live: false, viewers: 0, title: 'Any% WR attempts — back tomorrow 8pm', game: 'Celeste', category: 'Speedrun', uptimeMin: 0, started: '', followers: 56300, tags: ['Speedrun'] },
    jazzkeys: { display: 'jazzkeys', live: true, viewers: 1204, title: 'late night piano improv • requests open', game: 'Music', category: 'Music', uptimeMin: 218, started: '3h 38m', followers: 47100, tags: ['Music', 'Chill'] }
  };
  const key = (c.channel || 'channelname').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const d = CHANNELS[key] || CHANNELS.channelname;

  const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n);
  const onAcc = onColor(accent);
  const showViewers = c.showViewers !== false;
  const offMsg = c.offlineMessage || 'Offline';

  // Tiny viewer sparkline from baked sample (last ~20 samples), scaled around current viewers
  const spark = [0.62, 0.65, 0.6, 0.7, 0.74, 0.71, 0.78, 0.83, 0.8, 0.86, 0.9, 0.88, 0.94, 0.97, 0.93, 0.99, 1, 0.96, 0.98, 1];
  const sw = mini ? 120 : 150, sh = 30, mx = Math.max(...spark), mn = Math.min(...spark);
  const pts = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * sw;
    const y = sh - ((v - mn) / (mx - mn || 1)) * (sh - 4) - 2;
    return [x, y];
  });
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = 'M0 ' + sh + ' ' + pts.map(p => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ' L' + sw + ' ' + sh + ' Z';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: (mini ? 16 : 22) * s, fontVariantNumeric: 'tabular-nums' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 * s }}>
        <div style={{ position: 'relative', width: (mini ? 40 : 50) * s, height: (mini ? 40 : 50) * s, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(135deg, ${lighten(accent, 0.18)}, ${lighten(accent, -0.12)})`, display: 'grid', placeItems: 'center', boxShadow: d.live ? `0 0 0 ${2 * s}px var(--w-bg, transparent), 0 0 0 ${3.5 * s}px ${accent}` : `0 0 0 ${1.5 * s}px var(--w-line)` }}>
            <span style={{ fontSize: (mini ? 16 : 20) * s, fontWeight: 700, color: onColor(lighten(accent, 0.03)) }}>{d.display.charAt(0).toUpperCase()}</span>
          </div>
          {d.live && <div style={{ position: 'absolute', bottom: -2 * s, left: '50%', transform: 'translateX(-50%)', background: accent, color: onAcc, fontSize: 8.5 * s, fontWeight: 800, letterSpacing: '0.06em', padding: `${1.5 * s}px ${5 * s}px`, borderRadius: 4 * s }}>LIVE</div>}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: (mini ? 14 : 16) * s, fontWeight: 700, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.display}</div>
          {d.live ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, fontSize: 12 * s, color: 'var(--w-mut)', marginTop: 2 * s }}>
              <span style={{ display: 'inline-block', width: 7 * s, height: 7 * s, borderRadius: '50%', background: '#e0245e', boxShadow: `0 0 ${5 * s}px #e0245e` }} />
              <span style={{ fontWeight: 600 }}>{d.category}</span>
            </div>
          ) : (
            <div style={{ fontSize: 12 * s, color: 'var(--w-mut)', fontWeight: 600, marginTop: 2 * s }}>{offMsg}</div>
          )}
        </div>
      </div>

      {d.live ? (
        <>
          <div style={{ fontSize: (mini ? 12.5 : 13.5) * s, lineHeight: 1.4, fontWeight: 500, color: 'var(--w-fg)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.title}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11 * s, fontWeight: 700, color: accent, background: lighten(accent, luminance(accent) > 0.5 ? -0.02 : 0.7), padding: `${3 * s}px ${8 * s}px`, borderRadius: 6 * s }}>{d.game}</span>
            {!mini && d.tags.map(tg => (
              <span key={tg} style={{ fontSize: 10.5 * s, fontWeight: 600, color: 'var(--w-mut)', border: '1px solid var(--w-line)', padding: `${2.5 * s}px ${7 * s}px`, borderRadius: 6 * s }}>{tg}</span>
            ))}
          </div>

          {showViewers && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 * s, borderTop: '1px solid var(--w-line)', paddingTop: 12 * s }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s }}>
                  <svg width={13 * s} height={13 * s} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  <span style={{ fontSize: (mini ? 17 : 20) * s, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>{fmt(d.viewers)}</span>
                </div>
                <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600, marginTop: 3 * s }}>viewers · live {d.started}</div>
              </div>
              {!mini && (
                <svg width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id={'tw-sp-' + key} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
                      <stop offset="100%" stopColor={accent} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill={`url(#tw-sp-${key})`} />
                  <path d={line} fill="none" stroke={accent} strokeWidth={2 * s} strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.8 * s} fill={accent} />
                </svg>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ borderTop: '1px solid var(--w-line)', paddingTop: 12 * s }}>
          <div style={{ fontSize: 12.5 * s, lineHeight: 1.4, color: 'var(--w-mut)' }}>{d.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s, marginTop: 8 * s, fontSize: 11 * s, color: 'var(--w-mut)', fontWeight: 600 }}>
            <svg width={12 * s} height={12 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 1 0-8 0" /><path d="M5 21V11h14v10" /><path d="M9 21v-4h6v4" /></svg>
            {fmt(d.followers)} followers
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- SPOTIFY PLAYER ---------------- */
function SpotifyEmbedW({ config: c, accent, s, fontStack, mini }) {
  const BRAND = '#1DB954';
  const LIBRARY = {
    'spotify:playlist:37i9dQZF1DX0XUsuxWHRQd': {
      kind: 'Playlist', title: 'RapCaviar', by: 'Spotify', meta: '50 songs · 3h 12m',
      hue1: '#2b1055', hue2: '#7c3aed',
      tracks: [
        { t: 'Money Trees', a: 'Kendrick Lamar', d: '6:26' },
        { t: 'SICKO MODE', a: 'Travis Scott', d: '5:12' },
        { t: 'HUMBLE.', a: 'Kendrick Lamar', d: '2:57' },
        { t: 'goosebumps', a: 'Travis Scott', d: '4:03' },
        { t: 'XO Tour Llif3', a: 'Lil Uzi Vert', d: '3:02' },
      ],
      np: 0, elapsed: 142, total: 386,
    },
    'spotify:album:1ATL5GLyefJaxhQzSPVrLX': {
      kind: 'Album', title: 'Random Access Memories', by: 'Daft Punk', meta: '13 songs · 1h 14m',
      hue1: '#1a1a1a', hue2: '#c79a3b',
      tracks: [
        { t: 'Give Life Back to Music', a: 'Daft Punk', d: '4:35' },
        { t: 'Instant Crush', a: 'Daft Punk, Julian Casablancas', d: '5:37' },
        { t: 'Get Lucky', a: 'Daft Punk, Pharrell', d: '6:09' },
        { t: 'Lose Yourself to Dance', a: 'Daft Punk, Pharrell', d: '5:53' },
        { t: 'Touch', a: 'Daft Punk, Paul Williams', d: '8:18' },
      ],
      np: 2, elapsed: 198, total: 369,
    },
    'spotify:track:7qiZfU4dY1lWllzX7mPBI3': {
      kind: 'Track', title: 'Shape of You', by: 'Ed Sheeran', meta: 'Single · 2017',
      hue1: '#0b3d2e', hue2: '#1DB954',
      tracks: [{ t: 'Shape of You', a: 'Ed Sheeran', d: '3:53' }],
      np: 0, elapsed: 67, total: 233,
    },
  };

  const KEYS = Object.keys(LIBRARY);
  const norm = (u) => {
    if (!u) return null;
    let v = String(u).trim();
    const m = v.match(/spotify\.com\/(playlist|album|track)\/([A-Za-z0-9]+)/);
    if (m) v = 'spotify:' + m[1] + ':' + m[2];
    return LIBRARY[v] ? v : null;
  };
  const key = norm(c.url) || KEYS[0];
  const d = LIBRARY[key];

  const dark = (c.theme || 'dark') !== 'light';
  const compact = !!c.compact || mini;

  const cardBg = dark ? '#181818' : '#ffffff';
  const cardFg = dark ? '#ffffff' : '#191414';
  const cardMut = dark ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.55)';
  const cardLine = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)';

  const np = d.tracks[d.np] || d.tracks[0];
  const frac = Math.max(0, Math.min(1, d.elapsed / d.total));
  const fmt = (sec) => {
    const m = Math.floor(sec / 60), x = Math.round(sec % 60);
    return m + ':' + (x < 10 ? '0' : '') + x;
  };

  // Decorative album-art tile: layered gradient + soundwave bars from a seeded array
  const bars = [];
  for (let i = 0; i < 11; i++) {
    const seed = (Math.sin((i + 1) * 12.9898 + key.length) * 43758.5453);
    bars.push(0.25 + (seed - Math.floor(seed)) * 0.75);
  }

  const artSize = (compact ? 60 : 72) * s;
  const Art = (
    <div style={{
      width: artSize, height: artSize, borderRadius: 10 * s, flexShrink: 0,
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(140deg, ${d.hue2} 0%, ${d.hue1} 100%)`,
      boxShadow: dark ? '0 6px 16px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.18)',
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2.4 * s, padding: artSize * 0.18 }}>
        {bars.map((b, i) => (
          <span key={i} style={{ flex: 1, height: (b * 100) + '%', borderRadius: 99, background: 'rgba(255,255,255,0.78)', opacity: 0.18 + b * 0.5 }} />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 80% 0%, rgba(255,255,255,0.22), transparent 60%)' }} />
    </div>
  );

  const SpotifyMark = (
    <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" fill={BRAND} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.5 17.32a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.56-1.16a.75.75 0 1 1-.33-1.46c4.58-1.04 8.5-.59 11.67 1.34.35.22.46.69.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.8c4.37-1.32 9.79-.67 13.49 1.6.44.27.58.85.31 1.29zm.13-3.41C15.73 8.34 9.1 8.12 5.4 9.25a1.12 1.12 0 1 1-.65-2.15c4.25-1.29 11.57-1.04 16.13 1.66a1.12 1.12 0 1 1-1.15 1.93z" />
    </svg>
  );

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: 15 * s, fontFamily: fontStack, boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%', borderRadius: 14 * s, background: cardBg, color: cardFg,
        border: '1px solid ' + cardLine, overflow: 'hidden',
        boxShadow: dark ? '0 10px 28px rgba(0,0,0,0.35)' : '0 10px 28px rgba(0,0,0,0.10)',
        padding: 14 * s, boxSizing: 'border-box',
      }}>
        {/* Header row: art + meta + play */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 * s }}>
          {Art}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, marginBottom: 2 * s }}>
              {SpotifyMark}
              <span style={{ fontSize: 9.5 * s, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cardMut }}>{d.kind}</span>
            </div>
            <div style={{ fontSize: (compact ? 14 : 16) * s, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
            <div style={{ fontSize: 11 * s, color: cardMut, marginTop: 2 * s, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.by}{!compact ? ' · ' + d.meta : ''}</div>
          </div>
          {!mini && (
            <div style={{
              width: 40 * s, height: 40 * s, borderRadius: 99, flexShrink: 0,
              background: BRAND, display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(29,185,84,0.45)',
            }}>
              <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" fill="#fff"><path d="M7 5.5v13L18 12 7 5.5z" /></svg>
            </div>
          )}
        </div>

        {/* Now playing + progress */}
        <div style={{ marginTop: 12 * s }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 * s, marginBottom: 6 * s }}>
            <span style={{ fontSize: 11.5 * s, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: cardFg }}>{np.t}</span>
            <span style={{ fontSize: 10.5 * s, color: cardMut, whiteSpace: 'nowrap', flexShrink: 0 }}>{np.a}</span>
          </div>
          <div style={{ position: 'relative', height: 4 * s, borderRadius: 99, background: cardLine, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, width: (frac * 100) + '%', borderRadius: 99, background: BRAND }} />
            <div style={{ position: 'absolute', top: '50%', left: (frac * 100) + '%', width: 8 * s, height: 8 * s, marginTop: -4 * s, marginLeft: -4 * s, borderRadius: 99, background: dark ? '#fff' : '#191414', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 * s }}>
            <span style={{ fontSize: 9.5 * s, color: cardMut, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.elapsed)}</span>
            <span style={{ fontSize: 9.5 * s, color: cardMut, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- VISIT COUNTER ---------------- */
function HitCounterW({ config: c, accent, s, fontStack, mini }) {
  /* ---- baked-in sample data, keyed by page id (NO network) ---- */
  const PAGES = {
    'my-page':   { total: 48213, today: 312, week: 1984, spark: [142, 168, 121, 203, 256, 188, 241, 297, 312, 264, 351, 288, 309, 312] },
    'portfolio': { total: 12740, today: 86,  week: 542,  spark: [38, 51, 44, 62, 71, 49, 58, 77, 64, 81, 73, 90, 68, 86] },
    'blog':      { total: 203418, today: 1426, week: 9210, spark: [980, 1120, 870, 1340, 1510, 1190, 1280, 1602, 1448, 1390, 1720, 1281, 1399, 1426] },
    'shop':      { total: 7321,  today: 54,  week: 388,  spark: [22, 31, 28, 40, 37, 25, 33, 48, 41, 52, 44, 39, 47, 54] },
  };

  const id = c.id || 'my-page';
  const d = PAGES[id] || PAGES['my-page'];
  const label = (c.label || 'views').trim();
  const style = c.style || 'odometer';
  const showToday = c.showToday !== false;
  const showSpark = c.showSpark !== false;

  /* ---- live-feel tick: count up to the baked total once on mount, then occasionally bump ---- */
  const target = d.total;
  const [count, setCount] = useState(() => Math.max(0, target - Math.min(120, Math.round(target * 0.012))));
  const [bumped, setBumped] = useState(false);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = count;
    const dur = mini ? 700 : 1100;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  useEffect(() => {
    if (mini) return;
    const iv = setInterval(() => {
      setCount((n) => n + 1);
      setBumped(true);
      setTimeout(() => setBumped(false), 320);
    }, 6500);
    return () => clearInterval(iv);
  }, [mini]);

  const fg = 'var(--w-fg)';
  const onAcc = onColor(accent);

  const fmt = (n) => n.toLocaleString('en-US');
  const digits = String(Math.max(count, 0)).padStart(Math.max(String(target).length, 1), '0').split('');

  /* ---- single rolling digit column for the odometer ---- */
  const Reel = ({ ch, idx }) => {
    const isDigit = ch >= '0' && ch <= '9';
    const dh = (mini ? 30 : 42) * s;
    const dw = (mini ? 20 : 28) * s;
    if (!isDigit) {
      return (
        <span style={{ width: dw * 0.5, display: 'inline-flex', alignItems: 'flex-end', justifyContent: 'center', height: dh, fontSize: (mini ? 22 : 32) * s, fontWeight: 700, color: 'var(--w-mut)', lineHeight: 1 }}>{ch}</span>
      );
    }
    const n = Number(ch);
    return (
      <span style={{
        position: 'relative', display: 'inline-block', width: dw, height: dh,
        overflow: 'hidden', borderRadius: 6 * s,
        background: 'var(--w-line)',
      }}>
        <span style={{
          position: 'absolute', left: 0, right: 0, top: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          transform: 'translateY(' + (-n * dh) + 'px)',
          transition: 'transform 0.55s cubic-bezier(.22,1,.36,1)',
        }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
            <span key={v} style={{
              height: dh, width: dw, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: (mini ? 22 : 30) * s, fontWeight: 700, color: fg, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
            }}>{v}</span>
          ))}
        </span>
      </span>
    );
  };

  /* ---- sparkline path from the baked daily array ---- */
  const SparkLine = () => {
    const vals = d.spark;
    const w = 100, h = 28;
    const max = Math.max.apply(null, vals);
    const min = Math.min.apply(null, vals);
    const rng = max - min || 1;
    const step = w / (vals.length - 1);
    const pts = vals.map((v, i) => [i * step, h - ((v - min) / rng) * (h - 4) - 2]);
    const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
    const last = pts[pts.length - 1];
    const gid = 'hc_spark_' + id.replace(/[^a-z0-9]/gi, '');
    return (
      <svg width="100%" height={32 * s} viewBox={'0 0 ' + w + ' ' + h} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={'url(#' + gid + ')'} />
        <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={last[0]} cy={last[1]} r="2.6" fill={accent} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  };

  /* ---- minimal style: a single pill with a live dot ---- */
  if (style === 'minimal') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 * s, fontFamily: fontStack }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 * s, padding: (mini ? 8 : 11) * s + 'px ' + (mini ? 14 : 18) * s + 'px', borderRadius: 999, border: '1px solid var(--w-line)', background: 'var(--w-line)' }}>
          <span style={{ width: 7 * s, height: 7 * s, borderRadius: 999, background: accent, boxShadow: '0 0 0 ' + 3 * s + 'px ' + lighten(accent, 0.55), flex: 'none' }} />
          <span style={{ fontSize: (mini ? 17 : 21) * s, fontWeight: 700, color: fg, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', transition: 'color .25s', ...(bumped ? { color: accent } : null) }}>{fmt(count)}</span>
          <span style={{ fontSize: (mini ? 11 : 12.5) * s, color: 'var(--w-mut)', fontWeight: 600 }}>{label}</span>
        </div>
      </div>
    );
  }

  /* ---- pill style: accent-filled badge ---- */
  if (style === 'pill') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * s, padding: 20 * s, fontFamily: fontStack }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 * s, padding: (mini ? 12 : 16) * s + 'px ' + (mini ? 18 : 24) * s + 'px', borderRadius: 16 * s, background: accent, color: onAcc }}>
          <svg width={(mini ? 18 : 24) * s} height={(mini ? 18 : 24) * s} viewBox="0 0 24 24" fill="none" stroke={onAcc} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', opacity: 0.9 }}>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span style={{ fontSize: (mini ? 24 : 34) * s, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, transform: bumped ? 'scale(1.05)' : 'scale(1)', transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)' }}>{fmt(count)}</span>
        </div>
        <div style={{ fontSize: 11 * s, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{label}</div>
        {showSpark && !mini ? <div style={{ width: '70%', maxWidth: 220 * s }}><SparkLine /></div> : null}
      </div>
    );
  }

  /* ---- default: odometer ---- */
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 * s, padding: (mini ? 16 : 22) * s, fontFamily: fontStack }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 * s }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
          <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" fill="none" stroke="var(--w-mut)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span style={{ fontSize: 11.5 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>Total {label}</span>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 * s, fontSize: 10.5 * s, fontWeight: 600, color: accent }}>
          <span style={{ width: 6 * s, height: 6 * s, borderRadius: 999, background: accent }} />LIVE
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 * s }}>
        {digits.map((ch, i) => <Reel key={i + '-' + ch} ch={ch} idx={i} />)}
      </div>

      {showToday || showSpark ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 * s, borderTop: '1px solid var(--w-line)', paddingTop: 12 * s }}>
          {showToday ? (
            <div style={{ display: 'flex', gap: 16 * s }}>
              <div>
                <div style={{ fontSize: (mini ? 15 : 18) * s, fontWeight: 700, color: fg, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmt(d.today)}</div>
                <div style={{ fontSize: 9.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginTop: 4 * s }}>Today</div>
              </div>
              {!mini ? (
                <div>
                  <div style={{ fontSize: 18 * s, fontWeight: 700, color: fg, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmt(d.week)}</div>
                  <div style={{ fontSize: 9.5 * s, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginTop: 4 * s }}>7 days</div>
                </div>
              ) : null}
            </div>
          ) : <span />}
          {showSpark && !mini ? <div style={{ flex: 1, maxWidth: 130 * s }}><SparkLine /></div> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- DISPATCHER ---------------- */
function Widget({ type, config, accent, fontStack, sizeScale = 1, theme = 'light', mini = false, radius = 0 }) {
  const s = sizeScale;
  const map = { agendaList: AgendaListW, currencyConverter: CurrencyConverterW, cryptoTicker: CryptoTickerW, stockTicker: StockTickerW, weatherForecast: WeatherForecastW, onThisDay: OnThisDayW, githubHeatmap: GithubHeatmapW, githubStars: GithubStarsW, npmDownloads: NpmDownloadsW, latestRelease: LatestReleaseW, buildStatus: BuildStatusW, uptimeMonitor: UptimeMonitorW, subscriberCount: SubscriberCountW, followerGoal: FollowerGoalW, twitchStatus: TwitchStatusW, spotifyEmbed: SpotifyEmbedW, hitCounter: HitCounterW, clock: ClockW, countdown: CountdownW, pomodoro: PomodoroW, weather: WeatherW, quote: QuoteW, habit: HabitW, calendar: CalendarW, analogClock: AnalogClockW, flipClock: FlipClockW, worldClockBoard: WorldClockBoardW, dateCard: DateCardW, countup: CountupW, lifeProgress: LifeProgressW, yearProgress: YearProgressW, lifeInWeeks: LifeInWeeksW, moonPhase: MoonPhaseW, dayNightMap: DayNightMapW, stopwatch: StopwatchW, progressRing: ProgressRingW, progressBar: ProgressBarW, counter: CounterW, checklist: ChecklistW, linkButton: LinkButtonW, buttonGrid: ButtonGridW, focusTimerPro: FocusTimerProW, todayHeader: TodayHeaderW, miniCalendar: MiniCalendarW, countdownEvent: CountdownEventW, weekPlanner: WeekPlannerW, savingsRing: SavingsRingW, budgetRing: BudgetRingW, subscriptionCounter: SubscriptionCounterW, netWorth: NetWorthW, debtPayoff: DebtPayoffW, expenseSplitter: ExpenseSplitterW, habitGrid: HabitGridW, heatmapTracker: HeatmapTrackerW, waterTracker: WaterTrackerW, moodTracker: MoodTrackerW, sleepTracker: SleepTrackerW, stepGoal: StepGoalW, calorieRing: CalorieRingW, fastingTimer: FastingTimerW, bmiCalculator: BmiCalculatorW, breathingCircle: BreathingCircleW, workoutStreak: WorkoutStreakW, greetingBanner: GreetingBannerW, affirmation: AffirmationW, colorPalette: ColorPaletteW, contentCalendar: ContentCalendarW, postingStreak: PostingStreakW, photoFrame: PhotoFrameW, quoteCard: QuoteCardW, diceRoller: DiceRollerW, magic8Ball: Magic8BallW, asciiBanner: AsciiBannerW, metronome: MetronomeW, gradientMesh: GradientMeshW, starfield: StarfieldW, lavaLamp: LavaLampW, imageGallery: ImageGalleryW, visitedMap: VisitedMapW, ambientPlayer: AmbientPlayerW, calculator: CalculatorW, unitConverter: UnitConverterW };
  const C = map[type] || ClockW;
  return (
    <div className="w" data-wt={theme} style={{ '--w-accent': accent, fontFamily: fontStack, borderRadius: radius }}>
      <C config={config || {}} accent={accent} s={s} fontStack={fontStack} mini={mini} />
    </div>
  );
}

/* ============================================================
   SHARED UI PRIMITIVES + MOCK DOCS CANVAS
   ============================================================ */

function useLocalStorage(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : initial; } catch (e) { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }, [key, v]);
  return [v, setV];
}

function BrandMark({ size = 28 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, borderRadius: size * 0.3 }}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
        <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
        <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
        <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
      </svg>
    </span>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.icon}{o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 40, height: 24, borderRadius: 99, padding: 2, background: on ? 'var(--ink)' : 'var(--surface-3)',
      transition: 'background 0.2s var(--ease)', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
    }}>
      <span style={{ width: 20, height: 20, borderRadius: 99, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s var(--ease)' }} />
    </button>
  );
}

function ThemeToggle({ theme, setTheme }) {
  const dark = theme === 'dark';
  return (
    <button className="btn btn-icon btn-subtle" onClick={() => setTheme(dark ? 'light' : 'dark')} title="Toggle theme" aria-label="Toggle theme">
      {dark
        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" /></svg>
        : <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 1 1 10 4a6.8 6.8 0 0 0 10 10.5z" /></svg>}
    </button>
  );
}

function ColorField({ value, onChange }) {
  return (
    <div className="swatch-row">
      {ACCENTS.map(c => (
        <button key={c} className={'swatch' + (value.toLowerCase() === c.toLowerCase() ? ' on' : '')} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
      ))}
      <label className="swatch-hex" title="Custom hex">
        <span style={{ width: 14, height: 14, borderRadius: 4, background: value, border: '1px solid var(--border-strong)' }} />
        {value.toUpperCase()}
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'auto' }} />
      </label>
    </div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const tref = useRef();
  const copy = (text) => {
    try { navigator.clipboard.writeText(text); } catch (e) {}
    setCopied(true); clearTimeout(tref.current); tref.current = setTimeout(() => setCopied(false), 1600);
  };
  return [copied, copy];
}

function CopyBar({ url, onSave, saved, proCaption }) {
  const [copied, copy] = useCopy();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="copybar">
        <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)', flex: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
        </span>
        <span className="copy-url" title={url}>{url}</span>
        <button className={'btn btn-primary copy-btn' + (copied ? ' copied' : '')} style={{ flex: 'none' }} onClick={() => copy(url)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
          Copy embed link
          <span className="copy-check"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg></span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-3)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
          Type <span className="mono" style={{ color: 'var(--text-2)' }}>/embed</span> &amp; paste in Notion
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onSave} style={saved ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : {}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.3C12 20.3 3.8 14.7 3.8 9.2A4.4 4.4 0 0 1 12 6.8A4.4 4.4 0 0 1 20.2 9.2C20.2 14.7 12 20.3 12 20.3Z" /></svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function DocsCanvas({ docTheme, accent, children, title = 'My Dashboard', emoji = 'home' }) {
  const pages = [
    { ic: 'home', l: 'My Dashboard', on: true }, { ic: 'calendar', l: 'Weekly Planner' },
    { ic: 'target', l: 'Goals 2026' }, { ic: 'book', l: 'Reading List' }, { ic: 'wallet', l: 'Budget' },
  ];
  const fg = docTheme === 'dark' ? '#d9d8d2' : '#2c2b28';
  return (
    <div className="stage" data-doc={docTheme}>
      <div className="doc">
        <div className="doc-side">
          <div className="doc-ws"><span className="doc-ws-mark" /><span className="doc-ws-name">Acme HQ</span></div>
          <div className="doc-srow"><svg className="di" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>Search</div>
          <div style={{ height: 10 }} />
          {pages.map((p, i) => (
            <div key={i} className={'doc-srow' + (p.on ? ' on' : '')}>
              <span className="di"><Icon name={p.ic} color={p.on ? accent : fg} variant={p.on ? 'filled' : 'outline'} size={15} /></span>{p.l}
            </div>
          ))}
        </div>
        <div className="doc-main scroll" style={{ overflowY: 'auto' }}>
          <div className="doc-cover" />
          <div className="doc-body">
            <div className="doc-emoji"><Icon name={emoji} color={accent} variant="filled" size={30} /></div>
            <div className="doc-title">{title}</div>
            <div className="doc-meta">Last edited just now · 5 blocks</div>
            <div className="doc-p" style={{ width: '92%' }} />
            <div className="doc-p" style={{ width: '74%' }} />
            <div className="doc-h">This week at a glance</div>
            {children}
            <div className="doc-p" style={{ width: '84%', marginTop: 18 }} />
            <div className="doc-p" style={{ width: '63%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedBlock({ children, showCaption = true, height = 230 }) {
  return (
    <div className="embed-block">
      <div style={{ height }}>{children}</div>
      {showCaption && (
        <div className="embed-cap">
          <BrandMark size={15} /> <span>Notion Crafts widget</span>
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>embed</span>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

const SITE_ORIGIN = 'https://notioncrafts.com';

function buildEmbedUrl(widgetId, cfg) {
  const p = new URLSearchParams();
  Object.entries(cfg).forEach(([k, v]) => { if (v !== '' && v != null && v !== false) p.set(k, v === true ? '1' : v); });
  return `${SITE_ORIGIN}/e/${widgetId}?${p.toString()}`;
}

/* ============================================================
   GALLERIES — widget gallery + icon gallery
   ============================================================ */

const WIDGET_ACCENT = { agendaList: '#2A6FDB', currencyConverter: '#1F8A5B', cryptoTicker: '#E0A93B', stockTicker: '#243b53', weatherForecast: '#2A6FDB', onThisDay: '#243b53', githubHeatmap: '#26a641', githubStars: '#E0A93B', npmDownloads: '#cb3837', latestRelease: '#18181a', buildStatus: '#26a641', uptimeMonitor: '#1F8A5B', subscriberCount: '#FF0000', followerGoal: '#C2417B', twitchStatus: '#9146FF', spotifyEmbed: '#1DB954', hitCounter: '#18181a', clock: '#18181a', countdown: '#E0603A', pomodoro: '#6D4FD6', weather: '#2A6FDB', quote: '#1F8A5B', habit: '#C2417B', calendar: '#0E9DA6', analogClock: '#18181a', flipClock: '#1f1f22', worldClockBoard: '#2A6FDB', dateCard: '#18181a', countup: '#C2417B', lifeProgress: '#1F8A5B', yearProgress: '#E0A93B', lifeInWeeks: '#18181a', moonPhase: '#3a3a55', dayNightMap: '#243b53', stopwatch: '#18181a', progressRing: '#2A6FDB', progressBar: '#1F8A5B', counter: '#18181a', checklist: '#2A6FDB', linkButton: '#18181a', buttonGrid: '#2A6FDB', focusTimerPro: '#C2417B', todayHeader: '#E0A93B', miniCalendar: '#2A6FDB', countdownEvent: '#C2417B', weekPlanner: '#1F8A5B', savingsRing: '#1F8A5B', budgetRing: '#E0A93B', subscriptionCounter: '#C2417B', netWorth: '#1F8A5B', debtPayoff: '#243b53', expenseSplitter: '#2A6FDB', habitGrid: '#1F8A5B', heatmapTracker: '#1F8A5B', waterTracker: '#2A6FDB', moodTracker: '#C2417B', sleepTracker: '#3a3a55', stepGoal: '#E0A93B', calorieRing: '#C2417B', fastingTimer: '#1F8A5B', bmiCalculator: '#2A6FDB', breathingCircle: '#1F8A5B', workoutStreak: '#E0563B', greetingBanner: '#C2417B', affirmation: '#1F8A5B', colorPalette: '#2A6FDB', contentCalendar: '#2A6FDB', postingStreak: '#E0563B', photoFrame: '#C2417B', quoteCard: '#18181a', diceRoller: '#E0563B', magic8Ball: '#18181a', asciiBanner: '#1F8A5B', metronome: '#243b53', gradientMesh: '#C2417B', starfield: '#243b53', lavaLamp: '#E0563B', imageGallery: '#2A6FDB', visitedMap: '#1F8A5B', ambientPlayer: '#C2417B', calculator: '#18181a', unitConverter: '#2A6FDB' };

function WidgetCard({ widget, onOpen }) {
  const accent = WIDGET_ACCENT[widget.type] || '#18181a';
  return (
    <div className="wcard" onClick={() => onOpen(widget)}>
      <div className="wcard-prev">
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Widget type={widget.type} config={widget.config || {}} accent={accent} fontStack="'Hanken Grotesk', sans-serif" sizeScale={0.64} theme="light" mini />
        </div>
      </div>
      <div className="wcard-body">
        <div className="wcard-row">
          <span className="wcard-name">{widget.name}</span>
          <span className="btn btn-subtle btn-sm" style={{ pointerEvents: 'none' }}>Customize
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
        <div className="wcard-desc">{widget.desc}</div>
        <div className="tagrow">{widget.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
      </div>
    </div>
  );
}

function WidgetGallery({ onOpen }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const list = WIDGETS.filter(w =>
    (cat === 'All' || w.category === cat) &&
    (q === '' || (w.name + w.desc + w.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="fadein">
        <div className="eyebrow">The library</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginTop: 10, marginBottom: 10 }}>Widgets that feel native</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 520 }}>Every widget is a live, customizable mini-app. Tune it, then copy one embed link into your page.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, margin: '30px 0 22px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {WIDGET_CATEGORIES.map(c => <button key={c} className={'chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div style={{ position: 'relative', minWidth: 230 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </span>
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Search widgets…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {list.length ? (
        <div className="wgrid">{list.map(w => <WidgetCard key={w.id} widget={w} onOpen={onOpen} />)}</div>
      ) : (
        <div style={{ textAlign: 'center', padding: '70px 0', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-2)' }}>No widgets match “{q}”</div>
          <div style={{ marginTop: 6 }}>Try a different search or category.</div>
        </div>
      )}
    </div>
  );
}

function IconCell({ ic, accent, variant }) {
  const [copied, copy] = useCopy();
  const url = `${SITE_ORIGIN}/i/${ic.k}?c=${accent.replace('#', '')}&s=${variant}`;
  return (
    <div className="icell" onClick={() => copy(url)}>
      <LibIcon icon={ic} color={accent} variant={variant} size={38} />
      <span className="icell-label">{ic.l}</span>
      <div className={'icell-copy' + (copied ? ' copied' : '')}>
        {copied
          ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>Copied URL</>
          : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>Copy image URL</>}
      </div>
    </div>
  );
}

function IconGallery() {
  const [accent, setAccent] = useState('#18181a');
  const [variant, setVariant] = useState('outline');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [icons, setIcons] = useState(null);
  useEffect(() => {
    let live = true;
    import('../data/icons.generated.js').then(m => { if (live) setIcons(m.ICONS); });
    return () => { live = false; };
  }, []);
  const categories = useMemo(() => {
    const seen = [];
    for (const i of (icons || [])) if (!seen.includes(i.c)) seen.push(i.c);
    return seen;
  }, [icons]);
  const ql = q.trim().toLowerCase();
  const list = useMemo(() => (icons || []).filter(i =>
    (cat === 'All' || i.c === cat) &&
    (ql === '' || i.l.toLowerCase().includes(ql) || i.k.includes(ql) || i.c.toLowerCase().includes(ql))
  ), [icons, cat, ql]);
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="fadein">
        <div className="eyebrow">Page icons · {icons ? icons.length : '500'}+ and counting</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginTop: 10, marginBottom: 10 }}>Recolor anything, instantly</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 520 }}>Pick a color and style, then copy an image URL straight into a page icon. The whole grid recolors as you go.</p>
      </div>

      <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 0px)', zIndex: 20, margin: '26px 0 22px' }}>
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
          <div className="field" style={{ gap: 8 }}>
            <span className="field-label">Color</span>
            <ColorField value={accent} onChange={setAccent} />
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
          <div className="field" style={{ gap: 8 }}>
            <span className="field-label">Style</span>
            <div className="seg">
              {ICON_STYLES.map(st => (
                <button key={st.v} className={variant === st.v ? 'on' : ''} onClick={() => setVariant(st.v)}>
                  {st.l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </span>
            <input className="input" style={{ paddingLeft: 34 }} placeholder="Search icons…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {icons && (
        <div className="icat-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {['All', ...categories].map(c => (
            <button key={c} className={'chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>
              {c === 'All' ? 'All' : c.replace(/ &.*/, '')}
            </button>
          ))}
        </div>
      )}

      {!icons
        ? <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>Loading the icon library…</div>
        : <>
            <div className="igrid">
              {list.map(ic => <IconCell key={ic.k} ic={ic} accent={accent} variant={variant} />)}
            </div>
            {!list.length && <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>No icons match “{q}”.</div>}
          </>}
    </div>
  );
}

/* ============================================================
   WIDGET CONFIGURATOR (hero screen)
   ============================================================ */

const SIZE_SCALE = { S: 0.82, M: 1, L: 1.16 };
const SIZE_HEIGHT = { S: 196, M: 232, L: 270 };

function CtrlGroup({ label, children, right }) {
  return (
    <div className="field" style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      <div className="field-row"><span className="field-label">{label}</span>{right}</div>
      {children}
    </div>
  );
}

const CATEGORY_ICON = {
  Time: 'clock', Productivity: 'check', Daily: 'sun', Planning: 'calendar',
  Finance: 'wallet', Health: 'heart', Dev: 'code', Creator: 'camera', Fun: 'star', Data: 'chart',
};
function widgetIcon(w) { return CATEGORY_ICON[w.category] || 'star'; }

function WidgetPicker({ current, onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const matches = WIDGETS.filter(w => {
    if (!q) return true;
    const hay = (w.name + ' ' + w.category + ' ' + (w.tags || []).join(' ')).toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  const cats = WIDGET_CATEGORIES.filter(c => c !== 'All' && matches.some(w => w.category === c));

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <button onClick={() => setOpen(o => !o)} className="chip active"
        style={{ height: 32, paddingLeft: 11, paddingRight: 10, fontSize: 13, maxWidth: 280 }}>
        <Icon name={widgetIcon(current)} color="var(--on-ink)" variant="filled" size={14} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.name}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 1, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s var(--ease)' }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-3)' }}>{WIDGETS.length} widgets</span>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 60, width: 320, maxHeight: 420, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg, var(--shadow-md))', overflow: 'hidden' }}>
          <div style={{ padding: 10, borderBottom: '1px solid var(--border)', position: 'relative', flex: 'none' }}>
            <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </span>
            <input className="input" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search 65 widgets…" style={{ paddingLeft: 32, height: 36 }} />
          </div>
          <div className="scroll" style={{ overflowY: 'auto', padding: 6 }}>
            {cats.map(cat => (
              <div key={cat} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, padding: '8px 10px 4px' }}>{cat}</div>
                {matches.filter(w => w.category === cat).map(w => {
                  const on = w.id === current.id;
                  return (
                    <button key={w.id} onClick={() => { onPick(w); setOpen(false); setQ(''); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9, background: on ? 'var(--surface-2)' : 'transparent', textAlign: 'left', cursor: 'pointer' }}
                      onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', background: on ? 'var(--ink)' : 'var(--surface-2)', flex: 'none' }}>
                        <Icon name={widgetIcon(w)} color={on ? 'var(--on-ink)' : 'var(--text-2)'} variant={on ? 'filled' : 'outline'} size={14} />
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: on ? 600 : 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {!matches.length && <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No widgets match “{q}”.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Configurator({ widget, setWidget, favorites, toggleFav, seedAccent }) {
  const [config, setConfig] = useState(widget.config || {});
  const [accent, setAccent] = useState(seedAccent || (widget.id === 'clock' ? '#18181a' : (PACKS.find(p => p.widgets.includes(widget.id))?.accent || '#2A6FDB')));
  const [fontV, setFontV] = useState('sans');
  const [sizeV, setSizeV] = useState('M');
  const [wTheme, setWTheme] = useState('light');
  const [docTheme, setDocTheme] = useState('light');
  const [removeCap, setRemoveCap] = useState(false);

  useEffect(() => { setConfig(widget.config || {}); }, [widget.id]);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));
  const effFont = FONTS.find(f => f.v === fontV) || FONTS[0];
  const effTheme = wTheme === 'auto' ? docTheme : wTheme;
  const s = SIZE_SCALE[sizeV];

  const favKey = widget.id;
  const saved = favorites.includes(favKey);

  const urlCfg = { ...config, theme: wTheme, accent: accent.replace('#', ''), font: effFont.v, size: sizeV.toLowerCase() };
  const url = buildEmbedUrl(widget.id, urlCfg);

  const switchTo = (w) => setWidget(w);

  return (
    <div style={{ height: 'calc(100vh - var(--nav-h))', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 366px', gridTemplateRows: 'minmax(0,1fr)', overflow: 'hidden' }} className="cfg">
      {/* ---- LEFT: stage ---- */}
      <div style={{ position: 'relative', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, background: 'var(--bg)' }}>
        {/* widget switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="eyebrow" style={{ marginRight: 2 }}>Studio</div>
          <WidgetPicker current={widget} onPick={switchTo} />
        </div>
        {/* stage */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <DocsCanvas docTheme={docTheme} accent={accent} emoji={widgetIcon(widget)}>
            <EmbedBlock showCaption={!removeCap} height={SIZE_HEIGHT[sizeV]}>
              <div style={{ position: 'relative', height: '100%' }}>
                <Widget type={widget.type} config={config} accent={accent} fontStack={effFont.stack} sizeScale={s} theme={effTheme} />
              </div>
            </EmbedBlock>
          </DocsCanvas>
          {/* canvas theme toggle */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', padding: 4, borderRadius: 99, boxShadow: 'var(--shadow-md)' }}>
            {['light', 'dark'].map(t => (
              <button key={t} onClick={() => setDocTheme(t)} title={`${t} page`} style={{ width: 30, height: 30, borderRadius: 99, display: 'grid', placeItems: 'center', background: docTheme === t ? 'var(--ink)' : 'transparent', color: docTheme === t ? 'var(--on-ink)' : 'var(--text-3)' }}>
                {t === 'light'
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 1 1 10 4a6.8 6.8 0 0 0 10 10.5z" /></svg>}
              </button>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 14, fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--good)' }} /> Live preview · updates instantly
          </div>
        </div>
      </div>

      {/* ---- RIGHT: controls ---- */}
      <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600 }}>{widget.name}</h3>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, maxWidth: 280 }}>{widget.desc}</div>
            </div>
          </div>

          {/* theme */}
          <CtrlGroup label="Theme">
            <Segmented value={wTheme} onChange={setWTheme} options={[{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }, { v: 'auto', l: 'Auto' }]} />
          </CtrlGroup>

          {/* accent */}
          <CtrlGroup label="Accent color">
            <ColorField value={accent} onChange={setAccent} />
          </CtrlGroup>

          {/* font */}
          <CtrlGroup label="Font">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(86px,1fr))', gap: 7 }}>
              {FONTS.map(f => (
                <button key={f.v} onClick={() => setFontV(f.v)}
                  style={{ height: 46, borderRadius: 9, border: `1px solid ${fontV === f.v ? 'var(--ink)' : 'var(--border-strong)'}`, background: fontV === f.v ? 'var(--surface-2)' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '0 11px', gap: 1, position: 'relative' }}>
                  <span style={{ fontFamily: f.stack, fontSize: 17, lineHeight: 1, color: 'var(--text)' }}>Ag</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600 }}>{f.l}</span>
                </button>
              ))}
            </div>
          </CtrlGroup>

          {/* size */}
          <CtrlGroup label="Size">
            <Segmented value={sizeV} onChange={setSizeV} options={[{ v: 'S', l: 'Small' }, { v: 'M', l: 'Medium' }, { v: 'L', l: 'Large' }]} />
          </CtrlGroup>

          {/* widget-specific */}
          <WidgetOptions widget={widget} config={config} set={set} />

          {/* finishing */}
          <CtrlGroup label="Finishing">
            <div className="field-row">
              <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Remove “Notion Crafts” caption</span>
              <Toggle on={removeCap} onChange={setRemoveCap} />
            </div>
          </CtrlGroup>
        </div>

        {/* sticky copy footer */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <CopyBar url={url} saved={saved} onSave={() => toggleFav(favKey)} />
        </div>
      </div>
    </div>
  );
}

function WidgetOptions({ widget, config: c, set }) {
  const t = widget.type;
  if (t === 'agendaList') return (
    <>
    <>
  <CtrlGroup label="Calendar feed (iCal URL)"><input className="input" value={c.icalUrl} onChange={e => set('icalUrl', e.target.value)} placeholder="https://calendar.google.com/.../basic.ics" /></CtrlGroup>
  <CtrlGroup label="Range"><Segmented value={c.range} onChange={v => set('range', v)} options={[{ v: 'today', l: 'Today' }, { v: 'week', l: 'Week' }, { v: 'month', l: 'Month' }]} /></CtrlGroup>
  <CtrlGroup label="Events shown" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.count || 5}</span>}><input className="range" type="range" min="1" max="8" step="1" value={c.count || 5} onChange={e => set('count', +e.target.value)} /></CtrlGroup>
</>
    </>
  );
  if (t === 'currencyConverter') return (
    <>
    <CtrlGroup label="Base currency">
    <select className="select" value={c.base || 'USD'} onChange={e => set('base', e.target.value)}>
      {['USD','EUR','GBP','JPY','CHF','CAD','AUD','INR','CNY','SGD','BRL','MXN'].map(code => <option key={code} value={code}>{code}</option>)}
    </select>
  </CtrlGroup>
  <CtrlGroup label="Amount">
    <input className="input" type="number" value={c.amount ?? 100} onChange={e => set('amount', parseFloat(e.target.value) || 0)} placeholder="100" />
  </CtrlGroup>
  <CtrlGroup label="Convert to">
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {['EUR','GBP','JPY','CHF','CAD','AUD','INR','CNY','SGD','BRL','MXN','USD'].map(code => {
        const sel = (Array.isArray(c.targets) ? c.targets : ['EUR','GBP']).includes(code);
        return (
          <button key={code} onClick={() => {
            const cur = Array.isArray(c.targets) ? c.targets : ['EUR','GBP'];
            const next = sel ? cur.filter(x => x !== code) : (cur.length >= 4 ? cur : [...cur, code]);
            set('targets', next);
          }} style={{
            padding: '5px 9px', borderRadius: 7, fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
            border: '1px solid ' + (sel ? 'var(--ink)' : 'var(--border)'),
            background: sel ? 'var(--ink)' : 'transparent',
            color: sel ? 'var(--surface)' : 'var(--text-2)', transition: 'all 0.15s var(--ease)',
          }}>{code}</button>
        );
      })}
    </div>
  </CtrlGroup>
  <CtrlGroup label="24h sparkline" right={<Toggle on={c.showSpark !== false} onChange={v => set('showSpark', v)} />}>
    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Show a mini trend chart per currency</span>
  </CtrlGroup>
    </>
  );
  if (t === 'cryptoTicker') return (
    <>
    <>
  <CtrlGroup label="Coins">
    <input className="input" value={(c.symbols || ['BTC', 'ETH']).join(', ')} onChange={e => set('symbols', e.target.value.split(',').map(x => x.trim().toUpperCase()).filter(Boolean))} placeholder="BTC, ETH, SOL" />
    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.4 }}>Comma-separated tickers. Try BTC, ETH, SOL, DOGE, LINK, ADA.</div>
  </CtrlGroup>
  <CtrlGroup label="Currency">
    <select className="select" value={c.fiat || 'USD'} onChange={e => set('fiat', e.target.value)}>
      <option value="USD">USD — $</option>
      <option value="EUR">EUR — €</option>
      <option value="GBP">GBP — £</option>
      <option value="JPY">JPY — ¥</option>
      <option value="INR">INR — ₹</option>
    </select>
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show sparkline</span><Toggle on={c.sparkline !== false} onChange={v => set('sparkline', v)} /></div>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'stockTicker') return (
    <>
    <>
  <CtrlGroup label="Symbols"><input className="input" value={(c.symbols || []).join(', ')} onChange={e => set('symbols', e.target.value.split(',').map(x => x.trim().toUpperCase()).filter(Boolean))} placeholder="AAPL, MSFT, NVDA" /></CtrlGroup>
  <CtrlGroup label="Currency"><select className="select" value={c.currency} onChange={e => set('currency', e.target.value)}>{['USD', 'EUR', 'GBP', 'JPY', 'INR'].map(k => <option key={k} value={k}>{k}</option>)}</select></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Trend sparkline</span><Toggle on={c.sparkline} onChange={v => set('sparkline', v)} /></div></CtrlGroup>
</>
    </>
  );
  if (t === 'weatherForecast') return (
    <>
    <>
  <CtrlGroup label="City"><select className="select" value={c.city} onChange={e => set('city', e.target.value)}>{['Lisbon', 'London', 'New York', 'Tokyo'].map(z => <option key={z} value={z}>{z}</option>)}</select></CtrlGroup>
  <CtrlGroup label="Units"><Segmented value={c.units} onChange={v => set('units', v)} options={[{ v: 'C', l: 'Celsius' }, { v: 'F', l: 'Fahrenheit' }]} /></CtrlGroup>
  <CtrlGroup label="Outlook" right={<span style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{c.days || 4} days</span>}><input className="range" type="range" min="2" max="7" step="1" value={c.days || 4} onChange={e => set('days', Number(e.target.value))} /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Hourly graph</span><Toggle on={c.showHourly} onChange={v => set('showHourly', v)} /></div></CtrlGroup>
</>
    </>
  );
  if (t === 'onThisDay') return (
    <>
    <>
  <CtrlGroup label="Category"><Segmented value={c.category} onChange={v => set('category', v)} options={[{ v: 'events', l: 'Events' }, { v: 'births', l: 'Births' }, { v: 'discoveries', l: 'Science' }]} /></CtrlGroup>
  <CtrlGroup label="Stories shown"><Segmented value={String(c.count)} onChange={v => set('count', Number(v))} options={[{ v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3' }]} /></CtrlGroup>
  <CtrlGroup label="Language"><select className="select" value={c.language} onChange={e => set('language', e.target.value)}><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option></select></CtrlGroup>
  <CtrlGroup label="About"><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>Surfaces a moment from history for today's date and rotates to a fresh one each morning.</div></CtrlGroup>
</>
    </>
  );
  if (t === 'githubHeatmap') return (
    <>
    <>
  <CtrlGroup label="GitHub username"><input className="input" value={c.username || ''} onChange={e => set('username', e.target.value)} placeholder="octocat" /></CtrlGroup>
  <CtrlGroup label="Year"><input className="input" type="number" value={c.year || 2026} onChange={e => set('year', Number(e.target.value) || 2026)} placeholder="2026" /></CtrlGroup>
  <CtrlGroup label="Color scheme"><Segmented value={c.scheme || 'github'} onChange={v => set('scheme', v)} options={[{ v: 'github', l: 'GitHub' }, { v: 'ocean', l: 'Ocean' }, { v: 'violet', l: 'Violet' }, { v: 'sunset', l: 'Sunset' }, { v: 'accent', l: 'Accent' }]} /></CtrlGroup>
  <CtrlGroup label="Streak stats" right={<Toggle on={c.showStreak !== false} onChange={v => set('showStreak', v)} />}>
    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Show current streak and longest streak</span>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'githubStars') return (
    <>
    <>
  <CtrlGroup label="Repository"><select className="select" value={c.repo} onChange={e => set('repo', e.target.value)}>
    {['facebook/react', 'vercel/next.js', 'tailwindlabs/tailwindcss', 'denoland/deno'].map(r => <option key={r} value={r}>{r}</option>)}
  </select></CtrlGroup>
  <CtrlGroup label="Stats">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show forks &amp; watchers</span><Toggle on={c.showForks ?? true} onChange={v => set('showForks', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Motion">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Animate star count</span><Toggle on={c.animate ?? true} onChange={v => set('animate', v)} /></div>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'npmDownloads') return (
    <>
    <>
  <CtrlGroup label="Package">
    <input className="input" value={c.package} onChange={e => set('package', e.target.value)} placeholder="e.g. react, next, axios" />
  </CtrlGroup>
  <CtrlGroup label="Period">
    <Segmented value={c.period} onChange={v => set('period', v)} options={[{ v: 'day', l: 'Day' }, { v: 'week', l: 'Week' }, { v: 'month', l: 'Month' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>7-day bar history</span><Toggle on={c.showChart} onChange={v => set('showChart', v)} /></div>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'latestRelease') return (
    <>
    <>
  <CtrlGroup label="Source"><Segmented value={c.source} onChange={v => set('source', v)} options={[{ v: 'npm', l: 'npm' }, { v: 'github', l: 'GitHub' }, { v: 'pypi', l: 'PyPI' }]} /></CtrlGroup>
  <CtrlGroup label="Package / repo">
    <input className="input" value={c.id} onChange={e => set('id', e.target.value)} placeholder={c.source === 'github' ? 'owner/name' : c.source === 'pypi' ? 'fastapi' : 'astro'} />
  </CtrlGroup>
  <CtrlGroup label="Install command (optional)">
    <input className="input" value={c.installCmd || ''} onChange={e => set('installCmd', e.target.value)} placeholder="Auto from package" />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Install line</span><Toggle on={c.showInstall !== false} onChange={v => set('showInstall', v)} /></div>
      <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Release notes</span><Toggle on={c.showNotes !== false} onChange={v => set('showNotes', v)} /></div>
    </div>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'buildStatus') return (
    <>
    <>
  <CtrlGroup label="Repository"><input className="input" value={c.repo} onChange={e => set('repo', e.target.value)} placeholder="owner/repo" /></CtrlGroup>
  <CtrlGroup label="Branch"><input className="input" value={c.branch} onChange={e => set('branch', e.target.value)} placeholder="main" /></CtrlGroup>
  <CtrlGroup label="Provider"><select className="select" value={c.provider} onChange={e => set('provider', e.target.value)}>
    <option value="github">GitHub Actions</option>
    <option value="gitlab">GitLab CI</option>
    <option value="circle">CircleCI</option>
  </select></CtrlGroup>
  <CtrlGroup label="Latest result"><Segmented value={c.status} onChange={v => set('status', v)} options={[{ v: 'passing', l: 'Passing' }, { v: 'running', l: 'Running' }, { v: 'failing', l: 'Failing' }]} /></CtrlGroup>
</>
    </>
  );
  if (t === 'uptimeMonitor') return (
    <>
    <>
  <CtrlGroup label="Title"><input className="input" value={c.title} onChange={e => set('title', e.target.value)} placeholder="Status" /></CtrlGroup>
  <CtrlGroup label="Endpoints">
    <input className="input" value={(c.endpoints || []).join('\n')} onChange={e => set('endpoints', e.target.value.split('\n').map(x => x.trim()).filter(Boolean))} placeholder={'api.acme.io\napp.acme.io\ncdn.acme.io'} />
    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.5 }}>One host per line. Leave blank for a sample set.</div>
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>24-hour bars</span><Toggle on={c.bars !== false} onChange={v => set('bars', v)} /></div>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'subscriberCount') return (
    <>
    <>
  <CtrlGroup label="Platform"><Segmented value={c.platform} onChange={v => set('platform', v)} options={[{ v: 'youtube', l: 'YouTube' }, { v: 'twitch', l: 'Twitch' }, { v: 'tiktok', l: 'TikTok' }, { v: 'patreon', l: 'Patreon' }]} /></CtrlGroup>
  <CtrlGroup label="Channel handle"><input className="input" value={c.handle} onChange={e => set('handle', e.target.value)} placeholder="@channel" /></CtrlGroup>
  <CtrlGroup label="Number style"><Segmented value={c.style} onChange={v => set('style', v)} options={[{ v: 'odometer', l: 'Odometer' }, { v: 'compact', l: 'Compact' }]} /></CtrlGroup>
  <CtrlGroup label="Tip"><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>Try handles like <span style={{ color: 'var(--text-1)' }}>@mkbhd</span> or <span style={{ color: 'var(--text-1)' }}>@veritasium</span> on YouTube to preview large counts.</div></CtrlGroup>
</>
    </>
  );
  if (t === 'followerGoal') return (
    <>
    <>
  <CtrlGroup label="Platform">
    <select className="select" value={c.platform || 'youtube'} onChange={e => set('platform', e.target.value)}>
      <option value="youtube">YouTube</option>
      <option value="instagram">Instagram</option>
      <option value="twitter">X (Twitter)</option>
      <option value="tiktok">TikTok</option>
      <option value="twitch">Twitch</option>
      <option value="github">GitHub</option>
    </select>
  </CtrlGroup>
  <CtrlGroup label="Handle"><input className="input" value={c.handle || ''} onChange={e => set('handle', e.target.value)} placeholder="@channel" /></CtrlGroup>
  <CtrlGroup label="Milestone goal"><input className="input" type="number" min="1" value={c.goal} onChange={e => set('goal', e.target.value === '' ? '' : +e.target.value)} placeholder="100000" /></CtrlGroup>
  <CtrlGroup label="Style"><Segmented value={c.style || 'ring'} onChange={v => set('style', v)} options={[{ v: 'ring', l: 'Ring' }, { v: 'bar', l: 'Bar' }]} /></CtrlGroup>
</>
    </>
  );
  if (t === 'twitchStatus') return (
    <>
    <>
  <CtrlGroup label="Channel"><input className="input" value={c.channel} onChange={e => set('channel', e.target.value)} placeholder="channelname" /></CtrlGroup>
  <CtrlGroup label="Offline message"><input className="input" value={c.offlineMessage} onChange={e => set('offlineMessage', e.target.value)} placeholder="Offline" /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show viewer count</span><Toggle on={c.showViewers} onChange={v => set('showViewers', v)} /></div></CtrlGroup>
</>
    </>
  );
  if (t === 'spotifyEmbed') return (
    <>
    <>
  <CtrlGroup label="Spotify link">
    <input className="input" value={c.url} onChange={e => set('url', e.target.value)} placeholder="Paste a playlist, album or track link" />
    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.5 }}>Paste any Spotify share link. Sample content shows until your own loads.</div>
  </CtrlGroup>
  <CtrlGroup label="Theme">
    <Segmented value={c.theme} onChange={v => set('theme', v)} options={[{ v: 'dark', l: 'Dark' }, { v: 'light', l: 'Light' }]} />
  </CtrlGroup>
  <CtrlGroup label="Size">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Compact layout</span><Toggle on={c.compact} onChange={v => set('compact', v)} /></div>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'hitCounter') return (
    <>
    <>
  <CtrlGroup label="Page ID"><input className="input" value={c.id} onChange={e => set('id', e.target.value)} placeholder="my-page" /></CtrlGroup>
  <CtrlGroup label="Style"><Segmented value={c.style} onChange={v => set('style', v)} options={[{ v: 'odometer', l: 'Odometer' }, { v: 'pill', l: 'Pill' }, { v: 'minimal', l: 'Minimal' }]} /></CtrlGroup>
  <CtrlGroup label="Unit label"><input className="input" value={c.label} onChange={e => set('label', e.target.value)} placeholder="views" /></CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Today &amp; 7-day totals</span><Toggle on={c.showToday !== false} onChange={v => set('showToday', v)} /></div>
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Trend sparkline</span><Toggle on={c.showSpark !== false} onChange={v => set('showSpark', v)} /></div>
  </CtrlGroup>
</>
    </>
  );
  if (t === 'clock') return (
    <>
      <CtrlGroup label="Timezone"><select className="select" value={c.tz} onChange={e => set('tz', e.target.value)}>{TIMEZONES.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}</select></CtrlGroup>
      <CtrlGroup label="Format"><Segmented value={c.format} onChange={v => set('format', v)} options={[{ v: '12', l: '12-hour' }, { v: '24', l: '24-hour' }]} /></CtrlGroup>
      <CtrlGroup label="Display">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show seconds</span><Toggle on={c.seconds} onChange={v => set('seconds', v)} /></div>
          <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show date</span><Toggle on={c.showDate} onChange={v => set('showDate', v)} /></div>
        </div>
      </CtrlGroup>
      <CtrlGroup label="Label (optional)"><input className="input" placeholder="e.g. New York office" value={c.label} onChange={e => set('label', e.target.value)} /></CtrlGroup>
    </>
  );
  if (t === 'countdown') return (
    <>
      <CtrlGroup label="Title"><input className="input" value={c.title} onChange={e => set('title', e.target.value)} placeholder="What are you counting to?" /></CtrlGroup>
      <CtrlGroup label="Target date"><input className="input" type="date" value={c.target} onChange={e => set('target', e.target.value)} /></CtrlGroup>
    </>
  );
  if (t === 'pomodoro') return (
    <>
      <CtrlGroup label="Focus length" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.work} min</span>}><input className="range" type="range" min="5" max="60" step="5" value={c.work} onChange={e => set('work', +e.target.value)} /></CtrlGroup>
      <CtrlGroup label="Break length" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.brk} min</span>}><input className="range" type="range" min="1" max="20" step="1" value={c.brk} onChange={e => set('brk', +e.target.value)} /></CtrlGroup>
    </>
  );
  if (t === 'weather') return (
    <>
      <CtrlGroup label="City"><select className="select" value={c.city} onChange={e => set('city', e.target.value)}>{WEATHER_CITIES.map(z => <option key={z} value={z}>{z}</option>)}</select></CtrlGroup>
      <CtrlGroup label="Units"><Segmented value={c.units} onChange={v => set('units', v)} options={[{ v: 'C', l: 'Celsius' }, { v: 'F', l: 'Fahrenheit' }]} /></CtrlGroup>
      <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>4-day forecast</span><Toggle on={c.forecast} onChange={v => set('forecast', v)} /></div></CtrlGroup>
    </>
  );
  if (t === 'quote') return (
    <>
      <CtrlGroup label="Collection"><select className="select" value={c.collection} onChange={e => set('collection', e.target.value)}>{Object.keys(QUOTES).map(k => <option key={k} value={k}>{k}</option>)}</select></CtrlGroup>
      <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show author</span><Toggle on={c.author} onChange={v => set('author', v)} /></div></CtrlGroup>
    </>
  );
  if (t === 'habit') return (
    <CtrlGroup label="Habit name"><input className="input" value={c.habit} onChange={e => set('habit', e.target.value)} placeholder="e.g. Read 20 min" /></CtrlGroup>
  );
  if (t === 'calendar') return (
    <CtrlGroup label="About"><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>Shows the current month and highlights today automatically. Recolor it with your accent.</div></CtrlGroup>
  );
  if (t === 'analogClock') return (
    (<>
  <CtrlGroup label="Timezone">
    <select className="select" value={c.tz} onChange={e => set('tz', e.target.value)}>
      <option value="America/New_York">New York</option>
      <option value="America/Chicago">Chicago</option>
      <option value="America/Denver">Denver</option>
      <option value="America/Los_Angeles">Los Angeles</option>
      <option value="America/Sao_Paulo">São Paulo</option>
      <option value="Europe/London">London</option>
      <option value="Europe/Paris">Paris</option>
      <option value="Europe/Berlin">Berlin</option>
      <option value="Europe/Moscow">Moscow</option>
      <option value="Asia/Dubai">Dubai</option>
      <option value="Asia/Kolkata">Mumbai</option>
      <option value="Asia/Singapore">Singapore</option>
      <option value="Asia/Shanghai">Shanghai</option>
      <option value="Asia/Tokyo">Tokyo</option>
      <option value="Australia/Sydney">Sydney</option>
    </select>
  </CtrlGroup>
  <CtrlGroup label="Dial">
    <Segmented value={c.dial} onChange={v => set('dial', v)} options={[{ v: 'minimal', l: 'Minimal' }, { v: 'arabic', l: 'Arabic' }, { v: 'roman', l: 'Roman' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Second hand</span><Toggle on={c.seconds} onChange={v => set('seconds', v)} /></div>
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show numbers</span><Toggle on={c.showNumbers} onChange={v => set('showNumbers', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Label (optional)">
    <input className="input" value={c.label || ''} placeholder="Auto from timezone" onChange={e => set('label', e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'flipClock') return (
    (<>
  <CtrlGroup label="Format"><Segmented value={c.format} onChange={v => set('format', v)} options={[{ v: '24', l: '24-hour' }, { v: '12', l: '12-hour' }]} /></CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show seconds</span><Toggle on={c.seconds} onChange={v => set('seconds', v)} /></div>
    <div className="field-row" style={{ marginTop: 8 }}><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show date</span><Toggle on={c.showDate} onChange={v => set('showDate', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Time zone">
    <select className="select" value={c.tz || 'local'} onChange={e => set('tz', e.target.value)}>
      <option value="local">Local time</option>
      <option value="America/Los_Angeles">Los Angeles</option>
      <option value="America/New_York">New York</option>
      <option value="Europe/London">London</option>
      <option value="Europe/Paris">Paris</option>
      <option value="Asia/Kolkata">Kolkata</option>
      <option value="Asia/Tokyo">Tokyo</option>
      <option value="Australia/Sydney">Sydney</option>
      <option value="UTC">UTC</option>
    </select>
  </CtrlGroup>
</>)
  );
  if (t === 'worldClockBoard') return (
    (<>
  <CtrlGroup label="Cities (comma separated, up to 5)">
    <input className="input" value={Array.isArray(c.cities) ? c.cities.join(', ') : (c.cities || '')} onChange={e => set('cities', e.target.value.split(',').map(x => x.trim()).filter(Boolean))} placeholder="London, New York, Tokyo" />
    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>Try: London, Paris, New York, Tokyo, Sydney, Dubai, Singapore, Mumbai, Hong Kong, San Francisco.</div>
  </CtrlGroup>
  <CtrlGroup label="Style">
    <Segmented value={c.style || 'digital'} onChange={v => set('style', v)} options={[{ v: 'digital', l: 'Digital' }, { v: 'analog', l: 'Analog' }]} />
  </CtrlGroup>
  <CtrlGroup label="Time format">
    <Segmented value={c.format || '12'} onChange={v => set('format', v)} options={[{ v: '12', l: '12-hour' }, { v: '24', l: '24-hour' }]} />
  </CtrlGroup>
</>)
  );
  if (t === 'dateCard') return (
    (<>
  <CtrlGroup label="Date format">
    <Segmented value={c.format || 'long'} onChange={v => set('format', v)} options={[{ v: 'long', l: 'Stacked' }, { v: 'short', l: 'Short' }, { v: 'numeric', l: 'Numeric' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show weekday</span><Toggle on={c.showDay !== false} onChange={v => set('showDay', v)} /></div>
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show week number</span><Toggle on={c.showWeekNumber !== false} onChange={v => set('showWeekNumber', v)} /></div>
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Accent the weekday</span><Toggle on={c.accentDay !== false} onChange={v => set('accentDay', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'countup') return (
    (<>
  <CtrlGroup label="Title"><input className="input" value={c.title} onChange={e => set('title', e.target.value)} placeholder="Days together" /></CtrlGroup>
  <CtrlGroup label="Start date"><input className="input" type="date" value={c.start} onChange={e => set('start', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Count in"><Segmented value={c.unit} onChange={v => set('unit', v)} options={[{ v: 'days', l: 'Days' }, { v: 'weeks', l: 'Weeks' }, { v: 'months', l: 'Months' }, { v: 'hours', l: 'Hours' }]} /></CtrlGroup>
</>)
  );
  if (t === 'lifeProgress') return (
    (<>
  <CtrlGroup label="Scopes">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[{ v: 'day', l: 'Day' }, { v: 'week', l: 'Week' }, { v: 'month', l: 'Month' }, { v: 'year', l: 'Year' }, { v: 'life', l: 'Life' }].map(o => {
        const cur = c.scopes || ['day', 'week', 'year', 'life'];
        const on = cur.indexOf(o.v) !== -1;
        return (
          <div key={o.v} className="field-row">
            <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{o.l}</span>
            <Toggle on={on} onChange={v => {
              const next = v ? ['day', 'week', 'month', 'year', 'life'].filter(k => k === o.v || cur.indexOf(k) !== -1) : cur.filter(k => k !== o.v);
              set('scopes', next.length ? next : cur);
            }} />
          </div>
        );
      })}
    </div>
  </CtrlGroup>
  <CtrlGroup label="Style">
    <Segmented value={c.style || 'bar'} onChange={v => set('style', v)} options={[{ v: 'bar', l: 'Bar' }, { v: 'dots', l: 'Segments' }]} />
  </CtrlGroup>
  <CtrlGroup label="Birth date">
    <input className="input" type="date" value={c.birthDate || '1995-06-01'} onChange={e => set('birthDate', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Life expectancy" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.lifeExpectancy || 85} yrs</span>}>
    <input className="range" type="range" min="40" max="110" step="1" value={c.lifeExpectancy || 85} onChange={e => set('lifeExpectancy', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Title (optional)">
    <input className="input" value={c.title || ''} onChange={e => set('title', e.target.value)} placeholder="Life in Progress" />
  </CtrlGroup>
</>)
  );
  if (t === 'yearProgress') return (
    (<>
  <CtrlGroup label="Scope"><Segmented value={c.scope || 'year'} onChange={v => set('scope', v)} options={[{ v: 'day', l: 'Day' }, { v: 'week', l: 'Week' }, { v: 'month', l: 'Month' }, { v: 'year', l: 'Year' }]} /></CtrlGroup>
  <CtrlGroup label="Bar style"><Segmented value={c.style || 'solid'} onChange={v => set('style', v)} options={[{ v: 'solid', l: 'Solid' }, { v: 'gradient', l: 'Gradient' }, { v: 'segments', l: 'Segments' }]} /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show percentage</span><Toggle on={c.showPercent !== false} onChange={v => set('showPercent', v)} /></div></CtrlGroup>
</>)
  );
  if (t === 'lifeInWeeks') return (
    (<>
  <CtrlGroup label="Birth date">
    <input className="input" type="date" value={c.birthDate || '1995-06-01'} onChange={e => set('birthDate', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Life expectancy" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.lifeExpectancy || 90} yrs</span>}>
    <input className="range" type="range" min="40" max="120" step="1" value={c.lifeExpectancy || 90} onChange={e => set('lifeExpectancy', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Filled color">
    <input className="input" type="color" value={c.filledColor || accent} onChange={e => set('filledColor', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Title (optional)">
    <input className="input" value={c.title || ''} onChange={e => set('title', e.target.value)} placeholder="Life in Weeks" />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Dim future weeks</span><Toggle on={c.showMuted !== false} onChange={v => set('showMuted', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'moonPhase') return (
    (<>
  <CtrlGroup label="Hemisphere"><Segmented value={c.hemisphere} onChange={v => set('hemisphere', v)} options={[{ v: 'north', l: 'Northern' }, { v: 'south', l: 'Southern' }]} /></CtrlGroup>
  <CtrlGroup label="Render style"><Segmented value={c.style} onChange={v => set('style', v)} options={[{ v: 'realistic', l: 'Realistic' }, { v: 'flat', l: 'Flat' }]} /></CtrlGroup>
  <CtrlGroup label="Details">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show illumination %</span><Toggle on={c.showIllumination} onChange={v => set('showIllumination', v)} /></div>
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show next phase</span><Toggle on={c.showNextPhase} onChange={v => set('showNextPhase', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'dayNightMap') return (
    (<>
  <CtrlGroup label="Map style">
    <Segmented value={c.mapStyle || 'minimal'} onChange={v => set('mapStyle', v)} options={[{ v: 'minimal', l: 'Minimal' }, { v: 'flat', l: 'Flat' }, { v: 'satellite', l: 'Tinted' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show cities</span><Toggle on={c.showCities !== false} onChange={v => set('showCities', v)} /></div>
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Twilight bands</span><Toggle on={!!c.twilightBands} onChange={v => set('twilightBands', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Title (optional)">
    <input className="input" value={c.title || ''} placeholder="Day & Night" onChange={e => set('title', e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'stopwatch') return (
    (<>
  <CtrlGroup label="Time format">
    <Segmented value={c.format || 'mm:ss.cs'} onChange={v => set('format', v)} options={[{ v: 'mm:ss.cs', l: 'mm:ss.cs' }, { v: 'mm:ss', l: 'mm:ss' }, { v: 'hh:mm:ss', l: 'hh:mm:ss' }]} />
  </CtrlGroup>
  <CtrlGroup label="Laps">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Enable lap times</span><Toggle on={c.showLaps !== false} onChange={v => set('showLaps', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'progressRing') return (
    (<>
  <CtrlGroup label="Label"><input className="input" value={c.label} onChange={e => set('label', e.target.value)} placeholder="Pages read" /></CtrlGroup>
  <CtrlGroup label="Progress">
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Current</div>
        <input className="input" type="number" value={c.current} onChange={e => set('current', +e.target.value)} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Target</div>
        <input className="input" type="number" value={c.target} onChange={e => set('target', +e.target.value)} />
      </div>
    </div>
  </CtrlGroup>
  <CtrlGroup label="Center display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show percent</span><Toggle on={c.showPercent} onChange={v => set('showPercent', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'progressBar') return (
    (<>
  <CtrlGroup label="Label"><input className="input" value={c.label || ''} placeholder="Q3 goal" onChange={e => set('label', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Current" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.current}</span>}>
    <input className="input" type="number" value={c.current} onChange={e => set('current', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Target" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.target}</span>}>
    <input className="input" type="number" value={c.target} onChange={e => set('target', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Unit (optional)"><input className="input" value={c.unit || ''} placeholder="pts, $, km…" onChange={e => set('unit', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Style"><Segmented value={c.style || 'solid'} onChange={v => set('style', v)} options={[{ v: 'solid', l: 'Solid' }, { v: 'gradient', l: 'Gradient' }, { v: 'striped', l: 'Striped' }, { v: 'thin', l: 'Thin' }]} /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show values</span><Toggle on={c.showValues !== false} onChange={v => set('showValues', v)} /></div></CtrlGroup>
</>)
  );
  if (t === 'counter') return (
    (<>
  <CtrlGroup label="Label"><input className="input" value={c.label || ''} placeholder="Books" onChange={e => set('label', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Step size" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>+{c.step || 1}</span>}>
    <input className="range" type="range" min="1" max="25" step="1" value={c.step || 1} onChange={e => set('step', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Start value">
    <input className="input" type="number" value={Number.isFinite(c.start) ? c.start : 0} onChange={e => set('start', e.target.value === '' ? 0 : +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Limits (optional)">
    <div className="field-row" style={{ gap: 8 }}>
      <input className="input" type="number" placeholder="min" value={Number.isFinite(c.min) ? c.min : ''} onChange={e => set('min', e.target.value === '' ? null : +e.target.value)} />
      <input className="input" type="number" placeholder="max" value={Number.isFinite(c.max) ? c.max : ''} onChange={e => set('max', e.target.value === '' ? null : +e.target.value)} />
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'checklist') return (
    (<>
  <CtrlGroup label="Title"><input className="input" value={c.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Today" /></CtrlGroup>
  <CtrlGroup label="Items">
    <textarea className="input" rows={4} style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} value={(Array.isArray(c.items) ? c.items : []).join('\n')} onChange={e => set('items', e.target.value.split('\n'))} placeholder={'One per line\nPlan day\nDeep work'} />
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>One task per line.</div>
  </CtrlGroup>
  <CtrlGroup label="Reset"><Segmented value={c.reset || 'daily'} onChange={v => set('reset', v)} options={[{ v: 'daily', l: 'Daily' }, { v: 'weekly', l: 'Weekly' }, { v: 'never', l: 'Never' }]} /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Progress bar</span><Toggle on={c.showProgress !== false} onChange={v => set('showProgress', v)} /></div></CtrlGroup>
</>)
  );
  if (t === 'linkButton') return (
    (<>
  <CtrlGroup label="Button text">
    <input className="input" value={c.label} placeholder="Open link" onChange={e => set('label', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Destination URL">
    <input className="input" value={c.url} placeholder="https://example.com" onChange={e => set('url', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Style">
    <Segmented value={c.variant || 'solid'} onChange={v => set('variant', v)} options={[{ v: 'solid', l: 'Solid' }, { v: 'soft', l: 'Soft' }, { v: 'outline', l: 'Outline' }]} />
  </CtrlGroup>
  <CtrlGroup label="Icon">
    <select className="select" value={c.icon || 'none'} onChange={e => set('icon', e.target.value)}>
      <option value="none">None</option>
      <option value="bolt">Bolt</option>
      <option value="rocket">Rocket</option>
      <option value="globe">Globe</option>
      <option value="calendar">Calendar</option>
      <option value="book">Book</option>
      <option value="inbox">Inbox</option>
      <option value="heart">Heart</option>
      <option value="star">Star</option>
      <option value="gift">Gift</option>
      <option value="coffee">Coffee</option>
      <option value="play">Compass</option>
      <option value="chart">Chart</option>
      <option value="bell">Bell</option>
      <option value="tag">Tag</option>
      <option value="music">Music</option>
    </select>
  </CtrlGroup>
  <CtrlGroup label="Alignment">
    <Segmented value={c.align || 'fill'} onChange={v => set('align', v)} options={[{ v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' }, { v: 'fill', l: 'Fill' }]} />
  </CtrlGroup>
  <CtrlGroup label="Heading (optional)">
    <input className="input" value={c.heading} placeholder="—" onChange={e => set('heading', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Caption (optional)">
    <input className="input" value={c.caption} placeholder="—" onChange={e => set('caption', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Behaviour">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show arrow</span><Toggle on={c.showArrow !== false} onChange={v => set('showArrow', v)} /></div>
    <div className="field-row" style={{ marginTop: 8 }}><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Open in new tab</span><Toggle on={c.newTab !== false} onChange={v => set('newTab', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'buttonGrid') return (
    (<>
  <CtrlGroup label="Title (optional)"><input className="input" placeholder="e.g. Quick Launch" value={c.title} onChange={e => set('title', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Layout"><Segmented value={c.layout || 'tile'} onChange={v => set('layout', v)} options={[{ v: 'tile', l: 'Grid' }, { v: 'list', l: 'List' }]} /></CtrlGroup>
  {(c.layout || 'tile') === 'tile' ? (
    <CtrlGroup label="Columns" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.columns || 3}</span>}><input className="range" type="range" min="1" max="5" step="1" value={c.columns || 3} onChange={e => set('columns', +e.target.value)} /></CtrlGroup>
  ) : null}
  <CtrlGroup label="Corner radius" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.radius == null ? 14 : c.radius}</span>}><input className="range" type="range" min="4" max="22" step="1" value={c.radius == null ? 14 : c.radius} onChange={e => set('radius', +e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Shortcuts">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(Array.isArray(c.buttons) ? c.buttons : []).map((b, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 10, border: '1px solid var(--line, rgba(0,0,0,0.08))' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" style={{ flex: 1 }} placeholder="Label" value={b.label || ''} onChange={e => set('buttons', c.buttons.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <button onClick={() => set('buttons', c.buttons.filter((x, j) => j !== i))} style={{ flexShrink: 0, width: 32, borderRadius: 8, border: '1px solid var(--line, rgba(0,0,0,0.1))', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
          <input className="input" placeholder="https://example.com" value={b.url || ''} onChange={e => set('buttons', c.buttons.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
          <select className="select" value={b.icon || 'rocket'} onChange={e => set('buttons', c.buttons.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}>
            {['rocket', 'inbox', 'book', 'folder', 'calendar', 'globe', 'compass', 'bolt', 'chart', 'wallet', 'music', 'camera', 'coffee', 'palette', 'code', 'bell', 'star', 'heart', 'home', 'gem', 'flag', 'tag', 'bookmark', 'lightbulb'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
          </select>
        </div>
      ))}
      <button onClick={() => set('buttons', [...(Array.isArray(c.buttons) ? c.buttons : []), { label: 'New', url: 'https://', icon: 'rocket' }])} style={{ height: 34, borderRadius: 8, border: '1px dashed var(--line, rgba(0,0,0,0.18))', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Add shortcut</button>
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'focusTimerPro') return (
    (<>
  <CtrlGroup label="Task (optional)">
    <input className="input" value={c.task || ''} placeholder="What are you focusing on?" onChange={e => set('task', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Focus length" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.work || 25} min</span>}>
    <input className="range" type="range" min="5" max="60" step="5" value={c.work || 25} onChange={e => set('work', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Short break" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.brk || 5} min</span>}>
    <input className="range" type="range" min="1" max="20" step="1" value={c.brk || 5} onChange={e => set('brk', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Long break" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.longBreak || 15} min</span>}>
    <input className="range" type="range" min="5" max="40" step="5" value={c.longBreak || 15} onChange={e => set('longBreak', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Cycles before long break" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.cycles || 4}</span>}>
    <input className="range" type="range" min="2" max="8" step="1" value={c.cycles || 4} onChange={e => set('cycles', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Ambient sound">
    <Segmented value={c.sound || 'off'} onChange={v => set('sound', v)} options={[{ v: 'off', l: 'Off' }, { v: 'rain', l: 'Rain' }, { v: 'waves', l: 'Waves' }, { v: 'noise', l: 'Noise' }, { v: 'tone', l: 'Tone' }]} />
  </CtrlGroup>
</>)
  );
  if (t === 'todayHeader') return (
    (<>
  <CtrlGroup label="Scopes">
    {[{ k: 'day', l: 'Today' }, { k: 'week', l: 'This Week' }, { k: 'month', l: 'This Month' }, { k: 'year', l: 'This Year' }].map(o => {
      const list = Array.isArray(c.scopes) ? c.scopes : ['day', 'week', 'month', 'year'];
      const on = list.includes(o.k);
      return (
        <div key={o.k} className="field-row">
          <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{o.l}</span>
          <Toggle on={on} onChange={v => {
            const base = Array.isArray(c.scopes) ? c.scopes : ['day', 'week', 'month', 'year'];
            const order = ['day', 'week', 'month', 'year'];
            let next = v ? [...new Set([...base, o.k])] : base.filter(x => x !== o.k);
            if (!next.length) next = [o.k];
            next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
            set('scopes', next);
          }} />
        </div>
      );
    })}
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show percentage</span>
      <Toggle on={c.showPercent !== false} onChange={v => set('showPercent', v)} />
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'miniCalendar') return (
    (<>
  <CtrlGroup label="Week starts on"><Segmented value={c.weekStart} onChange={v => set('weekStart', v)} options={[{ v: 'Mon', l: 'Monday' }, { v: 'Sun', l: 'Sunday' }]} /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Week numbers</span><Toggle on={c.showWeekNumbers} onChange={v => set('showWeekNumbers', v)} /></div></CtrlGroup>
</>)
  );
  if (t === 'countdownEvent') return (
    (<>
  <CtrlGroup label="Title">
    <input className="input" value={c.title || ''} placeholder="Holidays" onChange={e => set('title', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Target date & time">
    <input className="input" type="datetime-local" value={c.target || ''} onChange={e => set('target', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Units shown">
    <Segmented
      value={(c.units && c.units.length === 4) ? 'dhms' : (c.units && c.units.length === 2) ? 'dh' : 'dhm'}
      onChange={v => set('units', v === 'dhms' ? ['d','h','m','s'] : v === 'dh' ? ['d','h'] : ['d','h','m'])}
      options={[{ v: 'dh', l: 'D · H' }, { v: 'dhm', l: 'D · H · M' }, { v: 'dhms', l: 'D · H · M · S' }]}
    />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show target date</span><Toggle on={c.showDate !== false} onChange={v => set('showDate', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Arrival message">
    <input className="input" value={c.doneText || ''} placeholder="It's here!" onChange={e => set('doneText', e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'weekPlanner') return (
    (<>
  <CtrlGroup label="Title (optional)">
    <input className="input" value={c.title || ''} onChange={e => set('title', e.target.value)} placeholder="This Week" />
  </CtrlGroup>
  <CtrlGroup label="Week starts on">
    <Segmented value={c.weekStart || 'Mon'} onChange={v => set('weekStart', v)} options={[{ v: 'Mon', l: 'Monday' }, { v: 'Sun', l: 'Sunday' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Highlight today</span>
      <Toggle on={c.accentToday !== false} onChange={v => set('accentToday', v)} />
    </div>
  </CtrlGroup>
  <CtrlGroup label="About">
    <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>Click the dashed button under any day to jot a note. Click a note to remove it. Notes save automatically in your browser.</div>
  </CtrlGroup>
</>)
  );
  if (t === 'savingsRing') return (
    (<>
  <CtrlGroup label="Goal name"><input className="input" value={c.goal} onChange={e => set('goal', e.target.value)} placeholder="Emergency fund" /></CtrlGroup>
  <CtrlGroup label="Currency"><Segmented value={c.currency} onChange={v => set('currency', v)} options={[{ v: 'USD', l: '$' }, { v: 'EUR', l: '€' }, { v: 'GBP', l: '£' }, { v: 'INR', l: '₹' }, { v: 'JPY', l: '¥' }]} /></CtrlGroup>
  <CtrlGroup label="Saved so far"><input className="input" type="number" min="0" value={c.current} onChange={e => set('current', +e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Target amount"><input className="input" type="number" min="1" value={c.target} onChange={e => set('target', +e.target.value)} /></CtrlGroup>
</>)
  );
  if (t === 'budgetRing') return (
    (<>
  <CtrlGroup label="Category"><input className="input" value={c.category} onChange={e => set('category', e.target.value)} placeholder="Groceries" /></CtrlGroup>
  <CtrlGroup label="Budget" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.budget}</span>}>
    <input className="input" type="number" min="0" value={c.budget} onChange={e => set('budget', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Spent" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.spent}</span>}>
    <input className="input" type="number" min="0" value={c.spent} onChange={e => set('spent', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Currency">
    <Segmented value={c.currency} onChange={v => set('currency', v)} options={[{ v: 'USD', l: '$ USD' }, { v: 'EUR', l: '€ EUR' }, { v: 'GBP', l: '£ GBP' }, { v: 'INR', l: '₹ INR' }]} />
  </CtrlGroup>
  <CtrlGroup label="Warn at" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.warnAt}%</span>}>
    <input className="range" type="range" min="50" max="95" step="5" value={c.warnAt} onChange={e => set('warnAt', +e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'subscriptionCounter') return (
    (<>
  <CtrlGroup label="View">
    <Segmented value={c.view} onChange={v => set('view', v)} options={[{ v: 'monthly', l: 'Monthly' }, { v: 'yearly', l: 'Yearly' }]} />
  </CtrlGroup>
  <CtrlGroup label="Currency">
    <select className="select" value={c.currency} onChange={e => set('currency', e.target.value)}>
      <option value="USD">USD $</option>
      <option value="EUR">EUR €</option>
      <option value="GBP">GBP £</option>
      <option value="JPY">JPY ¥</option>
      <option value="INR">INR ₹</option>
      <option value="CAD">CAD $</option>
      <option value="AUD">AUD $</option>
      <option value="BRL">BRL R$</option>
    </select>
  </CtrlGroup>
  <CtrlGroup label="Subscriptions">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(c.items || []).map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input className="input" style={{ flex: 2 }} placeholder="Name" value={it.name || ''} onChange={e => { const n = (c.items || []).map((x, j) => j === i ? { ...x, name: e.target.value } : x); set('items', n); }} />
          <input className="input" style={{ flex: 1, minWidth: 0 }} type="number" step="0.01" placeholder="0.00" value={it.amount} onChange={e => { const n = (c.items || []).map((x, j) => j === i ? { ...x, amount: +e.target.value } : x); set('items', n); }} />
          <select className="select" style={{ flex: 1.4, minWidth: 0 }} value={it.cycle || 'monthly'} onChange={e => { const n = (c.items || []).map((x, j) => j === i ? { ...x, cycle: e.target.value } : x); set('items', n); }}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button onClick={() => set('items', (c.items || []).filter((x, j) => j !== i))} style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, border: '1px solid var(--w-line)', color: 'var(--text-3)', fontSize: 15, lineHeight: 1, cursor: 'pointer', background: 'transparent' }}>×</button>
        </div>
      ))}
      <button onClick={() => set('items', [...(c.items || []), { name: '', amount: 0, cycle: 'monthly' }])} style={{ height: 30, borderRadius: 7, border: '1px dashed var(--w-line)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: 'transparent' }}>+ Add subscription</button>
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'netWorth') return (
    (<>
  <CtrlGroup label="Title (optional)">
    <input className="input" value={c.title || ''} placeholder="Net Worth" onChange={e => set('title', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Assets (comma-separated amounts)">
    <input className="input" value={(Array.isArray(c.assets) ? c.assets : []).join(', ')} placeholder="42000, 18000, 9500" onChange={e => set('assets', e.target.value.split(',').map(x => Number(x.trim())).filter(x => isFinite(x)))} />
  </CtrlGroup>
  <CtrlGroup label="Liabilities (comma-separated amounts)">
    <input className="input" value={(Array.isArray(c.liabilities) ? c.liabilities : []).join(', ')} placeholder="12000, 3400" onChange={e => set('liabilities', e.target.value.split(',').map(x => Number(x.trim())).filter(x => isFinite(x)))} />
  </CtrlGroup>
  <CtrlGroup label="Currency">
    <select className="select" value={c.currency || 'USD'} onChange={e => set('currency', e.target.value)}>
      <option value="USD">USD ($)</option>
      <option value="EUR">EUR (€)</option>
      <option value="GBP">GBP (£)</option>
      <option value="INR">INR (₹)</option>
      <option value="JPY">JPY (¥)</option>
      <option value="CAD">CAD ($)</option>
      <option value="AUD">AUD ($)</option>
    </select>
  </CtrlGroup>
  <CtrlGroup label="Trend range">
    <Segmented value={c.range || '12m'} onChange={v => set('range', v)} options={[{ v: '3m', l: '3M' }, { v: '6m', l: '6M' }, { v: '12m', l: '12M' }, { v: '24m', l: '24M' }]} />
  </CtrlGroup>
</>)
  );
  if (t === 'debtPayoff') return (
    (<>
  <CtrlGroup label="Strategy">
    <Segmented value={c.strategy} onChange={v => set('strategy', v)} options={[{ v: 'avalanche', l: 'Avalanche' }, { v: 'snowball', l: 'Snowball' }]} />
    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.4 }}>
      {c.strategy === 'snowball' ? 'Smallest balance first — fastest wins.' : 'Highest interest first — least interest paid.'}
    </div>
  </CtrlGroup>
  <CtrlGroup label="Extra per month" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.extra || 0}</span>}>
    <input className="range" type="range" min="0" max="1000" step="25" value={c.extra || 0} onChange={e => set('extra', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Currency">
    <Segmented value={c.currency} onChange={v => set('currency', v)} options={[{ v: 'USD', l: '$' }, { v: 'EUR', l: '€' }, { v: 'GBP', l: '£' }, { v: 'INR', l: '₹' }]} />
  </CtrlGroup>
  <CtrlGroup label="Title (optional)">
    <input className="input" value={c.title || ''} placeholder="Debt Free" onChange={e => set('title', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Debts">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(c.debts || []).map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 8, border: '1px solid var(--line)', borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" style={{ flex: 1 }} value={d.name || ''} placeholder="Name" onChange={e => set('debts', c.debts.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <button onClick={() => set('debts', c.debts.filter((_, j) => j !== i))} style={{ width: 30, borderRadius: 6, border: '1px solid var(--line)', color: 'var(--text-3)', background: 'transparent' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" type="number" style={{ flex: 1 }} value={d.balance ?? ''} placeholder="Balance" onChange={e => set('debts', c.debts.map((x, j) => j === i ? { ...x, balance: +e.target.value } : x))} />
            <input className="input" type="number" style={{ width: 64 }} value={d.rate ?? ''} placeholder="APR%" onChange={e => set('debts', c.debts.map((x, j) => j === i ? { ...x, rate: +e.target.value } : x))} />
            <input className="input" type="number" style={{ width: 64 }} value={d.min ?? ''} placeholder="Min" onChange={e => set('debts', c.debts.map((x, j) => j === i ? { ...x, min: +e.target.value } : x))} />
          </div>
        </div>
      ))}
      <button onClick={() => set('debts', [...(c.debts || []), { id: 'd' + Date.now(), name: 'New debt', balance: 1000, rate: 10, min: 50 }])} style={{ height: 32, borderRadius: 8, border: '1px dashed var(--line)', color: 'var(--text-2)', background: 'transparent', fontSize: 13, fontWeight: 600 }}>+ Add debt</button>
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'expenseSplitter') return (
    (<>
  <CtrlGroup label="Bill title (optional)">
    <input className="input" value={c.title || ''} placeholder="Bill split" onChange={e => set('title', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Total amount" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{(c.currency || '$')}{Number(c.total) || 0}</span>}>
    <input className="input" type="number" min="0" step="any" value={c.total ?? ''} onChange={e => set('total', e.target.value === '' ? 0 : +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Currency symbol">
    <Segmented value={c.currency || '$'} onChange={v => set('currency', v)} options={[{ v: '$', l: '$' }, { v: '€', l: '€' }, { v: '£', l: '£' }, { v: '₹', l: '₹' }]} />
  </CtrlGroup>
  <CtrlGroup label="Split mode">
    <Segmented value={c.mode === 'shares' ? 'shares' : 'even'} onChange={v => set('mode', v)} options={[{ v: 'even', l: 'Even' }, { v: 'shares', l: 'By shares' }]} />
  </CtrlGroup>
  <CtrlGroup label="Tip" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{Number(c.tip) || 0}%</span>}>
    <input className="range" type="range" min="0" max="30" step="1" value={Number(c.tip) || 0} onChange={e => set('tip', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="People (one per line)">
    <textarea className="input" rows={4} style={{ resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }} value={(Array.isArray(c.people) ? c.people : ['A', 'B', 'C']).join('\n')} onChange={e => set('people', e.target.value.split('\n').map(x => x.trim()).filter(Boolean))} />
  </CtrlGroup>
  {(c.mode === 'shares') ? (
    <CtrlGroup label="Shares (comma-separated, matches order)">
      <input className="input" placeholder="1, 1, 2" value={(Array.isArray(c.shares) ? c.shares : []).join(', ')} onChange={e => set('shares', e.target.value.split(',').map(x => Number(x.trim())).map(x => Number.isFinite(x) && x > 0 ? x : 1))} />
    </CtrlGroup>
  ) : null}
</>)
  );
  if (t === 'habitGrid') return (
    (<>
  <CtrlGroup label="Habits (one per line)">
    <textarea
      className="input"
      rows={4}
      style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
      value={(Array.isArray(c.habits) ? c.habits : ['Read', 'Workout', 'Meditate']).join('\n')}
      onChange={e => set('habits', e.target.value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 5))}
    />
    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>Up to 5 habits</div>
  </CtrlGroup>
  <CtrlGroup label="Period">
    <Segmented value={c.period || 'month'} onChange={v => set('period', v)} options={[{ v: 'week', l: 'This week' }, { v: 'month', l: 'This month' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show streak counter</span>
      <Toggle on={c.showStreak !== false} onChange={v => set('showStreak', v)} />
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'heatmapTracker') return (
    (<>
  <CtrlGroup label="Label"><input className="input" value={c.label || ''} placeholder="Practice" onChange={e => set('label', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Color scheme"><Segmented value={c.scheme || 'green'} onChange={v => set('scheme', v)} options={[{ v: 'green', l: 'Green' }, { v: 'blue', l: 'Blue' }, { v: 'purple', l: 'Purple' }, { v: 'orange', l: 'Orange' }, { v: 'accent', l: 'Accent' }]} /></CtrlGroup>
  <CtrlGroup label="Intensity levels" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.intensity || 4}</span>}><input className="range" type="range" min="2" max="5" step="1" value={c.intensity || 4} onChange={e => set('intensity', +e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Year"><input className="input" type="number" min="2000" max="2100" value={c.year || 2026} onChange={e => set('year', +e.target.value)} /></CtrlGroup>
</>)
  );
  if (t === 'waterTracker') return (
    (<>
  <CtrlGroup label="Daily goal" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.goalGlasses || 8} glasses</span>}>
    <input className="range" type="range" min="2" max="16" step="1" value={c.goalGlasses || 8} onChange={e => set('goalGlasses', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Glass size" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.glassMl || 250} ml</span>}>
    <input className="range" type="range" min="100" max="600" step="50" value={c.glassMl || 250} onChange={e => set('glassMl', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Glass icon">
    <Segmented value={c.icon || 'droplet'} onChange={v => set('icon', v)} options={[{ v: 'droplet', l: 'Droplet' }, { v: 'cup', l: 'Cup' }, { v: 'bottle', l: 'Bottle' }]} />
  </CtrlGroup>
</>)
  );
  if (t === 'moodTracker') return (
    (<>
  <CtrlGroup label="View">
    <Segmented value={c.view || 'calendar'} onChange={v => set('view', v)} options={[{ v: 'calendar', l: 'Calendar' }, { v: 'stats', l: 'Stats' }]} />
  </CtrlGroup>
  <CtrlGroup label="Title">
    <input className="input" value={c.title || ''} placeholder="Mood" onChange={e => set('title', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Moods">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(c.moods || []).map((mo, i) => (
        <div key={i} className="field-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input className="input" style={{ width: 44, textAlign: 'center', padding: '6px 4px' }} value={mo.emoji} maxLength={2} onChange={e => set('moods', (c.moods || []).map((m, j) => j === i ? { ...m, emoji: e.target.value } : m))} />
          <input className="input" style={{ flex: 1 }} value={mo.label} placeholder="Label" onChange={e => set('moods', (c.moods || []).map((m, j) => j === i ? { ...m, label: e.target.value } : m))} />
          <input type="color" value={mo.color} onChange={e => set('moods', (c.moods || []).map((m, j) => j === i ? { ...m, color: e.target.value } : m))} style={{ width: 30, height: 30, padding: 0, border: '1px solid var(--w-line)', borderRadius: 6, background: 'transparent', cursor: 'pointer' }} />
          <button onClick={() => set('moods', (c.moods || []).filter((m, j) => j !== i))} disabled={(c.moods || []).length <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--w-line)', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', flex: '0 0 auto' }}>×</button>
        </div>
      ))}
      {(c.moods || []).length < 6 && (
        <button onClick={() => set('moods', [...(c.moods || []), { emoji: '🙂', label: 'New', color: '#7BB661' }])} style={{ height: 30, borderRadius: 6, border: '1px dashed var(--w-line)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>+ Add mood</button>
      )}
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'sleepTracker') return (
    (<>
  <CtrlGroup label="Sleep goal" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.goalHours || 8} hrs</span>}>
    <input className="range" type="range" min="5" max="10" step="0.5" value={c.goalHours || 8} onChange={e => set('goalHours', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Default bedtime">
    <input className="input" type="time" value={c.bedtime || '23:00'} onChange={e => set('bedtime', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Default wake time">
    <input className="input" type="time" value={c.wakeTime || '07:00'} onChange={e => set('wakeTime', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show sleep debt</span><Toggle on={c.showDebt !== false} onChange={v => set('showDebt', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'stepGoal') return (
    (<>
  <CtrlGroup label="Daily goal" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{(c.goal || 10000).toLocaleString()}</span>}>
    <input className="range" type="range" min="2000" max="25000" step="500" value={c.goal || 10000} onChange={e => set('goal', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Steps today">
    <input className="input" type="number" min="0" value={c.current == null ? 6400 : c.current} onChange={e => set('current', Math.max(0, +e.target.value || 0))} />
  </CtrlGroup>
  <CtrlGroup label="Distance unit">
    <Segmented value={c.unit || 'km'} onChange={v => set('unit', v)} options={[{ v: 'km', l: 'Kilometers' }, { v: 'mi', l: 'Miles' }]} />
  </CtrlGroup>
  <CtrlGroup label="Stride length" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{(c.stride || 0.75).toFixed(2)} m</span>}>
    <input className="range" type="range" min="0.4" max="1" step="0.01" value={c.stride || 0.75} onChange={e => set('stride', +e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'calorieRing') return (
    (<>
  <CtrlGroup label="Daily goal" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.goal} kcal</span>}>
    <input className="range" type="range" min="1200" max="4000" step="50" value={c.goal} onChange={e => set('goal', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Consumed" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.consumed} kcal</span>}>
    <input className="range" type="range" min="0" max="4000" step="50" value={c.consumed} onChange={e => set('consumed', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Macros (grams)">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Carbs</span>
      <input className="input" type="number" min="0" style={{ width: 80 }} value={c.carbs} onChange={e => set('carbs', +e.target.value)} />
    </div>
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Protein</span>
      <input className="input" type="number" min="0" style={{ width: 80 }} value={c.protein} onChange={e => set('protein', +e.target.value)} />
    </div>
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Fat</span>
      <input className="input" type="number" min="0" style={{ width: 80 }} value={c.fat} onChange={e => set('fat', +e.target.value)} />
    </div>
  </CtrlGroup>
</>)
  );
  if (t === 'fastingTimer') return (
    (<>
  <CtrlGroup label="Protocol">
    <Segmented value={c.protocol || '16:8'} onChange={v => set('protocol', v)} options={[{ v: '14:10', l: '14:10' }, { v: '16:8', l: '16:8' }, { v: '18:6', l: '18:6' }, { v: 'OMAD', l: 'OMAD' }]} />
  </CtrlGroup>
  <CtrlGroup label="Fast start time">
    <input className="input" type="time" value={c.fastStart || '20:00'} onChange={e => set('fastStart', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show eating window</span><Toggle on={c.showWindow !== false} onChange={v => set('showWindow', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'bmiCalculator') return (
    (<>
  <CtrlGroup label="Units"><Segmented value={c.units || 'metric'} onChange={v => set('units', v)} options={[{ v: 'metric', l: 'Metric (cm/kg)' }, { v: 'imperial', l: 'Imperial (ft/lb)' }]} /></CtrlGroup>
  <CtrlGroup label="Height" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{Math.round(c.height || 175)} cm</span>}><input className="range" type="range" min="120" max="220" step="1" value={c.height || 175} onChange={e => set('height', +e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Weight" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.weight || 70} kg</span>}><input className="range" type="range" min="30" max="180" step="0.5" value={c.weight || 70} onChange={e => set('weight', +e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show category scale</span><Toggle on={c.showScale !== false} onChange={v => set('showScale', v)} /></div></CtrlGroup>
</>)
  );
  if (t === 'breathingCircle') return (
    (<>
  <CtrlGroup label="Pattern">
    <Segmented value={c.pattern || 'box'} onChange={v => set('pattern', v)} options={[{ v: 'box', l: 'Box' }, { v: '478', l: '4-7-8' }, { v: 'custom', l: 'Custom' }]} />
  </CtrlGroup>
  {(c.pattern || 'box') === 'custom' && (<>
    <CtrlGroup label="Inhale" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.inhale != null ? c.inhale : 4}s</span>}>
      <input className="range" type="range" min="0" max="12" step="1" value={c.inhale != null ? c.inhale : 4} onChange={e => set('inhale', +e.target.value)} />
    </CtrlGroup>
    <CtrlGroup label="Hold after inhale" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.hold != null ? c.hold : 4}s</span>}>
      <input className="range" type="range" min="0" max="12" step="1" value={c.hold != null ? c.hold : 4} onChange={e => set('hold', +e.target.value)} />
    </CtrlGroup>
    <CtrlGroup label="Exhale" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.exhale != null ? c.exhale : 4}s</span>}>
      <input className="range" type="range" min="0" max="12" step="1" value={c.exhale != null ? c.exhale : 4} onChange={e => set('exhale', +e.target.value)} />
    </CtrlGroup>
    <CtrlGroup label="Hold after exhale" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.hold2 != null ? c.hold2 : 0}s</span>}>
      <input className="range" type="range" min="0" max="12" step="1" value={c.hold2 != null ? c.hold2 : 0} onChange={e => set('hold2', +e.target.value)} />
    </CtrlGroup>
  </>)}
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show phase label</span><Toggle on={c.showLabel !== false} onChange={v => set('showLabel', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'workoutStreak') return (
    (<>
  <CtrlGroup label="Rest days allowed" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{typeof c.restDaysAllowed === 'number' ? c.restDaysAllowed : 1}</span>}>
    <input className="range" type="range" min="0" max="3" step="1" value={typeof c.restDaysAllowed === 'number' ? c.restDaysAllowed : 1} onChange={e => set('restDaysAllowed', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Week starts on">
    <Segmented value={c.weekStart || 'Mon'} onChange={v => set('weekStart', v)} options={[{ v: 'Mon', l: 'Monday' }, { v: 'Sun', l: 'Sunday' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show best & total</span><Toggle on={c.showLongest !== false} onChange={v => set('showLongest', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'greetingBanner') return (
    (<>
  <CtrlGroup label="Your name"><input className="input" value={c.name || ''} placeholder="Alex" onChange={e => set('name', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Greeting style"><Segmented value={c.style || 'timeOfDay'} onChange={v => set('style', v)} options={[{ v: 'timeOfDay', l: 'Time of day' }, { v: 'wave', l: 'Casual' }, { v: 'fixed', l: 'Fixed' }]} /></CtrlGroup>
  {(c.style || 'timeOfDay') === 'fixed' ? <CtrlGroup label="Fixed greeting"><input className="input" value={c.fixedGreeting || ''} placeholder="Hello" onChange={e => set('fixedGreeting', e.target.value)} /></CtrlGroup> : null}
  <CtrlGroup label="Tagline (optional)"><input className="input" value={c.tagline || ''} placeholder="Let's make it count" onChange={e => set('tagline', e.target.value)} /></CtrlGroup>
  <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show date</span><Toggle on={c.showDate !== false} onChange={v => set('showDate', v)} /></div></CtrlGroup>
</>)
  );
  if (t === 'affirmation') return (
    (<>
  <CtrlGroup label="Theme">
    <select className="select" value={c.category} onChange={e => set('category', e.target.value)}>
      <option value="self-care">Self-care</option>
      <option value="confidence">Confidence</option>
      <option value="focus">Focus</option>
      <option value="gratitude">Gratitude</option>
      <option value="calm">Calm</option>
    </select>
  </CtrlGroup>
  <CtrlGroup label="Changes every">
    <Segmented value={c.rotation} onChange={v => set('rotation', v)} options={[{ v: 'daily', l: 'Day' }, { v: 'hourly', l: 'Hour' }, { v: 'minute', l: 'Minute' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show theme tag</span><Toggle on={c.showAuthor} onChange={v => set('showAuthor', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'colorPalette') return (
    (<>
  <CtrlGroup label="Title (optional)"><input className="input" value={c.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Brand colors" /></CtrlGroup>
  <CtrlGroup label="Colors">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(Array.isArray(c.colors) && c.colors.length ? c.colors : ['#2A6FDB', '#1F8A5B', '#E0A93B']).map((col, i) => (
        <div key={i} className="field-row" style={{ gap: 8 }}>
          <input type="color" value={col} onChange={e => { const arr = (c.colors || []).slice(); arr[i] = e.target.value; set('colors', arr); }} style={{ width: 34, height: 30, padding: 0, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', flex: 'none' }} />
          <input className="input" value={col} onChange={e => { const arr = (c.colors || []).slice(); arr[i] = e.target.value; set('colors', arr); }} style={{ flex: 1 }} />
          <button className="btn" style={{ flex: 'none', padding: '0 10px' }} onClick={() => { const arr = (c.colors || []).slice(); arr.splice(i, 1); set('colors', arr); }} disabled={(c.colors || []).length <= 1}>×</button>
        </div>
      ))}
      {(c.colors || []).length < 6 ? (
        <button className="btn" onClick={() => { const arr = (c.colors || ['#2A6FDB', '#1F8A5B', '#E0A93B']).slice(); arr.push('#6B7280'); set('colors', arr); }}>+ Add color</button>
      ) : null}
    </div>
  </CtrlGroup>
  <CtrlGroup label="Layout"><Segmented value={c.layout || 'row'} onChange={v => set('layout', v)} options={[{ v: 'row', l: 'Swatches' }, { v: 'list', l: 'List' }]} /></CtrlGroup>
  <CtrlGroup label="Value format"><Segmented value={c.format || 'hex'} onChange={v => set('format', v)} options={[{ v: 'hex', l: 'HEX' }, { v: 'rgb', l: 'RGB' }, { v: 'hsl', l: 'HSL' }]} /></CtrlGroup>
  <CtrlGroup label="Interaction"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Click to copy</span><Toggle on={c.copyable !== false} onChange={v => set('copyable', v)} /></div></CtrlGroup>
</>)
  );
  if (t === 'contentCalendar') return (
    (<>
  <CtrlGroup label="Week starts on"><Segmented value={c.weekStart || 'Mon'} onChange={v => set('weekStart', v)} options={[{ v: 'Mon', l: 'Monday' }, { v: 'Sun', l: 'Sunday' }]} /></CtrlGroup>
  <CtrlGroup label="Posts" hint="One per line: date | title | platform | status">
    <textarea
      className="input"
      rows={6}
      style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
      placeholder={'2026-06-05 | Summer reel | instagram | published\n2026-06-12 | Tutorial drop | youtube | planned'}
      value={(Array.isArray(c.entries) ? c.entries : []).map(e => [e.date, e.title, e.platform, e.status].filter(Boolean).join(' | ')).join('\n')}
      onChange={e => {
        const rows = e.target.value.split('\n').map(line => {
          const parts = line.split('|').map(p => p.trim());
          if (!parts[0]) return null;
          return { date: parts[0], title: parts[1] || '', platform: (parts[2] || '').toLowerCase(), status: (parts[3] || '').toLowerCase() === 'published' ? 'published' : 'planned' };
        }).filter(Boolean);
        set('entries', rows);
      }}
    />
  </CtrlGroup>
  <CtrlGroup label="Platform colors" hint="One per line: platform = #hex">
    <textarea
      className="input"
      rows={3}
      style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
      placeholder={'instagram = #E1306C\nyoutube = #FF0000'}
      value={Object.entries(c.platformColors || {}).map(([k, v]) => k + ' = ' + v).join('\n')}
      onChange={e => {
        const map = {};
        e.target.value.split('\n').forEach(line => {
          const [k, v] = line.split('=').map(p => p.trim());
          if (k && v) map[k.toLowerCase()] = v;
        });
        set('platformColors', map);
      }}
    />
  </CtrlGroup>
</>)
  );
  if (t === 'postingStreak') return (
    (<>
  <CtrlGroup label="Day reset hour" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{String(typeof c.resetHour === 'number' ? c.resetHour : 4).padStart(2, '0')}:00</span>}>
    <input className="range" type="range" min="0" max="12" step="1" value={typeof c.resetHour === 'number' ? c.resetHour : 4} onChange={e => set('resetHour', +e.target.value)} />
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Posts before this hour count toward the previous day.</div>
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show longest streak</span><Toggle on={c.showLongest !== false} onChange={v => set('showLongest', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Seed post dates">
    <input className="input" placeholder="2026-06-01, 2026-06-02" value={Array.isArray(c.postDates) ? c.postDates.join(', ') : ''} onChange={e => set('postDates', e.target.value.split(',').map(x => x.trim()).filter(Boolean))} />
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Comma-separated YYYY-MM-DD. Marking today is saved locally.</div>
  </CtrlGroup>
</>)
  );
  if (t === 'photoFrame') return (
    (<>
  <CtrlGroup label="Image links" right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>one per line</span>}>
    <textarea
      className="input"
      rows={4}
      placeholder={"https://...jpg\nhttps://...png"}
      style={{ resize: 'vertical', minHeight: 72, lineHeight: 1.4, fontFamily: 'inherit' }}
      value={Array.isArray(c.images) ? c.images.join('\n') : (c.images || '')}
      onChange={e => set('images', e.target.value.split(/\n+/).map(x => x.trim()).filter(Boolean))}
    />
  </CtrlGroup>
  <CtrlGroup label="Frame">
    <Segmented value={c.frame || 'polaroid'} onChange={v => set('frame', v)} options={[{ v: 'polaroid', l: 'Polaroid' }, { v: 'classic', l: 'Classic' }, { v: 'rounded', l: 'Rounded' }, { v: 'none', l: 'None' }]} />
  </CtrlGroup>
  <CtrlGroup label="Slideshow speed" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.interval || 6}s</span>}>
    <input className="range" type="range" min="2" max="20" step="1" value={c.interval || 6} onChange={e => set('interval', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Caption (optional)">
    <input className="input" placeholder="e.g. Summer 2025" value={c.caption || ''} onChange={e => set('caption', e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'quoteCard') return (
    (<>
  <CtrlGroup label="Category">
    <Segmented value={c.category} onChange={v => set('category', v)} options={[{ v: 'motivation', l: 'Motivation' }, { v: 'calm', l: 'Calm' }, { v: 'wisdom', l: 'Wisdom' }, { v: 'creativity', l: 'Creativity' }]} />
  </CtrlGroup>
  <CtrlGroup label="Rotation">
    <Segmented value={c.rotation} onChange={v => set('rotation', v)} options={[{ v: 'hourly', l: 'Hourly' }, { v: 'daily', l: 'Daily' }, { v: 'weekly', l: 'Weekly' }, { v: 'shuffle', l: 'Shuffle' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show author</span><Toggle on={c.showAuthor !== false} onChange={v => set('showAuthor', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'diceRoller') return (
    (<>
  <CtrlGroup label="Dice" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.count || 2}</span>}>
    <input className="range" type="range" min="1" max="6" step="1" value={c.count || 2} onChange={e => set('count', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Sides">
    <Segmented value={c.sides || 6} onChange={v => set('sides', +v)} options={[{ v: 4, l: 'd4' }, { v: 6, l: 'd6' }, { v: 8, l: 'd8' }, { v: 12, l: 'd12' }, { v: 20, l: 'd20' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show total</span><Toggle on={c.showTotal !== false} onChange={v => set('showTotal', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'magic8Ball') return (
    (<>
  <CtrlGroup label="Ball color">
    <input className="input" type="text" value={c.ballColor || '#18181a'} onChange={e => set('ballColor', e.target.value)} placeholder="#18181a" />
  </CtrlGroup>
  <CtrlGroup label="Answers (one per line)">
    <textarea
      className="input"
      style={{ minHeight: 120, resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
      value={(Array.isArray(c.answers) ? c.answers : []).join('\n')}
      onChange={e => set('answers', e.target.value.split('\n').map(x => x.replace(/^\s+|\s+$/g, '')))}
      placeholder={'Yes\nNo\nAsk again later'}
    />
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>The ball picks one at random each shake.</div>
  </CtrlGroup>
</>)
  );
  if (t === 'asciiBanner') return (
    (<>
  <CtrlGroup label="Text">
    <input className="input" value={c.text} maxLength={48} placeholder="HELLO" onChange={e => set('text', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Weight">
    <Segmented value={c.font} onChange={v => set('font', v)} options={[{ v: 'standard', l: 'Thin' }, { v: 'block', l: 'Block' }]} />
  </CtrlGroup>
  <CtrlGroup label="Align">
    <Segmented value={c.align} onChange={v => set('align', v)} options={[{ v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' }]} />
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show caption</span><Toggle on={c.showText} onChange={v => set('showText', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Label (optional)">
    <input className="input" value={c.label} placeholder="e.g. STATUS" onChange={e => set('label', e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'metronome') return (
    (<>
  <CtrlGroup label="Tempo" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.bpm || 120} BPM</span>}>
    <input className="range" type="range" min="30" max="240" step="1" value={c.bpm || 120} onChange={e => set('bpm', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Time signature">
    <Segmented value={c.timeSignature || '4/4'} onChange={v => set('timeSignature', v)} options={[{ v: '2/4', l: '2/4' }, { v: '3/4', l: '3/4' }, { v: '4/4', l: '4/4' }, { v: '6/8', l: '6/8' }]} />
  </CtrlGroup>
  <CtrlGroup label="Sound">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Click on each beat</span><Toggle on={c.sound !== false} onChange={v => set('sound', v)} /></div>
  </CtrlGroup>
</>)
  );
  if (t === 'gradientMesh') return (
    (<>
  <CtrlGroup label="Colors">
    {(c.colors && c.colors.length ? c.colors : ['#C2417B', '#2A6FDB', '#1F8A5B']).map((col, i) => (
      <div key={i} className="field-row" style={{ marginBottom: 6 }}>
        <input type="color" value={col} onChange={e => { const next = (c.colors ? c.colors.slice() : ['#C2417B', '#2A6FDB', '#1F8A5B']); next[i] = e.target.value; set('colors', next); }} style={{ width: 34, height: 26, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
        <input className="input" value={col} onChange={e => { const next = (c.colors ? c.colors.slice() : ['#C2417B', '#2A6FDB', '#1F8A5B']); next[i] = e.target.value; set('colors', next); }} style={{ flex: 1 }} />
        {(c.colors ? c.colors.length : 3) > 2 ? <button onClick={() => { const next = (c.colors ? c.colors.slice() : ['#C2417B', '#2A6FDB', '#1F8A5B']); next.splice(i, 1); set('colors', next); }} style={{ marginLeft: 6, color: 'var(--text-3)', fontSize: 16, lineHeight: 1, background: 'none' }}>×</button> : null}
      </div>
    ))}
    {(c.colors ? c.colors.length : 3) < 6 ? <button onClick={() => { const next = (c.colors ? c.colors.slice() : ['#C2417B', '#2A6FDB', '#1F8A5B']); next.push('#7A4FD6'); set('colors', next); }} style={{ fontSize: 12.5, color: 'var(--text-2)', background: 'none', marginTop: 2 }}>+ Add color</button> : null}
  </CtrlGroup>
  <CtrlGroup label="Flow speed" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.speed === 0 ? 'paused' : (c.speed || 1) + '×'}</span>}>
    <input className="range" type="range" min="0" max="3" step="0.25" value={typeof c.speed === 'number' ? c.speed : 1} onChange={e => set('speed', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Texture">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Film grain</span><Toggle on={c.grain !== false} onChange={v => set('grain', v)} /></div>
    <div className="field-row" style={{ marginTop: 6 }}><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Color dots</span><Toggle on={c.dots !== false} onChange={v => set('dots', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Title (optional)"><input className="input" value={c.label || ''} onChange={e => set('label', e.target.value)} placeholder="e.g. Good morning" /></CtrlGroup>
  <CtrlGroup label="Subtitle (optional)"><input className="input" value={c.sublabel || ''} onChange={e => set('sublabel', e.target.value)} /></CtrlGroup>
</>)
  );
  if (t === 'starfield') return (
    (<>
  <CtrlGroup label="Density" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.particles || 120}</span>}>
    <input className="range" type="range" min="20" max="400" step="10" value={c.particles || 120} onChange={e => set('particles', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Drift speed" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{(typeof c.speed === 'number' ? c.speed : 0.5).toFixed(1)}x</span>}>
    <input className="range" type="range" min="0" max="2" step="0.1" value={typeof c.speed === 'number' ? c.speed : 0.5} onChange={e => set('speed', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Star color">
    <input className="input" type="color" value={c.starColor || '#ffffff'} onChange={e => set('starColor', e.target.value)} style={{ height: 38, padding: 4 }} />
  </CtrlGroup>
  <CtrlGroup label="Effects">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Twinkle</span><Toggle on={c.twinkle !== false} onChange={v => set('twinkle', v)} /></div>
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Shooting stars</span><Toggle on={c.shooting !== false} onChange={v => set('shooting', v)} /></div>
  </CtrlGroup>
  <CtrlGroup label="Label (optional)">
    <input className="input" value={c.label || ''} onChange={e => set('label', e.target.value)} placeholder="e.g. Stay curious" />
  </CtrlGroup>
</>)
  );
  if (t === 'lavaLamp') return (
    (<>
  <CtrlGroup label="Blob color">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Rising goo</span>
      <input className="input" type="color" style={{ width: 44, height: 30, padding: 2 }} value={c.blobColor || '#E0563B'} onChange={e => set('blobColor', e.target.value)} />
    </div>
  </CtrlGroup>
  <CtrlGroup label="Liquid color">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Background fluid</span>
      <input className="input" type="color" style={{ width: 44, height: 30, padding: 2 }} value={c.liquidColor || '#3a1a55'} onChange={e => set('liquidColor', e.target.value)} />
    </div>
  </CtrlGroup>
  <CtrlGroup label="Blob count" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.blobCount || 6}</span>}>
    <input className="range" type="range" min="2" max="10" step="1" value={c.blobCount || 6} onChange={e => set('blobCount', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Speed" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{(c.speed || 1).toFixed(1)}x</span>}>
    <input className="range" type="range" min="0.3" max="2.5" step="0.1" value={c.speed || 1} onChange={e => set('speed', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Label (optional)">
    <input className="input" value={c.label || ''} onChange={e => set('label', e.target.value)} />
  </CtrlGroup>
</>)
  );
  if (t === 'imageGallery') return (
    (<>
  <CtrlGroup label="Layout">
    <Segmented value={c.layout || 'carousel'} onChange={v => set('layout', v)} options={[{ v: 'carousel', l: 'Carousel' }, { v: 'slideshow', l: 'Slideshow' }, { v: 'grid', l: 'Grid' }]} />
  </CtrlGroup>
  <CtrlGroup label="Images">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(Array.isArray(c.images) ? c.images : []).map((it, i) => {
        const item = typeof it === 'string' ? { url: it, caption: '' } : (it || { url: '', caption: '' });
        const update = (patch) => { const next = (Array.isArray(c.images) ? c.images : []).map((x, j) => { const cur = typeof x === 'string' ? { url: x, caption: '' } : (x || { url: '', caption: '' }); return j === i ? { ...cur, ...patch } : cur; }); set('images', next); };
        const remove = () => set('images', (Array.isArray(c.images) ? c.images : []).filter((_, j) => j !== i));
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, border: '1px solid var(--line, rgba(0,0,0,0.1))', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', minWidth: 16 }}>{i + 1}</span>
              <input className="input" placeholder="https://image-url.jpg" value={item.url} onChange={e => update({ url: e.target.value })} style={{ flex: 1 }} />
              <button onClick={remove} aria-label="Remove" style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-3)', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
            {c.captions ? <input className="input" placeholder="Caption (optional)" value={item.caption} onChange={e => update({ caption: e.target.value })} /> : null}
          </div>
        );
      })}
      <button onClick={() => set('images', [...(Array.isArray(c.images) ? c.images : []), { url: '', caption: '' }])} style={{ height: 32, borderRadius: 8, border: '1px dashed var(--line, rgba(0,0,0,0.18))', background: 'transparent', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>+ Add image</button>
    </div>
  </CtrlGroup>
  <CtrlGroup label="Captions">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show captions</span><Toggle on={c.captions} onChange={v => set('captions', v)} /></div>
  </CtrlGroup>
  {(c.layout || 'carousel') !== 'grid' ? <>
    <CtrlGroup label="Autoplay">
      <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Auto-advance</span><Toggle on={c.autoplay !== false} onChange={v => set('autoplay', v)} /></div>
    </CtrlGroup>
    {c.autoplay !== false ? <CtrlGroup label="Speed" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.speed || 4}s</span>}>
      <input className="range" type="range" min="2" max="12" step="1" value={c.speed || 4} onChange={e => set('speed', +e.target.value)} />
    </CtrlGroup> : null}
  </> : null}
</>)
  );
  if (t === 'visitedMap') return (
    (<>
  <CtrlGroup label="Map color">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Highlight</span>
      <input className="input" type="color" style={{ width: 44, height: 30, padding: 2 }} value={c.highlight || '#1F8A5B'} onChange={e => set('highlight', e.target.value)} />
    </div>
  </CtrlGroup>
  <CtrlGroup label="Stats">
    <div className="field-row">
      <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show count & progress</span>
      <Toggle on={c.showCount !== false} onChange={v => set('showCount', v)} />
    </div>
  </CtrlGroup>
  <CtrlGroup label="Tip">
    <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>Click countries on the map to mark them as visited. Your selections are saved on this device.</span>
  </CtrlGroup>
</>)
  );
  if (t === 'ambientPlayer') return (
    (<>
  <CtrlGroup label="Title (optional)">
    <input className="input" value={c.title || ''} placeholder="Ambient" onChange={e => set('title', e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Theme">
    <Segmented value={c.theme || 'warm'} onChange={v => set('theme', v)} options={[{ v: 'warm', l: 'Warm' }, { v: 'cool', l: 'Cool' }, { v: 'forest', l: 'Forest' }, { v: 'night', l: 'Night' }]} />
  </CtrlGroup>
  <CtrlGroup label="Default volume" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{Math.round((typeof c.volume === 'number' ? c.volume : 0.6) * 100)}%</span>}>
    <input className="range" type="range" min="0" max="1" step="0.05" value={typeof c.volume === 'number' ? c.volume : 0.6} onChange={e => set('volume', +e.target.value)} />
  </CtrlGroup>
  <CtrlGroup label="Default sounds">
    {[{ id: 'cafe', l: 'Café' }, { id: 'rain', l: 'Rain' }, { id: 'city', l: 'City' }, { id: 'waves', l: 'Waves' }, { id: 'fire', l: 'Fire' }, { id: 'wind', l: 'Wind' }].map(o => {
      const mix = Array.isArray(c.mix) ? c.mix : ['cafe', 'rain'];
      const on = mix.includes(o.id);
      return (
        <div key={o.id} className="field-row">
          <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{o.l}</span>
          <Toggle on={on} onChange={v => set('mix', v ? [...mix, o.id] : mix.filter(x => x !== o.id))} />
        </div>
      );
    })}
  </CtrlGroup>
</>)
  );
  if (t === 'calculator') return (
    (<>
  <CtrlGroup label="Mode"><Segmented value={c.mode} onChange={v => set('mode', v)} options={[{ v: 'basic', l: 'Basic' }, { v: 'percent', l: 'Percent' }, { v: 'tip', l: 'Tip' }]} /></CtrlGroup>
  <CtrlGroup label="Decimal precision" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.precision} dp</span>}><input className="range" type="range" min="0" max="4" step="1" value={c.precision} onChange={e => set('precision', +e.target.value)} /></CtrlGroup>
  {c.mode === 'tip' ? <CtrlGroup label="Currency symbol"><input className="input" value={c.currency} onChange={e => set('currency', e.target.value)} /></CtrlGroup> : null}
  {c.mode === 'tip' ? <CtrlGroup label="Default tip" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.defaultTip}%</span>}><input className="range" type="range" min="0" max="30" step="1" value={c.defaultTip} onChange={e => set('defaultTip', +e.target.value)} /></CtrlGroup> : null}
</>)
  );
  if (t === 'unitConverter') return (
    (<>
  <CtrlGroup label="Category">
    <Segmented value={c.category || 'length'} onChange={v => set('category', v)} options={[{ v: 'length', l: 'Length' }, { v: 'weight', l: 'Weight' }, { v: 'temp', l: 'Temp' }, { v: 'volume', l: 'Volume' }, { v: 'data', l: 'Data' }]} />
  </CtrlGroup>
  <CtrlGroup label="Starting amount">
    <input className="input" type="text" inputMode="decimal" value={c.amount ?? 1} onChange={e => { const v = e.target.value; if (/^-?\d*\.?\d*$/.test(v)) set('amount', v === '' ? '' : (isNaN(+v) ? v : +v)); }} />
  </CtrlGroup>
  <CtrlGroup label="Default from / to">
    <div style={{ display: 'flex', gap: 8 }}>
      <input className="input" value={c.from || ''} placeholder="e.g. km" onChange={e => set('from', e.target.value.trim())} />
      <input className="input" value={c.to || ''} placeholder="e.g. mi" onChange={e => set('to', e.target.value.trim())} />
    </div>
  </CtrlGroup>
  <CtrlGroup label="Display">
    <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show category tabs</span><Toggle on={c.showCategories !== false} onChange={v => set('showCategories', v)} /></div>
  </CtrlGroup>
</>)
  );
  return null;
}

/* ============================================================
   PACKS
   ============================================================ */

function PackCard({ pack, onOpen }) {
  return (
    <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.22s var(--ease), box-shadow 0.22s var(--ease)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      onClick={() => onOpen(pack)}>
      {/* header band tinted with pack accent */}
      <div style={{ padding: '20px 22px', background: `color-mix(in srgb, ${pack.accent} 8%, var(--surface))`, borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="eyebrow" style={{ color: pack.accent }}>{pack.kicker}</div>
        </div>
        <h3 className="serif" style={{ fontSize: 26, marginTop: 8 }}>{pack.name}</h3>
        {/* icon cluster */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {pack.icons.slice(0, 6).map((k, i) => (
            <div key={k} style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <Icon name={k} color={pack.accent} variant={i % 2 ? 'filled' : 'outline'} size={22} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '18px 22px 20px' }}>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.5, marginBottom: 16, textWrap: 'pretty' }}>{pack.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pack.widgets.map(wid => { const w = WIDGETS.find(x => x.id === wid); return <span key={wid} className="tag" style={{ background: 'var(--surface-2)' }}>{w?.name}</span>; })}
          </div>
          <span style={{ color: pack.accent, fontWeight: 600, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>Open
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}

function Setups({ onOpenPack }) {
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="fadein">
        <div className="eyebrow">Curated setups</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginTop: 10, marginBottom: 10 }}>Packs to start a page in one sitting</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 560 }}>Each pack pairs a color, a set of icons, and matching widgets. Open one to copy ready-made, pre-themed embed links and icon URLs — or fine-tune any in the Studio.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 18, marginTop: 32 }}>
        {PACKS.map(p => <PackCard key={p.id} pack={p} onOpen={onOpenPack} />)}
      </div>
    </div>
  );
}

function PackIconButton({ name, accent }) {
  const [copied, copy] = useCopy();
  const url = `${SITE_ORIGIN}/i/${name}?c=${accent.replace('#', '')}&s=outline`;
  return (
    <button onClick={() => copy(url)} title="Copy icon image URL"
      style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
      {copied
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
        : <Icon name={name} color={accent} variant="outline" size={24} />}
    </button>
  );
}

function PackModal({ pack, onClose, onUseWidget }) {
  const [wi, setWi] = useState(0);
  const [copied, copy] = useCopy();
  const w = WIDGETS.find(x => x.id === pack.widgets[wi]);
  const url = buildEmbedUrl(w.id, { ...(w.config || {}), theme: 'light', accent: pack.accent.replace('#', ''), font: 'sans', size: 'm' });
  return (
    <Modal onClose={onClose}>
      <div style={{ marginBottom: 6 }}>
        <div className="eyebrow" style={{ color: pack.accent }}>{pack.kicker}</div>
      </div>
      <h2 className="serif" style={{ fontSize: 27, marginBottom: 8 }}>{pack.name}</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.5, marginBottom: 16 }}>{pack.desc}</p>

      {/* live preview of the selected widget, themed with the pack accent */}
      <div style={{ height: 188, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 10 }}>
        <Widget type={w.type} config={w.config || {}} accent={pack.accent} fontStack="'Hanken Grotesk', sans-serif" sizeScale={0.92} theme="light" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {pack.widgets.map((wid, i) => { const x = WIDGETS.find(y => y.id === wid); return <button key={wid} className={'chip' + (i === wi ? ' active' : '')} onClick={() => setWi(i)}>{x?.name}</button>; })}
      </div>

      {/* per-widget actions: copy the ready-to-paste embed link or fine-tune it */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className={'btn btn-primary' + (copied ? ' copied' : '')} style={{ flex: 1, background: pack.accent, color: onColor(pack.accent) }} onClick={() => copy(url)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
          {copied ? 'Copied embed link' : `Copy ${w.name} link`}
        </button>
        <button className="btn btn-ghost" onClick={() => onUseWidget(w, pack.accent)}>Customize</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', margin: '8px 2px 20px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        In Notion, type <span className="mono" style={{ color: 'var(--text-2)' }}>/embed</span> and paste the link.
      </div>

      {/* matching icons — copy any as a page-icon image URL */}
      <div className="eyebrow" style={{ marginBottom: 10 }}>Matching icons · click to copy image URL</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {pack.icons.map(k => <PackIconButton key={k} name={k} accent={pack.accent} />)}
      </div>

      <button className="btn btn-ghost btn-lg" style={{ width: '100%' }} onClick={onClose}>Close</button>
    </Modal>
  );
}


/* ============================================================
   HOME / specimen catalogue title page
   ============================================================ */

const INK_SWATCHES = ['#E8431C', '#1B1813', '#2A5BD7', '#1F7A4D', '#6D4FD6', '#C2417B'];

function PlateHead({ no, kicker, title, desc, action }) {
  return (
    <div className="section-head">
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 'clamp(34px,4vw,54px)', color: 'var(--accent)', lineHeight: 0.86, transition: 'color 0.4s var(--ease)', flex: 'none' }}>{no}</div>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{kicker}</div>
          <h2 className="section-title" style={{ marginTop: 10 }}>{title}</h2>
          {desc && <p className="section-desc">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Home({ go, onOpen }) {
  const [ink, setInk] = useState('#E8431C');
  const [iconAccent, setIconAccent] = useState('#E8431C');
  const featured = WIDGETS.filter(w => ['clock', 'pomodoro', 'countdown'].includes(w.id));
  const stripIcons = ['rocket', 'target', 'book', 'flame', 'calendar', 'heart', 'bolt', 'leaf', 'star', 'coffee', 'compass', 'gem'];

  // recolor the ENTIRE page's signature ink, live
  const setPageInk = (c) => {
    setInk(c);
    document.documentElement.style.setProperty('--accent', c);
  };
  useEffect(() => () => { document.documentElement.style.removeProperty('--accent'); }, []);

  const tickerItems = ['Seven live widgets', 'Thirty-six recolorable icons', 'Six icon styles', 'One embed link', 'No account · No setup', 'Tune it live', 'Paste it in'];

  return (
    <div>
      {/* ============ MASTHEAD ============ */}
      <div className="wrap" style={{ paddingTop: 28 }}>
        <div className="fadein" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border-strong)' }}>
          <span className="plate-no">№ 00 — Title Plate</span>
          <span className="mono only-desktop" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Widgets &amp; Icons for Notion</span>
        </div>

        <div className="hero" style={{ textAlign: 'center', paddingBottom: 30 }}>
          <h1 className="serif fadein" style={{ fontSize: 'clamp(54px, 10.5vw, 150px)', lineHeight: 0.92, letterSpacing: '-0.02em', margin: '0 auto', maxWidth: 1100 }}>
            Make your pages feel <em>unmistakably</em> yours.
          </h1>

          <div className="fadein mono" style={{ marginTop: 26, fontSize: 12.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>7 Widgets</span><span style={{ color: 'var(--accent)', transition: 'color 0.4s var(--ease)' }}>·</span>
            <span style={{ whiteSpace: 'nowrap' }}>36 Icons</span><span style={{ color: 'var(--accent)', transition: 'color 0.4s var(--ease)' }}>·</span>
            <span style={{ whiteSpace: 'nowrap' }}>6 Styles</span><span style={{ color: 'var(--accent)', transition: 'color 0.4s var(--ease)' }}>·</span>
            <span style={{ whiteSpace: 'nowrap' }}>No account</span>
          </div>

          <p className="hero-sub fadein" style={{ fontSize: 'clamp(16px,1.7vw,19px)', color: 'var(--text-2)', maxWidth: 560, margin: '24px auto 0', lineHeight: 1.55, textWrap: 'pretty' }}>
            A best-in-class library of customizable widgets and icons for Notion. Tune them live, copy one link, paste it in.
          </p>

          {/* SET THE INK — recolors the whole page, live */}
          <div className="fadein" style={{ marginTop: 30, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span className="field-label" style={{ whiteSpace: 'nowrap' }}>Set the ink</span>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 9, border: '1px solid var(--border-strong)', borderRadius: 99, background: 'var(--surface)' }}>
              {INK_SWATCHES.map(c => (
                <button key={c} aria-label={c}
                  onClick={() => setPageInk(c)}
                  style={{ width: 30, height: 30, borderRadius: 99, background: c, border: 'none', cursor: 'pointer', position: 'relative', transition: 'transform 0.16s var(--ease)', boxShadow: ink === c ? '0 0 0 2px var(--surface), 0 0 0 4px var(--text)' : 'none', transform: ink === c ? 'scale(1.08)' : 'none' }} />
              ))}
            </div>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Watch the whole page follow</span>
          </div>

          <div className="hero-cta fadein" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            <button className="btn btn-accent btn-lg" onClick={() => go('widgets')}>Browse widgets
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => go('icons')}>Browse icons</button>
          </div>
        </div>
      </div>

      {/* ============ TICKER ============ */}
      <div className="ticker">
        <div className="ticker-track">
          {[0, 1].map(dup => (
            <div className="ticker-item" key={dup}>
              {tickerItems.map((t, i) => <span key={i}>{t}</span>)}
            </div>
          ))}
        </div>
      </div>

      {/* ============ LIVE EMBED PLATE ============ */}
      <div className="wrap" style={{ paddingTop: 52, paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
          <span className="plate-no">Plate I — Live Embed</span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Recolors with the ink ↑</span>
        </div>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <div className="crop" style={{ height: 432 }}>
            <DocsCanvas docTheme="light" accent={ink} emoji="home">
              <EmbedBlock showCaption height={228}>
                <Widget type="clock" config={{ tz: 'America/New_York', format: '12', seconds: true, showDate: true, label: 'New York' }} accent={ink} fontStack="'Hanken Grotesk', sans-serif" sizeScale={1} theme="light" />
              </EmbedBlock>
            </DocsCanvas>
          </div>
        </div>
      </div>

      {/* ============ № 01 — WIDGETS ============ */}
      <div className="wrap section">
        <PlateHead no="№ 01" kicker="Widgets" title="Live, not screenshots"
          desc="Each one ticks, counts and updates right here. Open any to customize and copy."
          action={<button className="btn btn-ghost" onClick={() => go('widgets')}>See all 7</button>} />
        <div className="wgrid">{featured.map(w => <WidgetCard key={w.id} widget={w} onOpen={onOpen} />)}</div>
      </div>

      {/* ============ № 02 — ICONS (recolor band) ============ */}
      <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-strong)', borderBottom: '1px solid var(--border-strong)' }}>
        <div className="wrap section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
              <div className="serif" style={{ fontSize: 'clamp(34px,4vw,54px)', color: 'var(--accent)', lineHeight: 0.86, transition: 'color 0.4s var(--ease)', flex: 'none' }}>№ 02</div>
              <div>
                <div className="eyebrow">Icons</div>
                <h2 className="section-title" style={{ marginTop: 10 }}>One color recolors them all</h2>
                <p className="section-desc" style={{ marginBottom: 22 }}>Set a hex, pick a style, copy the image URL into any page icon. Pixel-clean at every size.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
                  {['#E8431C', '#1B1813', '#2A5BD7', '#1F7A4D', '#6D4FD6', '#C2417B'].map(c => (
                    <button key={c} className={'swatch' + (iconAccent === c ? ' on' : '')} style={{ background: c, borderRadius: 99, width: 30, height: 30 }} onClick={() => setIconAccent(c)} aria-label={c} />
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => go('icons')}>Open icon gallery
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {stripIcons.map((k, i) => (
              <div key={k} style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', transition: 'transform 0.2s var(--ease)' }}>
                <Icon name={k} color={iconAccent} variant={i % 4 === 3 ? 'duotone' : i % 4 === 1 ? 'filled' : 'outline'} size={34} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ № 03 — PACKS ============ */}
      <div className="wrap section">
        <PlateHead no="№ 03" kicker="Curated setups" title="Matching icons + widgets, bundled"
          desc="Opinionated packs to set up a page in one sitting."
          action={<button className="btn btn-ghost" onClick={() => go('packs')}>All packs</button>} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {PACKS.slice(0, 2).map(p => <PackCard key={p.id} pack={p} onOpen={() => go('packs')} />)}
        </div>
      </div>

      {/* ============ COLOPHON CTA ============ */}
      <div className="wrap" style={{ paddingBottom: 70 }}>
        <div style={{ background: 'var(--ink)', color: 'var(--on-ink)', borderRadius: 'var(--r-lg)', padding: '60px 44px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 20 }}>Colophon</div>
          <h2 className="serif" style={{ fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.98, marginBottom: 18 }}>Your page, in your palette.</h2>
          <p style={{ opacity: 0.66, maxWidth: 470, margin: '0 auto 30px', fontSize: 16.5, lineHeight: 1.55 }}>The whole library is free — every widget, every icon, every style. No account, no catch.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-lg" style={{ background: 'var(--accent)', color: 'var(--on-accent)', transition: 'background 0.4s var(--ease)' }} onClick={() => go('widgets')}>Start building</button>
            <button className="btn btn-lg" style={{ background: 'transparent', color: 'var(--on-ink)', border: '1px solid rgba(245,240,225,0.28)' }} onClick={() => go('icons')}>Browse icons</button>
          </div>
        </div>
      </div>

      <Footer go={go} />
    </div>
  );
}

function Footer({ go }) {
  return (
    <footer style={{ borderTop: '1px solid var(--border-strong)', padding: '30px 0', background: 'var(--bg)' }}>
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <BrandMark size={24} />
          <span style={{ fontWeight: 600 }}>Notion Crafts</span>
          <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11, letterSpacing: '0.04em' }}>· Independent add-on · Not affiliated with Notion Labs</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 6 }}>
          {[['widgets', 'Widgets'], ['icons', 'Icons'], ['packs', 'Packs']].map(([p, l]) => (
            <a key={p} className="nav-link" onClick={() => go(p)} style={{ cursor: 'pointer' }}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   APP SHELL — routing, theme, favorites, modals
   ============================================================ */

function NavLink({ active, onClick, children }) {
  return <button className={'nav-link' + (active ? ' active' : '')} onClick={onClick}>{children}</button>;
}

function App() {
  const [theme, setTheme] = useLocalStorage('nc-theme', 'light');
  const [favorites, setFavorites] = useLocalStorage('nc-favs', []);
  const [page, setPage] = useState('home');
  const [widget, setWidget] = useState(WIDGETS[0]);
  const [seedAccent, setSeedAccent] = useState(null);
  const [studioKey, setStudioKey] = useState(0);
  const [packModal, setPackModal] = useState(null);
  const [toast, setToast] = useState(null);
  const tref = useRef();

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const showToast = (msg) => { setToast(msg); clearTimeout(tref.current); tref.current = setTimeout(() => setToast(null), 2200); };

  const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const openStudio = (w, accent) => {
    setWidget(w); setSeedAccent(accent || null); setStudioKey(k => k + 1); setPage('studio');
    window.scrollTo({ top: 0 });
  };

  const toggleFav = (id) => {
    setFavorites(f => {
      const has = f.includes(id);
      showToast(has ? 'Removed from favorites' : 'Saved to favorites');
      return has ? f.filter(x => x !== id) : [...f, id];
    });
  };

  const navItems = [['widgets', 'Widgets'], ['icons', 'Icons'], ['packs', 'Packs']];

  return (
    <div className="app">
      {/* TOP NAV */}
      <nav className="topnav">
        {page === 'studio'
          ? <button className="btn btn-subtle btn-sm" onClick={() => go('widgets')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Library
            </button>
          : <button className="brand" onClick={() => go('home')}><BrandMark /> Notion Crafts</button>}

        {page === 'studio' && <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Studio<span style={{ color: 'var(--text-2)', fontWeight: 600 }}> · {widget.name}</span></div>}

        <div className="nav-links" style={{ marginLeft: 8 }}>
          {page !== 'studio' && navItems.map(([p, l]) => <NavLink key={p} active={page === p} onClick={() => go(p)}>{l}</NavLink>)}
        </div>

        <div className="nav-spacer" />

        <button className="btn btn-icon btn-subtle" onClick={() => go('favorites')} title="Favorites" style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.length ? 'var(--accent)' : 'none'} stroke={favorites.length ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.3C12 20.3 3.8 14.7 3.8 9.2A4.4 4.4 0 0 1 12 6.8A4.4 4.4 0 0 1 20.2 9.2C20.2 14.7 12 20.3 12 20.3Z" /></svg>
          {favorites.length > 0 && <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: 'var(--ink)', color: 'var(--on-ink)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{favorites.length}</span>}
        </button>

        <ThemeToggle theme={theme} setTheme={setTheme} />
      </nav>

      {/* PAGES */}
      <div className="page">
        {page === 'home' && <Home go={go} onOpen={openStudio} />}
        {page === 'widgets' && <WidgetGallery onOpen={openStudio} />}
        {page === 'icons' && <IconGallery />}
        {page === 'packs' && <Setups onOpenPack={setPackModal} />}
        {page === 'favorites' && <Favorites favorites={favorites} onOpen={openStudio} go={go} />}
        {page === 'studio' && <Configurator key={studioKey} widget={widget} setWidget={setWidget} favorites={favorites} toggleFav={toggleFav} seedAccent={seedAccent} />}
      </div>

      {/* OVERLAYS */}
      {packModal && <PackModal pack={packModal} onClose={() => setPackModal(null)} onUseWidget={(w, accent) => { setPackModal(null); openStudio(w, accent); }} />}
      {toast && <div className="toast"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>{toast}</div>}
    </div>
  );
}

function Favorites({ favorites, onOpen, go }) {
  const list = WIDGETS.filter(w => favorites.includes(w.id));
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="eyebrow">Saved</div>
      <h1 className="serif" style={{ fontSize: 'clamp(30px,4vw,44px)', marginTop: 10, marginBottom: 24 }}>Your favorites</h1>
      {list.length
        ? <div className="wgrid">{list.map(w => <WidgetCard key={w.id} widget={w} onOpen={onOpen} />)}</div>
        : (
          <div style={{ textAlign: 'center', padding: '70px 24px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-lg)', background: 'var(--surface)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.3C12 20.3 3.8 14.7 3.8 9.2A4.4 4.4 0 0 1 12 6.8A4.4 4.4 0 0 1 20.2 9.2C20.2 14.7 12 20.3 12 20.3Z" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Nothing saved yet</div>
            <p style={{ color: 'var(--text-2)', maxWidth: 340, margin: '0 auto 18px' }}>Tap the heart on any widget in the studio to keep your favorite setups one click away.</p>
            <button className="btn btn-primary" onClick={() => go('widgets')}>Browse widgets</button>
          </div>
        )}
    </div>
  );
}

export default App;
// Reused by the standalone embed renderer (src/components/Embed.jsx)
export { Widget, WIDGETS, FONTS, SIZE_SCALE, ICON_PATHS, ICON_SET, onColor, lighten };

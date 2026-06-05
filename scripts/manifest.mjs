// Notion Crafts — icon build manifest (~550 icons across 19 categories).
// Each entry: [key, label]. `key` is our canonical kebab-case id (also the
// default Phosphor lookup name). Aliases for non-matching keys live in
// build-icons.mjs. Labels are what the gallery shows.

export const CATEGORIES = [
  {
    cat: 'Productivity & Tasks',
    icons: [
      ['check', 'Check'], ['check-circle', 'Check Circle'], ['check-square', 'Check Square'],
      ['check-double', 'Double Check'], ['checklist', 'Checklist'], ['square', 'Empty Checkbox'],
      ['target', 'Target'], ['crosshair', 'Crosshair'], ['goal', 'Goal'], ['flag', 'Flag'],
      ['trophy', 'Trophy'], ['medal', 'Medal'], ['award', 'Award'], ['star', 'Star'],
      ['star-half', 'Star Half'], ['bookmark', 'Bookmark'], ['pin', 'Pin'], ['push-pin', 'Push Pin'],
      ['inbox', 'Inbox'], ['tray', 'Tray'], ['list', 'List'], ['list-checks', 'Checklist Lines'],
      ['list-numbers', 'Numbered List'], ['kanban', 'Kanban Board'], ['columns', 'Columns'],
      ['clipboard', 'Clipboard'], ['clipboard-check', 'Clipboard Check'], ['clipboard-text', 'Clipboard List'],
      ['sticky-note', 'Sticky Note'], ['note', 'Note'], ['notebook', 'Notebook'], ['todo', 'To-Do'],
      ['hourglass', 'Hourglass'], ['timer', 'Timer'], ['stopwatch', 'Stopwatch'], ['focus', 'Focus'],
      ['repeat', 'Repeat'], ['streak', 'Streak'], ['gauge', 'Gauge'], ['flow-arrow', 'Workflow'],
    ],
  },
  {
    cat: 'Files & Documents',
    icons: [
      ['file', 'File'], ['file-text', 'Text File'], ['file-plus', 'New File'], ['file-minus', 'Remove File'],
      ['file-check', 'Approved File'], ['file-x', 'Rejected File'], ['file-pdf', 'PDF File'],
      ['file-doc', 'Word Doc'], ['file-xls', 'Spreadsheet'], ['file-ppt', 'Presentation'],
      ['file-image', 'Image File'], ['file-video', 'Video File'], ['file-audio', 'Audio File'],
      ['file-zip', 'Zip Archive'], ['file-code', 'Code File'], ['file-lock', 'Locked File'],
      ['file-search', 'Search File'], ['files', 'Files'], ['copy', 'Copy'], ['folder', 'Folder'],
      ['folder-open', 'Folder Open'], ['folder-plus', 'New Folder'], ['folder-minus', 'Remove Folder'],
      ['folder-check', 'Folder Check'], ['folder-star', 'Favorite Folder'], ['folder-lock', 'Locked Folder'],
      ['archive', 'Archive'], ['package', 'Archive Box'], ['document', 'Document'], ['pages', 'Pages'],
      ['paperclip', 'Paperclip'], ['printer', 'Printer'], ['scan', 'Scan'], ['upload-simple', 'Upload File'],
      ['download-simple', 'Download File'], ['trash', 'Trash'], ['bookmarks', 'Saved'], ['book', 'Notebook'],
    ],
  },
  {
    cat: 'Communication',
    icons: [
      ['envelope', 'Mail'], ['envelope-open', 'Mail Open'], ['envelope-simple', 'New Mail'],
      ['paper-plane', 'Send'], ['chat', 'Chat'], ['chat-circle', 'Chat Bubble'], ['chats', 'Chats'],
      ['chat-text', 'Message'], ['chat-dots', 'Message Dots'], ['comment', 'Comment'],
      ['quotes', 'Quote'], ['arrow-bend-up-left', 'Reply'], ['arrow-bend-up-right', 'Forward'],
      ['at', 'At Mention'], ['hash', 'Hashtag'], ['phone', 'Phone'], ['phone-call', 'Phone Call'],
      ['phone-incoming', 'Incoming Call'], ['phone-outgoing', 'Outgoing Call'], ['voicemail', 'Voicemail'],
      ['megaphone', 'Megaphone'], ['megaphone-simple', 'Announcement'], ['bell', 'Bell'],
      ['bell-ringing', 'Bell Ringing'], ['bell-slash', 'Bell Off'], ['broadcast', 'Broadcast'],
      ['wifi-high', 'Signal'], ['rss', 'Feed'], ['share-network', 'Share'], ['link', 'Link'],
    ],
  },
  {
    cat: 'Media & Audio',
    icons: [
      ['play', 'Play'], ['play-circle', 'Play Circle'], ['pause', 'Pause'], ['pause-circle', 'Pause Circle'],
      ['stop', 'Stop'], ['skip-forward', 'Skip Forward'], ['skip-back', 'Skip Back'],
      ['fast-forward', 'Fast Forward'], ['rewind', 'Rewind'], ['shuffle', 'Shuffle'], ['repeat-once', 'Repeat Track'],
      ['music-note', 'Music Note'], ['music-notes', 'Music Notes'], ['headphones', 'Headphones'],
      ['speaker-high', 'Speaker'], ['speaker-low', 'Volume Low'], ['speaker-simple-x', 'Volume Mute'],
      ['microphone', 'Microphone'], ['microphone-slash', 'Microphone Off'], ['radio', 'Radio'],
      ['microphone-stage', 'Podcast'], ['vinyl-record', 'Vinyl Record'], ['playlist', 'Playlist'],
      ['video', 'Video'], ['film-strip', 'Film'], ['film-slate', 'Clapperboard'], ['equalizer', 'Equalizer'],
      ['waveform', 'Waveform'],
    ],
  },
  {
    cat: 'Photography & Camera',
    icons: [
      ['camera', 'Camera'], ['camera-slash', 'Camera Off'], ['aperture', 'Aperture'], ['image', 'Image'],
      ['images', 'Images'], ['image-square', 'Photo'], ['gif', 'GIF'], ['polaroid', 'Polaroid'],
      ['frame-corners', 'Focus Frame'], ['lightning', 'Flash'], ['lightning-slash', 'Flash Off'],
      ['magnifying-glass-plus', 'Zoom In'], ['crop', 'Crop'], ['funnel', 'Photo Filter'],
      ['circle-half', 'Contrast'], ['sun-dim', 'Exposure'], ['camera-rotate', 'Flip Camera'],
      ['selection', 'Frame'],
    ],
  },
  {
    cat: 'Weather & Nature',
    icons: [
      ['sun', 'Sun'], ['sun-dim', 'Sun Dim'], ['moon', 'Moon'], ['moon-stars', 'Moon & Stars'],
      ['cloud', 'Cloud'], ['cloud-sun', 'Partly Cloudy'], ['cloud-moon', 'Cloudy Night'],
      ['cloud-rain', 'Rain'], ['cloud-snow', 'Snow'], ['cloud-lightning', 'Thunderstorm'],
      ['cloud-fog', 'Fog'], ['rainbow', 'Rainbow'], ['umbrella', 'Umbrella'], ['wind', 'Wind'],
      ['tornado', 'Tornado'], ['snowflake', 'Snowflake'], ['drop', 'Droplet'], ['drop-half', 'Water'],
      ['fire', 'Fire'], ['flame', 'Flame'], ['lightning', 'Lightning Bolt'], ['thermometer', 'Thermometer'],
      ['sun-horizon', 'Sunrise'], ['star-four', 'Sparkle'], ['sparkle', 'Sparkles'], ['leaf', 'Leaf'],
      ['plant', 'Plant'], ['tree', 'Tree'], ['tree-evergreen', 'Pine Tree'], ['flower', 'Flower'],
      ['flower-lotus', 'Lotus'], ['cactus', 'Cactus'], ['mountains', 'Mountain'], ['waves', 'Wave'],
      ['globe-hemisphere-west', 'Earth'], ['planet', 'Planet'], ['shooting-star', 'Shooting Star'],
      ['cloud-sun', 'Day'], ['acorn', 'Acorn'], ['bird', 'Bird'],
    ],
  },
  {
    cat: 'Travel & Places',
    icons: [
      ['house', 'Home'], ['house-line', 'House'], ['building', 'Building'], ['buildings', 'Buildings'],
      ['building-office', 'Office'], ['factory', 'Factory'], ['storefront', 'Store'], ['bank', 'Bank'],
      ['hospital', 'Hospital'], ['airplane', 'Plane'], ['airplane-takeoff', 'Takeoff'],
      ['airplane-landing', 'Landing'], ['rocket', 'Rocket'], ['car', 'Car'], ['taxi', 'Taxi'],
      ['bus', 'Bus'], ['train', 'Train'], ['tram', 'Tram'], ['bicycle', 'Bike'], ['scooter', 'Scooter'],
      ['motorcycle', 'Motorcycle'], ['boat', 'Boat'], ['anchor', 'Anchor'], ['compass', 'Compass'],
      ['map-trifold', 'Map'], ['map-pin', 'Map Pin'], ['navigation-arrow', 'Location'], ['globe', 'Globe'],
      ['suitcase', 'Luggage'], ['suitcase-rolling', 'Suitcase'], ['ticket', 'Ticket'], ['gas-pump', 'Gas'],
      ['traffic-sign', 'Sign'], ['road-horizon', 'Road'], ['tent', 'Tent'], ['lighthouse', 'Lighthouse'],
    ],
  },
  {
    cat: 'Finance & Shopping',
    icons: [
      ['wallet', 'Wallet'], ['money', 'Cash'], ['coin', 'Coin'], ['coins', 'Coins'],
      ['currency-circle-dollar', 'Money'], ['currency-dollar', 'Dollar'], ['currency-eur', 'Euro'],
      ['currency-gbp', 'Pound'], ['currency-jpy', 'Yen'], ['currency-btc', 'Bitcoin'],
      ['credit-card', 'Credit Card'], ['piggy-bank', 'Piggy Bank'], ['vault', 'Vault'],
      ['receipt', 'Receipt'], ['invoice', 'Invoice'], ['calculator', 'Calculator'], ['chart-bar', 'Bar Chart'],
      ['chart-line', 'Line Chart'], ['chart-pie', 'Pie Chart'], ['chart-line-up', 'Trending Up'],
      ['chart-line-down', 'Trending Down'], ['percent', 'Percent'], ['tag', 'Tag'], ['tag-simple', 'Tags'],
      ['shopping-cart', 'Shopping Cart'], ['shopping-cart-simple', 'Add to Cart'], ['basket', 'Shopping Basket'],
      ['shopping-bag', 'Shopping Bag'], ['gift', 'Gift'], ['package', 'Package'], ['truck', 'Delivery Truck'],
      ['barcode', 'Barcode'], ['qr-code', 'QR Code'], ['hand-coins', 'Earnings'], ['bag', 'Bag'],
      ['scales', 'Balance'], ['trend-up', 'Growth'], ['money-wavy', 'Bills'],
    ],
  },
  {
    cat: 'Health & Fitness',
    icons: [
      ['heart', 'Heart'], ['heartbeat', 'Heartbeat'], ['pulse', 'Pulse'], ['activity', 'Activity'],
      ['barbell', 'Dumbbell'], ['boxing-glove', 'Boxing'], ['person-simple-run', 'Running'],
      ['person-simple-walk', 'Walking'], ['yoga', 'Yoga'], ['meditation', 'Meditation'],
      ['hand-fist', 'Strength'], ['footprints', 'Footprints'], ['person-simple-bike', 'Cycling'],
      ['sneaker', 'Running Shoe'], ['pill', 'Pill'], ['stethoscope', 'Stethoscope'], ['bandaids', 'Bandage'],
      ['first-aid', 'First Aid'], ['first-aid-kit', 'Aid Kit'], ['brain', 'Brain'], ['tooth', 'Tooth'],
      ['bone', 'Bone'], ['bed', 'Sleep'], ['scales', 'Scale'], ['syringe', 'Syringe'], ['virus', 'Virus'],
      ['dna', 'DNA'], ['eye', 'Eye'], ['ear', 'Ear'], ['hand-heart', 'Care'],
    ],
  },
  {
    cat: 'Food & Drink',
    icons: [
      ['coffee', 'Coffee'], ['tea-bag', 'Tea'], ['cup', 'Cup'], ['beer-stein', 'Beer'],
      ['wine', 'Wine'], ['martini', 'Cocktail'], ['bottle', 'Bottle'], ['milk', 'Milk'],
      ['apple-logo', 'Apple'], ['orange', 'Orange'], ['cherries', 'Cherry'], ['lemon', 'Lemon'],
      ['avocado', 'Avocado'], ['carrot', 'Carrot'], ['bread', 'Bread'], ['cookie', 'Cookie'],
      ['egg', 'Egg'], ['cheese', 'Cheese'], ['pizza', 'Pizza'], ['hamburger', 'Burger'],
      ['hot-dog', 'Hot Dog'], ['french-fries', 'Fries'], ['taco', 'Taco'], ['sushi', 'Sushi'],
      ['bowl-food', 'Noodles'], ['fork-knife', 'Cutlery'], ['cake', 'Cake'], ['ice-cream', 'Ice Cream'],
      ['popcorn', 'Popcorn'], ['hamburger', 'Fast Food'], ['cooking-pot', 'Soup'], ['wine', 'Drinks'],
      ['grains', 'Grains'], ['pepper', 'Pepper'], ['fish', 'Fish'], ['shrimp', 'Shrimp'],
      ['champagne', 'Champagne'], ['brandy', 'Brandy'],
    ],
  },
  {
    cat: 'Education',
    icons: [
      ['book', 'Book'], ['books', 'Books'], ['book-open', 'Open Book'], ['book-bookmark', 'Bookmarked Book'],
      ['notebook', 'Notebook'], ['graduation-cap', 'Graduation Cap'], ['student', 'Student'],
      ['backpack', 'Backpack'], ['pencil', 'Pencil'], ['pen', 'Pen'], ['ruler', 'Ruler'],
      ['eraser', 'Eraser'], ['highlighter', 'Highlighter'], ['paint-brush', 'Marker'], ['abacus', 'Abacus'],
      ['microscope', 'Microscope'], ['telescope', 'Telescope'], ['atom', 'Atom'], ['dna', 'DNA'],
      ['flask', 'Flask'], ['test-tube', 'Test Tube'], ['chalkboard', 'Chalkboard'], ['certificate', 'Certificate'],
      ['globe-stand', 'Study Globe'], ['exam', 'Exam'], ['math-operations', 'Math'],
    ],
  },
  {
    cat: 'Devices & Tech',
    icons: [
      ['device-mobile', 'Smartphone'], ['device-tablet', 'Tablet'], ['laptop', 'Laptop'],
      ['desktop', 'Desktop'], ['monitor', 'Monitor'], ['keyboard', 'Keyboard'], ['mouse', 'Mouse'],
      ['watch', 'Smartwatch'], ['television', 'TV'], ['game-controller', 'Gamepad'], ['joystick', 'Joystick'],
      ['printer', 'Printer'], ['hard-drives', 'Server'], ['hard-drive', 'Hard Drive'], ['cpu', 'CPU'],
      ['memory', 'Memory'], ['wifi-high', 'Wi-Fi'], ['wifi-slash', 'Wi-Fi Off'], ['bluetooth', 'Bluetooth'],
      ['battery-full', 'Battery'], ['battery-high', 'Battery High'], ['battery-low', 'Battery Low'],
      ['battery-charging', 'Charging'], ['plug', 'Plug'], ['power', 'Power'], ['usb', 'USB'],
      ['sim-card', 'SIM Card'], ['sd-card', 'SD Card'], ['headset', 'Headset'], ['webcam', 'Webcam'],
      ['scan-smiley', 'Face ID'], ['fingerprint', 'Fingerprint'],
    ],
  },
  {
    cat: 'Development & Data',
    icons: [
      ['code', 'Code'], ['code-block', 'Code Block'], ['brackets-square', 'Brackets'],
      ['brackets-curly', 'Braces'], ['terminal', 'Terminal'], ['terminal-window', 'Terminal Window'],
      ['command', 'Command'], ['bug', 'Bug'], ['git-branch', 'Git Branch'], ['git-commit', 'Git Commit'],
      ['git-merge', 'Git Merge'], ['git-pull-request', 'Pull Request'], ['git-fork', 'Fork'],
      ['database', 'Database'], ['table', 'Table'], ['grid-four', 'Grid'], ['binary', 'Binary'],
      ['function', 'Function'], ['cloud-arrow-up', 'Cloud Upload'], ['cloud-arrow-down', 'Cloud Download'],
      ['cloud-check', 'Cloud Sync'], ['arrows-clockwise', 'Sync'], ['rocket-launch', 'Deploy'],
      ['stack', 'Stack'], ['tree-structure', 'Sitemap'], ['webhooks-logo', 'Webhook'], ['bracket', 'Bracket'],
      ['file-cloud', 'Cloud File'],
    ],
  },
  {
    cat: 'Arrows & Navigation',
    icons: [
      ['arrow-up', 'Arrow Up'], ['arrow-down', 'Arrow Down'], ['arrow-left', 'Arrow Left'],
      ['arrow-right', 'Arrow Right'], ['arrow-up-right', 'Arrow Up-Right'], ['arrow-up-left', 'Arrow Up-Left'],
      ['arrow-down-right', 'Arrow Down-Right'], ['arrow-down-left', 'Arrow Down-Left'],
      ['arrow-circle-up', 'Arrow Up Circle'], ['arrow-circle-down', 'Arrow Down Circle'],
      ['arrow-circle-left', 'Arrow Left Circle'], ['arrow-circle-right', 'Arrow Right Circle'],
      ['caret-up', 'Chevron Up'], ['caret-down', 'Chevron Down'], ['caret-left', 'Chevron Left'],
      ['caret-right', 'Chevron Right'], ['caret-double-up', 'Chevrons Up'], ['caret-double-down', 'Chevrons Down'],
      ['caret-double-left', 'Chevrons Left'], ['caret-double-right', 'Chevrons Right'],
      ['arrows-left-right', 'Arrows Horizontal'], ['arrows-vertical', 'Arrows Vertical'],
      ['arrow-u-up-left', 'Undo'], ['arrow-u-up-right', 'Redo'], ['arrow-clockwise', 'Refresh'],
      ['arrows-counter-clockwise', 'Rotate'], ['swap', 'Swap'], ['arrows-out-cardinal', 'Move'],
      ['arrows-out', 'Maximize'], ['arrows-in', 'Minimize'], ['arrow-line-up-right', 'Expand'],
      ['arrow-line-down-left', 'Collapse'], ['arrow-arc-left', 'Loop'], ['arrow-fat-up', 'Up'],
      ['arrow-fat-down', 'Down'], ['arrow-square-out', 'External Link'], ['arrow-bend-down-right', 'Branch'],
      ['arrows-merge', 'Merge'], ['arrows-split', 'Split'], ['cursor', 'Cursor'],
    ],
  },
  {
    cat: 'UI, Editing & Controls',
    icons: [
      ['plus', 'Plus'], ['minus', 'Minus'], ['x', 'Close'], ['x-circle', 'Close Circle'],
      ['plus-circle', 'Plus Circle'], ['list-bullets', 'Menu'], ['dots-three', 'More'],
      ['dots-three-vertical', 'More Vertical'], ['gear', 'Settings'], ['gear-six', 'Gear'],
      ['sliders', 'Sliders'], ['sliders-horizontal', 'Adjust'], ['toggle-right', 'Toggle On'],
      ['toggle-left', 'Toggle Off'], ['funnel', 'Filter'], ['funnel-simple', 'Sort'],
      ['sort-ascending', 'Sort Ascending'], ['sort-descending', 'Sort Descending'],
      ['magnifying-glass', 'Search'], ['magnifying-glass-plus', 'Zoom In'], ['magnifying-glass-minus', 'Zoom Out'],
      ['pencil-simple', 'Edit'], ['pencil', 'Pencil Edit'], ['trash', 'Trash'], ['trash-simple', 'Empty Trash'],
      ['floppy-disk', 'Save'], ['download', 'Download'], ['upload', 'Upload'], ['share', 'Share'],
      ['link-simple', 'Link'], ['link-break', 'Unlink'], ['lock', 'Lock'], ['lock-open', 'Unlock'],
      ['key', 'Key'], ['eye', 'Eye'], ['eye-slash', 'Eye Off'], ['text-b', 'Bold'], ['text-italic', 'Italic'],
      ['text-underline', 'Underline'], ['text-align-left', 'Align Left'], ['text-align-center', 'Align Center'],
      ['text-aa', 'Typography'],
    ],
  },
  {
    cat: 'Time & Calendar',
    icons: [
      ['calendar', 'Calendar'], ['calendar-dots', 'Calendar Days'], ['calendar-plus', 'Add Event'],
      ['calendar-check', 'Event Done'], ['calendar-x', 'Cancel Event'], ['calendar-blank', 'Blank Calendar'],
      ['calendar-heart', 'Special Day'], ['clock', 'Clock'], ['alarm', 'Alarm Clock'], ['clock-afternoon', 'Afternoon'],
      ['watch', 'Watch'], ['hourglass', 'Hourglass'], ['timer', 'Timer'], ['stopwatch', 'Stopwatch'],
      ['clock-clockwise', 'Schedule'], ['clock-countdown', 'Countdown'], ['clock-counter-clockwise', 'History'],
      ['arrows-clockwise', 'Recurring'], ['calendar-star', 'Today'], ['calendar-blank', 'Week'],
      ['sun-horizon', 'Sunrise Time'], ['moon', 'Night'],
    ],
  },
  {
    cat: 'People & Social',
    icons: [
      ['user', 'User'], ['user-circle', 'User Circle'], ['users', 'Users'], ['user-plus', 'Add User'],
      ['user-minus', 'Remove User'], ['user-check', 'Verified User'], ['user-focus', 'Focus User'],
      ['identification-card', 'ID Card'], ['address-book', 'Contact'], ['users-three', 'Team'],
      ['users-four', 'Group'], ['person', 'Person'], ['user-square', 'Avatar'], ['smiley', 'Smile'],
      ['smiley-wink', 'Wink'], ['smiley-sad', 'Sad'], ['thumbs-up', 'Thumbs Up'], ['thumbs-down', 'Thumbs Down'],
      ['handshake', 'Handshake'], ['hand-waving', 'Wave'], ['heart-straight', 'Like'], ['user-list', 'Follow'],
      ['at', 'Mention'], ['badge', 'Badge'], ['crown', 'Crown'], ['ghost', 'Ghost'], ['baby', 'Baby'],
      ['hand-peace', 'Peace'],
    ],
  },
  {
    cat: 'Objects & Tools',
    icons: [
      ['lightbulb', 'Lightbulb'], ['lightbulb-filament', 'Idea'], ['diamond', 'Diamond'],
      ['diamonds-four', 'Gem'], ['key', 'Key'], ['magnet', 'Magnet'], ['magic-wand', 'Magic Wand'],
      ['palette', 'Palette'], ['paint-brush', 'Brush'], ['paint-roller', 'Paint Roller'], ['scissors', 'Scissors'],
      ['ruler', 'Ruler'], ['hammer', 'Hammer'], ['wrench', 'Wrench'], ['screwdriver', 'Screwdriver'],
      ['toolbox', 'Toolbox'], ['shield', 'Shield'], ['shield-check', 'Shield Check'], ['umbrella', 'Umbrella'],
      ['handbag', 'Handbag'], ['briefcase', 'Briefcase'], ['backpack', 'Backpack'], ['eyeglasses', 'Glasses'],
      ['sunglasses', 'Sunglasses'], ['ring', 'Ring'], ['balloon', 'Balloon'], ['campfire', 'Campfire'],
      ['trophy', 'Trophy'], ['puzzle-piece', 'Puzzle'], ['dice-five', 'Dice'], ['flag-banner', 'Banner'],
      ['rocket', 'Rocket'], ['lego', 'Blocks'], ['gavel', 'Gavel'], ['lightning', 'Energy'], ['battery-charging', 'Charge'],
    ],
  },
  {
    cat: 'Symbols & Shapes',
    icons: [
      ['circle', 'Circle'], ['circle-half', 'Half Circle'], ['square', 'Square'], ['triangle', 'Triangle'],
      ['diamond', 'Diamond'], ['pentagon', 'Pentagon'], ['hexagon', 'Hexagon'], ['octagon', 'Octagon'],
      ['star', 'Star'], ['heart', 'Heart'], ['cross', 'Cross'], ['plus', 'Plus'], ['infinity', 'Infinity'],
      ['asterisk', 'Asterisk'], ['percent', 'Percent'], ['hash', 'Hash'], ['at', 'At'],
      ['question', 'Question Mark'], ['warning', 'Warning'], ['warning-circle', 'Alert'], ['info', 'Info'],
      ['prohibit', 'No / Ban'], ['dot-outline', 'Dot'], ['dots-three-outline', 'Dots'], ['quotes', 'Quote'],
      ['copyright', 'Copyright'], ['trademark-registered', 'Trademark'], ['recycle', 'Recycle'],
      ['yin-yang', 'Yin Yang'], ['peace', 'Peace'], ['heart-break', 'Broken Heart'], ['sparkle', 'Spark'],
      ['circle-dashed', 'Status Dot'], ['spinner', 'Loading'], ['check-fat', 'Approved'], ['x-square', 'Cancel'],
      ['shield-warning', 'Caution'], ['seal-check', 'Verified'], ['number-circle-one', 'One'], ['arrows-out-line-horizontal', 'Divider'],
    ],
  },
];

// Flatten with de-dup (first occurrence of a key wins; later dup keys are
// dropped so the same glyph isn't shipped twice).
export function flatManifest() {
  const seen = new Set();
  const out = [];
  for (const { cat, icons } of CATEGORIES) {
    for (const [key, label] of icons) {
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, label, cat });
    }
  }
  return out;
}

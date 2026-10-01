/* =========================
   BRAWLER TAGS (kit traits)
   Small badge icons shown on each brawler's portrait (top-right corner,
   where the class indicator used to sit). A brawler can have zero, one,
   or several tags.

   IMPORTANT: this is a best-effort STARTING DRAFT, not a verified list.
   Brawl Stars kits change with balance updates and there are 100+
   brawlers here, so treat blank entries as "not yet reviewed" rather
   than "confirmed no tag."
========================= */
# ── CROWD CONTROL ──────────────
knockback: "💨"
slow: "🐌"
root: "💫"
stun: "🥴"
silence: "🤐"
pull: "🧲"

# ── MOVEMENT ───────────────────
mobility: "🏃"

# ── ATTACK ─────────────────────
pierce: "🏹"
bounce: "🔄"
chain: "⛓️"
	
# ── DEFENSE ────────────────────
shield: "🛡️"
invulnerability: "✨"

# ── HEALTH ─────────────────────
heal: "💖"
antiheal: "🖤"
lifesteal: "🧛"
decay: "💀"

# ── MAP / ENVIRONMENT ──────────
wallbreak: "💥"
water: "🌊"

# ── UTILITY ────────────────────
spawnable: "🤖"
invisibility: "👻"
reveal: "👁️"

const tagLabel = {
    // Crowd Control
    knockback: "Knockback",
    slow: "Slow",
    root: "Root",
    stun: "Stun",
    silence: "Silence",
    pull: "Pull",

    // Movement
    mobility: "Mobility",

    // Attack
    pierce: "Pierce",
    bounce: "Bounce",
	chain: "Chain",

    // Defense
    shield: "Shield",
    invulnerability: "Invulnerability",

    // Health
    heal: "Heal",
    antiheal: "Anti-Heal",
    lifesteal: "Lifesteal",
    decay: "Decay",

    // Map / Environment
    wallbreak: "Wallbreak",
    water: "Water-walking",

    // Utility
    spawnable: "Spawnable",
    invisibility: "Invisibility",
    reveal: "Reveal"
};

const brawlerTags = {
    "8bit": ["mobility", "heal", "mobility", "spawnable"],
    "alli": ["mobility", "invisibility", "water"],
    "amber": ["decay"],
    "angelo": ["decay", "heal", "mobility", "pierce", "water"],
    "ash": ["heal", "spawnable"],
    "barley": ["slow", "heal", "decay"],
    "bea": ["slow", "spawnable"],
    "belle": ["bounce"],
    "berry": ["heal", "knockback", "mobility", "decay"],
    "bibi": ["knockback", "bounce"],
    "bo": ["knockback", "spawnable", "wallbreak"],
    "bolt": ["mobility"],
    "bonnie": ["knockback", "mobility"],
    "brock": ["mobility", "wallbreak", "decay"],
    "bull": ["heal", "mobility", "knockback", "slow", "stun", "wallbreak", "pierce"],
    "buster": ["heal", "shield", "pull"],
    "buzz": ["stun", "mobility"],
    "byron": ["heal", "decay", "pierce"],
    "carl": ["mobility", "pierce"],
    "charlie": ["root", "slow", "spawnable"],
    "chester": ["knockback", "wallbreak"],
    "chuck": ["mobility"],
    "clancy": [],
    "colette": ["mobility"],
    "colt": ["slow", "pierce", "wallbreak"],
    "cord": ["silence", "slow", "mobility"],
    "cosmo": [],
    "crow": ["decay", "antiheal", "slow"],
    "damian": ["heal", "knockback", "decay"],
    "darryl": ["knockback", "mobility"],
    "doug": ["heal"],
    "draco": ["pierce", "mobility"],
    "dynamike": ["knockback", "stun", "mobility", "wallbreak"],
    "edgar": ["heal", "lifesteal", "mobility"],
    "emz": ["knockback", "slow", "stun", "decay"],
    "eve": ["spawnable", "water"],
    "fang": ["stun", "mobility"],
    "finx": ["root", "mobility", "slow"],
    "frank": ["stun", "pull", "wallbreak"],
    "gale": ["knockback", "slow", "stun"],
    "gene": ["heal", "knockback", "pull"],
    "gigi": ["mobility", "invisibility"],
    "glowbert": ["heal"],
    "gray": ["pull", "heal", "mobility", "wallbreak"],
    "griff": ["heal", "knockback", "wallbreak"],
    "grom": ["knockback", "pierce", "wallbreak"],
    "gus": ["knockback", "heal", "shield", "spawnable"],
    "hank": ["heal", "slow"],
    "jacky": ["pull", "mobility"],
    "jaeyong": ["heal", "pierce", "mobility"],
    "janet": ["mobility", "spawnable"],
    "jessie": ["bounce", "slow", "spawnable"],
    "juju": ["invisibility", "spawnable", "water"],
    "kenji": ["mobility", "invulnerability", "heal"],
    "kaze": ["heal", "mobility", "invisibility"],
    "kit": ["heal", "mobility", "invisibility"],
    "larry": ["spawnable"],
    "leon": ["invisibility", "mobility", "spawnable"],
    "lily": ["mobility", "invisibility"],
    "lola": ["heal", "shield", "spawnable"],
    "lou": ["root", "slow", "invulnerability"],
    "lumi": ["slow", "stun", "antiheal", "decay"],
    "maisie": ["knockback", "stun", "slow", "mobility"],
    "mandy": ["pierce", "slow"],
    "max": ["mobility", "invulnerability"],
    "meeple": ["knockback", "stun", "pierce", "spawnable"],
    "meg": ["knockback", "heal"],
    "melodie": ["mobility"],
    "mico": ["mobility", "invulnerability", "knockback"],
    "mina": ["knockback", "mobility", "stun"],
    "moe": ["knockback", "mobility", "bounce", "pierce"],
    "mortis": ["mobility", "lifesteal"],
    "mrp": ["bounce", "spawnable"],
    "najia": ["decay", "spawnable"],
    "nani": ["mobility", "wallbreak"],
    "nita": ["heal", "spawnable"],
    "nori": ["heal", "mobility", "pull"],
    "ollie": ["pierce", "mobility", "pull"],
    "otis": ["silence", "decay"],
    "pam": ["heal", "spawnable"],
    "pearl": ["heal", "decay"],
    "penny": ["pierce", "decay", "spawnable"],
    "pierce": ["pierce", "slow", "shield", "knockback"],
    "piper": ["knockback", "mobility", "wallbreak"],
    "poco": ["heal"],
    "primo": ["knockback", "mobility", "wallbreak", "decay"],
    "rt": ["mobility"],
    "rico": ["pierce", "bounce", "spawnable"],
    "rosa": ["shield"],
    "ruffs": ["bounce", "spawnable"],
    "sam": ["pull", "heal", "mobility", "pierce"],
    "sandy": ["pierce", "heal", "invisibility"],
    "shade": ["mobility"],
    "shelly": ["knockback", "mobility", "wallbreak", "invulnerability"],
    "sirius": ["spawnable"],
    "spike": ["slow", "root", "heal", "spawnable"],
    "sprout": ["bounce", "heal", "spawnable"],
    "squeak": ["slow", "reveal"],
    "starrnova": [],
    "stu": ["mobility", "decay", "wallbreak"],
    "surge": ["knockback", "mobility"],
    "tara": ["pierce", "pull", "spawnable", "reveal"],
    "tick": ["knockback", "spawnable", "wallbreak"],
    "trunk": ["mobility", "bounce", "spawnable"],
    "wendy": ["shield", "slow", "antiheal", "mobility"],
    "willow": ["decay", "heal"],
    "ziggy": []
};

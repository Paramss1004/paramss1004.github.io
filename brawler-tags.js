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
    "8bit": ["heal", "mobility", "spawnable"],
    "alli": ["pierce", "heal", "mobility", "invisibility", "water"],
    "amber": ["pierce", "decay", "spawnable"],
    "angelo": ["pierce", "heal", "antiheal", "decay", "mobility", "water"],
    "ash": ["pierce", "heal", "spawnable"],
    "barley": ["slow", "pierce", "heal"],
    "bea": ["slow", "],
    "belle": ["pierce"],
    "berry": ["heal", "knockback"],
    "bibi": ["knockback"],
    "bo": ["wallbreak"],
    "bolt": ["knockback", "wallbreak"],
    "bonnie": ["knockback"],
    "brock": ["knockback", "wallbreak"],
    "bull": ["heal", "wallbreak", "pierce", "knockback"],
    "buster": ["heal", "pull"],
    "buzz": [],
    "byron": ["heal", "antiheal", "pierce"],
    "carl": ["pierce"],
    "charlie": ["spawnable"],
    "chester": ["wallbreak", "knockback"],
    "chuck": ["spawnable"],
    "clancy": [],
    "colette": ["knockback"],
    "colt": ["wallbreak"],
    "cord": ["pull"],
    "crow": ["poison", "antiheal"],
    "damian": ["heal", "knockback", "spawnable"],
    "darryl": ["knockback"],
    "doug": ["heal"],
    "draco": [],
    "edgar": ["heal"],
    "emz": ["knockback"],
    "eve": ["spawnable"],
    "fang": [],
    "finx": [],
    "frank": ["wallbreak"],
    "gale": ["knockback"],
    "gene": ["heal", "pull", "wallbreak"],
    "gigi": ["invisibility"],
    "glowbert": ["heal"],
    "gray": ["spawnable", "wallbreak"],
    "griff": ["heal", "knockback", "wallbreak"],
    "grom": ["knockback", "pierce", "wallbreak"],
    "gus": ["knockback", "heal", "spawnable"],
    "hank": [],
    "jacky": [],
    "jaeyong": ["heal", "pierce"],
    "janet": [],
    "jessie": ["spawnable"],
    "juju": ["invisibility", "spawnable", "water"],
    "kenji": [],
    "kaze": ["heal", "invisibility"],
    "kit": ["heal", "invisibility"],
    "larry": ["spawnable"],
    "leon": ["invisibility", "spawnable"],
    "lily": [],
    "lola": ["spawnable"],
    "lou": [],
    "lumi": [],
    "maisie": ["knockback"],
    "mandy": ["pierce"],
    "max": [],
    "meg": ["knockback", "heal"],
    "melodie": [],
    "meeple": ["knockback"],
    "mico": ["knockback"],
    "mina": [],
    "moe": ["knockback", "pierce"],
    "mortis": [],
    "mrp": ["spawnable"],
    "najia": ["poison", "spawnable"],
    "nani": ["wallbreak"],
    "nita": ["heal", "spawnable"],
    "nori": ["heal"],
    "ollie": [],
    "otis": [],
    "pam": ["heal", "spawnable"],
    "pearl": ["wallbreak"],
    "pierce": [],
    "piper": ["wallbreak"],
    "poco": ["heal"],
    "primo": ["knockback", "wallbreak"],
    "rt": [],
    "rico": ["spawnable"],
    "rosa": ["pierce"],
    "ruffs": ["spawnable", "wallbreak"],
    "sam": [],
    "sandy": [],
    "shade": [],
    "shelly": ["knockback", "wallbreak"],
    "sirius": ["spawnable"],
    "spike": ["heal", "spawnable"],
    "sprout": ["spawnable"],
    "squeak": [],
    "starrnova": [],
    "stu": ["wallbreak"],
    "surge": ["knockback"],
    "tara": ["pierce", "pull", "spawnable", "wallbreak"],
    "tick": ["wallbreak"],
    "trunk": [],
    "wendy": ["antiheal", "spawnable", "water"],
    "willow": ["poison"],
    "ziggy": []
};

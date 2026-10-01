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
# ── HEALTH ─────────────────────
heal: "💖"
antiheal: "🖤"
lifesteal: "🧛"
decay: "💀"

# ── ATTACK ─────────────────────
pierce: "🏹"
bounce: "🔄"
chain: "⛓️"
	
# ── DEFENSE ────────────────────
shield: "🛡️"
invulnerability: "✨"

# ── CROWD CONTROL ──────────────
slow: "🐌"
root: "💫"
silence: "🤐"
stun: "🥴"
knockback: "💨"
pull: "🧲"

# ── MOVEMENT ───────────────────
mobility: "🏃"

# ── MAP / ENVIRONMENT ──────────
wallbreak: "💥"
water: "🌊"

# ── UTILITY ────────────────────
spawnable: "🤖"
invisibility: "👻"
reveal: "👁️"

const tagLabel = {
	// Health
    heal: "Heal",
    antiheal: "Anti-Heal",
    lifesteal: "Lifesteal",
    decay: "Decay",
	
    // Attack
    pierce: "Pierce",
    bounce: "Bounce",
	chain: "Chain",

    // Defense
    shield: "Shield",
    invulnerability: "Invulnerability",

	// Crowd Control
	slow: "Slow",
    root: "Root",
    silence: "Silence",
	stun: "Stun",
    knockback: "Knockback",
    pull: "Pull",

    // Movement
    mobility: "Mobility",
	
    // Map / Environment
    wallbreak: "Wallbreak",
    water: "Water-walking",

    // Utility
    spawnable: "Spawnable",
    invisibility: "Invisibility",
    reveal: "Reveal"
};

const brawlerTags = {
    "8bit": ["heal", "chain", "mobility", "spawnable"],
    "alli": ["heal", "pierce", "mobility", "water", "invisibility"],
    "amber": ["decay", "pierce"],
    "angelo": ["heal", "decay", "pierce", "mobility", "water"],
    "ash": ["heal", "spawnable"],
    "barley": ["heal", "decay", "slow"],
    "bea": ["slow", "spawnable"],
    "belle": ["bounce"],
    "berry": ["heal", "decay", "knockback", "mobility"],
    "bibi": ["bounce", "knockback"],
    "bo": ["knockback", "wallbreak", "spawnable"],
    "bolt": ["mobility"],
    "bonnie": ["knockback", "mobility"],
    "brock": ["decay", "mobility", "wallbreak"],
    "bull": ["heal", "pierce", "slow", "stun", "knockback", "mobility", "wallbreak"],
    "buster": ["heal", "shield", "pull"],
    "buzz": ["stun", "mobility"],
    "byron": ["heal", "decay", "pierce"],
    "carl": ["pierce", "mobility"],
    "charlie": ["slow", "root", "spawnable"],
    "chester": ["knockback", "wallbreak"],
    "chuck": ["mobility"],
    "clancy": [],
    "colette": ["mobility"],
    "colt": ["pierce", "slow", "wallbreak"],
    "cord": ["slow", "silence", "mobility"],
    "cosmo": [],
    "crow": ["antiheal", "decay", "slow"],
    "damian": ["heal", "decay", "knockback"],
    "darryl": ["knockback", "mobility"],
    "doug": ["heal"],
    "draco": ["pierce", "mobility"],
    "dynamike": ["stun", "knockback", "mobility", "wallbreak"],
    "edgar": ["heal", "lifesteal", "mobility"],
    "emz": ["decay", "slow", "stun", "knockback"],
    "eve": ["water", "spawnable"],
    "fang": ["stun", "mobility"],
    "finx": ["slow", "root", "mobility"],
    "frank": ["stun", "pull", "wallbreak"],
    "gale": ["slow", "stun", "knockback"],
    "gene": ["heal", "knockback", "pull"],
    "gigi": ["mobility", "invisibility"],
    "glowbert": ["heal"],
    "gray": ["heal", "pull", "mobility", "wallbreak"],
    "griff": ["heal", "knockback", "wallbreak"],
    "grom": ["pierce", "knockback", "wallbreak"],
    "gus": ["heal", "shield", "knockback", "spawnable"],
    "hank": ["heal", "slow"],
    "jacky": ["pull", "mobility"],
    "jaeyong": ["heal", "pierce", "mobility"],
    "janet": ["mobility", "spawnable"],
    "jessie": ["bounce", "slow", "spawnable"],
    "juju": ["water", "spawnable", "invisibility"],
    "kenji": ["heal", "invulnerability", "mobility"],
    "kaze": ["heal", "mobility", "invisibility"],
    "kit": ["heal", "mobility", "invisibility"],
    "larry": ["spawnable"],
    "leon": ["mobility", "spawnable", "invisibility"],
    "lily": ["mobility", "invisibility"],
    "lola": ["heal", "shield", "spawnable"],
    "lou": ["invulnerability", "slow", "root"],
    "lumi": ["antiheal", "decay", "slow", "stun"],
    "maisie": ["slow", "stun", "knockback", "mobility"],
    "mandy": ["pierce", "slow"],
    "max": ["invulnerability", "mobility"],
    "meeple": ["pierce", "stun", "knockback", "spawnable"],
    "meg": ["heal", "knockback"],
    "melodie": ["mobility"],
    "mico": ["invulnerability", "knockback", "mobility"],
    "mina": ["stun", "knockback", "mobility"],
    "moe": ["pierce", "bounce", "knockback", "mobility"],
    "mortis": ["lifesteal", "mobility"],
    "mrp": ["bounce", "spawnable"],
    "najia": ["decay", "spawnable"],
    "nani": ["mobility", "wallbreak"],
    "nita": ["heal", "spawnable"],
    "nori": ["heal", "pull", "mobility"],
    "ollie": ["pierce", "pull", "mobility"],
    "otis": ["decay", "silence"],
    "pam": ["heal", "spawnable"],
    "pearl": ["heal", "decay"],
    "penny": ["decay", "pierce", "spawnable"],
    "pierce": ["pierce", "shield", "slow", "knockback"],
    "piper": ["knockback", "mobility", "wallbreak"],
    "poco": ["heal"],
    "primo": ["decay", "knockback", "mobility", "wallbreak"],
    "rt": ["mobility"],
    "rico": ["pierce", "bounce", "spawnable"],
    "rosa": ["shield"],
    "ruffs": ["bounce", "spawnable"],
    "sam": ["heal", "pierce", "pull", "mobility"],
    "sandy": ["heal", "pierce", "mobility", "invisibility"],
    "shade": ["mobility"],
    "shelly": ["invulnerability", "knockback", "mobility", "wallbreak"],
    "sirius": ["spawnable"],
    "spike": ["heal", "slow", "root", "spawnable"],
    "sprout": ["heal", "bounce", "spawnable"],
    "squeak": ["slow", "reveal"],
    "starrnova": [],
    "stu": ["decay", "mobility", "wallbreak"],
    "surge": ["knockback", "mobility"],
    "tara": ["pierce", "pull", "spawnable", "reveal"],
    "tick": ["knockback", "wallbreak", "spawnable"],
    "trunk": ["bounce", "mobility", "spawnable"],
    "wendy": ["antiheal", "shield", "slow", "mobility"],
    "willow": ["heal", "decay"],
    "ziggy": []
};

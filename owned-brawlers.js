/* =========================
   OWNED BRAWLERS
   Only brawlers in this list are shown as suggested counters / team picks —
   no point recommending one you don't have yet. Add names here as you
   unlock/max more brawlers (lowercase, matching the brawler's key).
========================= */

const ownedBrawlers = new Set([
    "rosa", "bibi", "frank", "kenji", "mortis", "8bit", "bull", "edgar",
    "darryl", "buzz", "rico", "colette", "emz", "primo", "brock", "bea",
    "colt", "griff", "damian", "nani", "stu", "carl", "crow", "byron",
    "shelly", "gene", "max", "leon", "sprout", "dyna", "ruffs", "spike",
    "gale", "belle", "sandy", "bo", "nita", "lou", "squeak", "jessie",
    "mina", "barley", "penny", "poco", "gray", "meg", "pierce", "alli",
    "najia", "bolt", "wendy", "surge"
].map(normalize));
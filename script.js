let selectedIndex = -1;
let selectedBrawlers = [];   // enemies
let selectedAllies = [];     // teammates already picked
const SHOW_TAGS = false;     // flip to true when brawler tags are ready
const MAX_ENEMIES = 3;
const MAX_ALLIES = 2;        // 3v3: you + 2 teammates
const CHECK_IMAGES = true;   // data checker also tests that every image file loads

/* View state: lets "Back" return from a class/tier list to the search
   results you came from, instead of wiping the search. */
let inSearchView = false;
let returnToSearch = false;

/* Searched brawlers whose row currently also shows UNOWNED counters
   (toggled with the row button or Shift+number). */
const showUnownedFor = new Set();

/* =========================
   HELPERS
========================= */
function normalize(s) {
    return (s || "")
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, ""); // strip spaces AND hyphens entirely — keys have neither
}

function capitalize(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
}

function getClass(name) {
    return brawlerClass[normalize(name)] || null;
}

/* Strategy text for a brawler. brawlerInfo values are arrays, and an
   entry like [""] is truthy but empty — treat that as "no info". */
function getInfoText(name) {
    const raw = data[name] && data[name].info;
    const text = Array.isArray(raw) ? raw.join(" ") : (raw || "");
    return text.trim();
}

/* =========================
   CLASS EMOJI
========================= */
const classEmoji = {
    "thrower": "💥",
    "tank": "🛡️",
    "assassin": "⚡",
    "antitank": "⚔️",
    "sniper": "🎯",
    "control": "🌀"
};

/* =========================
   KIT TAG BADGES
   Returns nothing while SHOW_TAGS is false.
========================= */
function tagBadges(name) {
    if (!SHOW_TAGS) return "";

    const n = normalize(name);
    const tags = brawlerTags[n] || [];
    if (tags.length === 0) return "";

    const titleText = tags.map(t => tagLabel[t] || t).join(", ");

    return `
        <div class="tag-badges" title="${titleText}">
            ${tags.map(t => `<span class="tag-badge">${tagEmoji[t] || ""}</span>`).join("")}
        </div>
    `;
}

/* =========================
   CLASS MATCHUP CHART
========================= */
const classMatchups = {
    thrower: {
        strongAgainst: ["control", "antitank", "sniper"],
        weakAgainst: ["assassin"]
    },

    tank: {
        strongAgainst: ["assassin"],
        weakAgainst: ["antitank", "control"]
    },

    assassin: {
        strongAgainst: ["thrower", "sniper", "control"],
        weakAgainst: ["tank", "antitank"]
    },

    antitank: {
        strongAgainst: ["tank", "assassin"],
        weakAgainst: ["sniper", "thrower", "control"]
    },

    sniper: {
        strongAgainst: ["antitank"],
        weakAgainst: ["assassin", "thrower"]
    },

    control: {
        strongAgainst: ["tank", "antitank"],
        weakAgainst: ["thrower", "assassin"]
    }
};

/* Clickable class pill → opens that class's brawler list */
function classPill(cls) {
    return `<span class="class-pill clickable" onclick="browseClass('${cls}')" title="Show all ${capitalize(cls)} brawlers">${classEmoji[cls] || ""} ${capitalize(cls)}</span>`;
}

/* Clickable tier tag → opens that tier's brawler list */
function tierTagButton(tier) {
    return `<span class="tier-tag tier-${tier.replace('+', 'plus')} clickable" onclick="browseTier('${tier}')" title="Show all tier ${tier} brawlers">${tier}</span>`;
}

/* Pill variant showing a signed net score (+/-), color-coded
   green/red/neutral, used by the Class Matchups calculator. Clickable. */
function classPillWithNetScore(cls, score) {
    const sign = score > 0 ? "net-positive" : score < 0 ? "net-negative" : "net-neutral";
    const display = score > 0 ? `+${score}` : `${score}`;
    return `<span class="class-pill clickable ${sign}" onclick="browseClass('${cls}')" title="Show all ${capitalize(cls)} brawlers">${classEmoji[cls] || ""} ${capitalize(cls)} <span class="class-score ${sign}">${display}</span></span>`;
}

/* Net "+1 / -1" calculator (classesPresent WITH multiplicity). */
function getClassCounterScores(classesPresent) {
    const scores = {};
    Object.keys(classMatchups).forEach(cls => { scores[cls] = 0; });

    classesPresent.forEach(enemyCls => {
        Object.keys(classMatchups).forEach(candidate => {
            const info = classMatchups[candidate];
            if (!info) return;
            if ((info.strongAgainst || []).includes(enemyCls)) {
                scores[candidate] += 1;
            }
            if ((info.weakAgainst || []).includes(enemyCls)) {
                scores[candidate] -= 1;
            }
        });
    });

    return scores;
}

function isOwned(name) {
    return ownedBrawlers.has(normalize(name));
}

/* Renders a list of icon-label items with a tiny divider bar inserted
   wherever the class changes from one item to the next. */
function withClassDividers(keys, renderFn) {
    let html = "";
    let lastClass = null;

    keys.forEach((k, i) => {
        const cls = getClass(k);
        if (i > 0 && cls !== lastClass) {
            html += `<div class="class-divider"></div>`;
        }
        html += renderFn(k);
        lastClass = cls;
    });

    return html;
}

/* =========================
   COUNTER INDEXES (cached)
   Built once, lazily (data.js loads after this file):
     counterSets  : brawler -> Set of brawlers that counter it
     strengthSets : brawler -> Set of brawlers it counters (reverse lookup)
   Sorted lists are cached per sort signature and thrown away only when
   the sort mode (or, in score mode, the class scores) changes.
========================= */
const counterSets = new Map();
const strengthSets = new Map();
let indexesBuilt = false;

function buildIndexes() {
    if (indexesBuilt) return;
    indexesBuilt = true;

    Object.keys(data).forEach(b => {
        const list = [...(data[b].main || []), ...(data[b].alt || [])]
            .map(normalize)
            .filter(c => c && data[c]); // unknown names are ignored (the data checker reports them)
        counterSets.set(b, new Set(list));
        strengthSets.set(b, new Set());
    });

    counterSets.forEach((set, brawler) => {
        set.forEach(counter => {
            if (counter !== brawler) strengthSets.get(counter).add(brawler);
        });
    });
}

let sortCacheSig = "";
const sortedCountersCache = new Map();
const sortedStrengthsCache = new Map();

function sortSignature() {
    if (sortMode !== "score") return sortMode;
    return "score:" + classOrder.map(c => lastClassScores[c] || 0).join(",");
}

function syncSortCache() {
    const sig = sortSignature();
    if (sig !== sortCacheSig) {
        sortCacheSig = sig;
        sortedCountersCache.clear();
        sortedStrengthsCache.clear();
    }
}

/* =========================
   SORTING
========================= */
function tierRank(name) {
    const t = getTier(name);
    const idx = tierOrder.indexOf(t);
    return idx === -1 ? tierOrder.length : idx; // unranked brawlers sort last
}

/* Risky for a specific row: skip the brawler this counter is meant to beat */
function isRiskyForRow(counterName, rowBrawler, selectedSet) {
    if (selectedSet.size < 2) return false;
    buildIndexes();
    const theirCounters = counterSets.get(normalize(counterName));
    if (!theirCounters) return false;
    return [...selectedSet].some(enemy => enemy !== rowBrawler && theirCounters.has(enemy));
}

/* Risky for the shared "Best Brawlers" box: check against all enemies */
function isRiskyGlobal(counterName, selectedSet) {
    if (selectedSet.size < 2) return false;
    buildIndexes();
    const theirCounters = counterSets.get(normalize(counterName));
    if (!theirCounters) return false;
    return [...selectedSet].some(enemy => theirCounters.has(enemy));
}

/* Default sort mode is "score". Cycles score -> class -> tier -> score. */
let sortMode = "score"; // "score", "class" or "tier"
const sortModeCycle = ["score", "class", "tier"];

function classRank(name) {
    const cls = getClass(name);
    const idx = classOrder.indexOf(cls);
    return idx === -1 ? classOrder.length : idx;
}

/* "score" sort mode: rank by the net score shown in the Class Matchups
   calculator for the currently searched composition (higher = first).
   Refreshed every time renderClassCounters runs; empty (all ties) when
   nothing is searched, in which case class order / tier take over. */
let lastClassScores = {};

function scoreRank(name) {
    const cls = getClass(name);
    if (!cls) return 999;
    const score = lastClassScores[cls] || 0;
    return -score; // higher score -> lower (better) rank number
}

function currentRank(name) {
    if (sortMode === "tier") return tierRank(name);
    if (sortMode === "score") return scoreRank(name);
    return classRank(name);
}

function secondaryRank(name) {
    if (sortMode === "class") return tierRank(name);
    return classRank(name); // "tier" and "score": keep classes grouped together
}

/* One comparator used everywhere, so equal scores/tiers still end up
   grouped by class and then ordered by tier. */
function compareBrawlers(a, b) {
    return (currentRank(a) - currentRank(b))
        || (secondaryRank(a) - secondaryRank(b))
        || (tierRank(a) - tierRank(b))
        || (classRank(a) - classRank(b))
        || a.localeCompare(b);
}

/* Brawlers that counter b, deduped, sorted by the current sort mode (cached) */
function getCombinedCounters(b) {
    buildIndexes();
    syncSortCache();

    let result = sortedCountersCache.get(b);
    if (!result) {
        result = [...(counterSets.get(b) || [])].sort(compareBrawlers);
        sortedCountersCache.set(b, result);
    }
    return result;
}

function sortModeLabel(mode) {
    if (mode === "tier") return "Sort by Tier 📉";
    if (mode === "score") return "Sort by Matchup Score 📊";
    return "Sort by Class 🔰";
}

function toggleSortMode() {
    const idx = sortModeCycle.indexOf(sortMode);
    sortMode = sortModeCycle[(idx + 1) % sortModeCycle.length];

    if (selectedBrawlers.length > 0 && inSearchView && !returnToSearch) {
        findCounters(); // re-render with the new sort applied (also refreshes the button label)
    }
}

/* =========================
   SEARCH PANELS (hide/show helpers)
========================= */
function hideSearchPanels() {
    ["shared", "classCounters", "allyPanel"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

/* =========================
   RESULTS GRID (shared by class-browse, tier-browse, tag-browse)
========================= */
function renderResultsGrid(title, keys, sortFn) {
    closeInfoModal();

    if (inSearchView) returnToSearch = true; // Back will return to the search

    document.getElementById("topUI").classList.add("hidden");
    document.getElementById("input").blur();
    document.getElementById("backBtn").style.display = "inline-block";

    hideSearchPanels();

    const resultDiv = document.getElementById("result");

    if (keys.length === 0) {
        resultDiv.innerHTML = `<div class="tiny-name">No brawlers found for "${title}".</div>`;
        return;
    }

    const sorted = sortFn ? [...keys].sort(sortFn) : keys;

    resultDiv.innerHTML = `
        <div class="shared-box browse-results">
            <div class="shared-title">${title} (${sorted.length})</div>
            <div class="shared-columns">
                ${sorted.map(k => iconLabel(k)).join("")}
            </div>
        </div>
    `;
}

function browseClass(cls) {
    const keys = Object.keys(data).filter(k => getClass(k) === cls);
    const label = capitalize(cls);
    // within this class, sort by tier order
    renderResultsGrid(label, keys, (a, b) => {
        const diff = tierRank(a) - tierRank(b);
        return diff !== 0 ? diff : a.localeCompare(b);
    });
}

function browseTier(tier) {
    const keys = Object.keys(data).filter(k => getTier(k) === tier);
    renderResultsGrid(`Tier ${tier}`, keys, (a, b) => {
        const diff = classRank(a) - classRank(b);
        return diff !== 0 ? diff : a.localeCompare(b);
    });
}

/* Browse the roster by kit tag (knockback, wallbreak, etc.) */
function browseTag(tag) {
    if (!SHOW_TAGS) return;

    const keys = Object.keys(data).filter(k => (brawlerTags[k] || []).includes(tag));
    const label = `${tagEmoji[tag] || ""} ${tagLabel[tag] || tag}`;
    renderResultsGrid(label, keys, (a, b) => {
        const diff = tierRank(a) - tierRank(b);
        return diff !== 0 ? diff : a.localeCompare(b);
    });
}

/* Builds the tag-browse chip row once the page loads and inserts it right
   after the existing class-browse bar — no index.html edits needed. */
function renderTagBrowseBar() {
    if (!SHOW_TAGS) return;
    if (document.getElementById("tagBrowseBar")) return;
    const browseBar = document.querySelector(".browse-bar");
    if (!browseBar) return;

    const bar = document.createElement("div");
    bar.id = "tagBrowseBar";
    bar.className = "browse-bar browse-tags";
    bar.innerHTML = Object.keys(tagEmoji).map(t => `
        <span class="browse-chip tag-chip" onclick="browseTag('${t}')">${tagEmoji[t]} ${tagLabel[t]}</span>
    `).join("");

    browseBar.parentNode.insertBefore(bar, browseBar.nextSibling);
}

/* Relabel the Database section + input placeholder. */
function updateDatabaseLabel() {
    document.querySelectorAll(".section-label").forEach(el => {
        if (el.textContent.includes("Database")) {
            el.textContent = SHOW_TAGS
                ? "📚 Database — Brawler Profiles & Kit Browser"
                : "📚 Database — Brawler Profiles";
        }
    });

    const strengthInput = document.getElementById("strengthInput");
    if (strengthInput) {
        strengthInput.placeholder = "Search a brawler for its full profile";
    }
}

/* =========================
   BRAWLER PROFILE / POPUP CONTENT
   Shared by the Database profile view and the click-a-brawler popup, so
   both look identical: header (portrait, class, tier, tags) plus the
   Weakness (red) / Strength (green) panels built from the same icon
   lists used everywhere else.
========================= */
function brawlerHeader(key) {
    const cls = getClass(key);
    const tier = getTier(key);
    const tags = SHOW_TAGS ? (brawlerTags[key] || []) : [];

    return `
        <div class="profile-header">
            <div class="img-wrap">
                <img src="${data[key].img}" class="brawler-img ${cls}">
                ${tagBadges(key)}
            </div>
            <div class="profile-title">
                <div class="profile-name">${capitalize(key)}</div>
                <div class="profile-meta">
                    ${cls ? classPill(cls) : ""}
                    ${tier ? tierTagButton(tier) : ""}
                </div>
                ${tags.length ? `<div class="profile-meta">${tags.map(t => `<span class="class-pill clickable" onclick="browseTag('${t}')">${tagEmoji[t] || ""} ${tagLabel[t] || t}</span>`).join("")}</div>` : ""}
            </div>
        </div>
    `;
}

function matchupPanels(key) {
    const counters = getCombinedCounters(key);   // brawlers that counter this one
    const strengths = getStrengths(key);          // brawlers this one counters

    return `
        <div class="profile-columns">
            <div class="popup-section popup-countered profile-section">
                <div class="shared-title">Weakness (${counters.length})</div>
                <div class="shared-columns">
                    ${counters.length ? counters.map(c => iconLabel(c)).join("") : "<div class='tiny-name'>None</div>"}
                </div>
            </div>
            <div class="popup-section popup-strengths profile-section">
                <div class="shared-title">Strength (${strengths.length})</div>
                <div class="shared-columns">
                    ${strengths.length ? strengths.map(c => iconLabel(c)).join("") : "<div class='tiny-name'>None</div>"}
                </div>
            </div>
        </div>
    `;
}

function renderBrawlerProfile(key) {
    closeInfoModal();

    document.getElementById("topUI").classList.add("hidden");
    document.getElementById("input").blur();
    document.getElementById("backBtn").style.display = "inline-block";

    hideSearchPanels();

    document.getElementById("result").innerHTML = `
        <div class="shared-box browse-results profile-box">
            ${brawlerHeader(key)}
            ${matchupPanels(key)}
        </div>
    `;
}

/* =========================
   STRENGTHS DATABASE
   Reverse lookup (cached): who does a given brawler counter / beat?
========================= */
function getStrengths(name) {
    const n = normalize(name);
    if (!data[n]) return [];

    buildIndexes();
    syncSortCache();

    let result = sortedStrengthsCache.get(n);
    if (!result) {
        result = [...(strengthSets.get(n) || [])].sort(compareBrawlers);
        sortedStrengthsCache.set(n, result);
    }
    return result;
}

function searchStrengths(rawName) {
    const key = normalize(rawName);

    if (!data[key]) {
        showInputError(`Unknown brawler: "${rawName}"`, "strengthInputError");
        return;
    }

    clearInputError("strengthInputError");
    document.getElementById("strengthInput").value = "";
    document.getElementById("strengthSuggestions").innerHTML = "";
    document.getElementById("strengthSuggestions").style.display = "none";

    renderBrawlerProfile(key);
}

function searchStrengthsFromInput() {
    const raw = document.getElementById("strengthInput").value.trim();

    if (!raw) {
        showInputError("Enter a brawler to search", "strengthInputError");
        return;
    }

    const key = normalize(raw);
    if (!data[key]) {
        showInputError(`Unknown brawler: "${raw}"`, "strengthInputError");
        return;
    }

    searchStrengths(key);
}

let strengthSelectedIndex = -1;

function showStrengthSuggestions() {
    const input = document.getElementById("strengthInput");
    const box = document.getElementById("strengthSuggestions");
    const currentRaw = input.value.toLowerCase().trim();

    box.innerHTML = "";
    strengthSelectedIndex = -1;
    clearInputError("strengthInputError");

    if (!currentRaw) {
        box.style.display = "none";
        return;
    }

    const matches = Object.keys(data)
        .filter(n => n.toLowerCase().startsWith(currentRaw))
        .sort()
        .slice(0, 6);

    box.style.display = matches.length > 0 ? "block" : "none";

    matches.forEach(name => {
        const div = document.createElement("div");

        div.innerHTML = `
            <img src="${data[name].img}" class="brawler-img ${getClass(name)}">
            <span class="${getClass(name)}">${capitalize(name)}</span>
        `;

        div.dataset.name = name;
        div.onclick = () => searchStrengths(name);
        box.appendChild(div);
    });
}

function handleStrengthKeyDown(e) {
    const box = document.getElementById("strengthSuggestions");
    const items = box.querySelectorAll("div");

    if (items.length > 0) {
        if (e.key === "ArrowDown") {
            strengthSelectedIndex = (strengthSelectedIndex + 1) % items.length;
            items.forEach((el, i) => el.classList.toggle("active", i === strengthSelectedIndex));
            e.preventDefault();
        }

        if (e.key === "ArrowUp") {
            strengthSelectedIndex = (strengthSelectedIndex - 1 + items.length) % items.length;
            items.forEach((el, i) => el.classList.toggle("active", i === strengthSelectedIndex));
            e.preventDefault();
        }

        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            const chosen = strengthSelectedIndex >= 0 ? items[strengthSelectedIndex].dataset.name : items[0].dataset.name;
            searchStrengths(chosen);
        }

        return;
    }

    if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        searchStrengthsFromInput();
    }
}

/* =========================
   TIER LIST DISPLAY
========================= */
let tierListBuilt = false;

function toggleTierList() {
    const container = document.getElementById("tierListDisplay");
    const btn = document.getElementById("tierListToggleBtn");
    if (!container || !btn) return;

    const isShowing = container.style.display !== "none";

    if (isShowing) {
        container.style.display = "none";
        btn.textContent = "Show Tier List";
        return;
    }

    if (!tierListBuilt) {
        renderTierListDisplay();
        tierListBuilt = true;
    }

    container.style.display = "flex";
    btn.textContent = "Hide Tier List";
}

function renderTierListDisplay() {
    const container = document.getElementById("tierListDisplay");
    if (!container) return;

    container.innerHTML = tierOrder.map(tier => {
        const keys = Object.keys(data)
            .filter(k => getTier(k) === tier)
            .sort((a, b) => {
                const diff = classRank(a) - classRank(b);
                return diff !== 0 ? diff : a.localeCompare(b);
            });

        if (keys.length === 0) return "";

        return `
            <div class="tier-row">
                <div class="tier-row-label tier-${tier.replace('+', 'plus')}">${tier}</div>
                <div class="tier-row-icons">
                    ${withClassDividers(keys, tierIconLabel)}
                </div>
            </div>
        `;
    }).join("");
}

function tierIconLabel(name) {
    const n = normalize(name);
    if (!data[n]) return "";
    const cls = getClass(n);

    return `
        <div class="icon-label" onclick="showBrawlerPopup('${n}')">
            <div class="img-wrap">
                <img src="${data[n].img}" class="brawler-img ${cls}">
                ${tagBadges(n)}
            </div>
            <div class="tiny-name">${capitalize(n)}</div>
        </div>
    `;
}

/* =========================
   ICON + LABEL BLOCK
========================= */
function iconLabel(name, isBest = false, isRisky = false, isUnowned = false) {
    const n = normalize(name);
    if (!data[n]) return "";
    const cls = getClass(n);
    const tier = getTier(n);

    return `
        <div class="icon-label info-container ${isBest ? "best-pick" : ""} ${isRisky ? "risky-pick" : ""} ${isUnowned ? "unowned-pick" : ""}" onclick="showBrawlerPopup('${n}')">
            <div class="img-wrap">
                <img src="${data[n].img}" class="brawler-img ${cls}">
                ${isRisky ? `<span class="risky-badge">⛔</span>` : ""}
                ${isUnowned ? `<span class="unowned-badge">🔒</span>` : ""}
                ${tagBadges(n)}
            </div>
            <div class="tiny-name">${capitalize(n)}</div>
            ${tier ? `<div class="tier-tag tier-${tier.replace('+', 'plus')}">${tier}</div>` : ""}
        </div>
    `;
}

function toggleInfo(e, el) {
    e.stopPropagation();
    const wrap = el.closest(".info-container");
    const box = wrap.querySelector(".info-box");
    openInfoModal(box.textContent);
    openInfoIndex = null; // opened via click, not number key — no index to track
}

let openInfoIndex = null; // tracks which numbered brawler's info is currently showing

function setModalWide(isWide) {
    const box = document.querySelector("#infoModal .info-modal-box");
    if (!box) return;
    box.classList.toggle("wide", isWide);
    box.scrollTop = 0;
}

/* Plain-text strategy info (the "i" button / number keys) */
function openInfoModal(text) {
    const modal = document.getElementById("infoModal");
    const modalText = document.getElementById("infoModalText");
    setModalWide(false);
    modalText.textContent = text;
    modal.style.display = "flex";
}

/* Popup for any clicked brawler icon: same header + Weakness/Strength
   icon panels as the Database profile. Clicking an icon inside it swaps
   the popup to that brawler. */
function showBrawlerPopup(name) {
    const n = normalize(name);
    if (!data[n]) return;

    const modal = document.getElementById("infoModal");
    const modalText = document.getElementById("infoModalText");

    setModalWide(true);
    modalText.innerHTML = brawlerHeader(n) + matchupPanels(n);

    modal.style.display = "flex";
    openInfoIndex = null;
}

function closeInfoModal() {
    document.getElementById("infoModal").style.display = "none";
    openInfoIndex = null;
}

function openInfoByIndex(idx) {
    const b = currentBrawlers[idx];
    if (!b || !data[b] || !getInfoText(b)) return;

    // Pressing the same number again closes it
    if (openInfoIndex === idx) {
        closeInfoModal();
        return;
    }

    const rows = document.querySelectorAll("#result .row");
    const row = rows[idx];
    if (!row) return;

    const box = row.querySelector(".info-box");
    if (!box) return;

    openInfoModal(box.textContent);
    openInfoIndex = idx;
}

/* Show/hide UNOWNED counters on one searched brawler's row */
function toggleUnowned(idx) {
    if (!inSearchView || returnToSearch) return;

    const b = currentBrawlers[idx];
    if (!b) return;

    if (showUnownedFor.has(b)) showUnownedFor.delete(b);
    else showUnownedFor.add(b);

    findCounters();
}

document.addEventListener("click", () => {
    document.querySelectorAll(".info-box.open").forEach(b => b.classList.remove("open"));
});

/* =========================
   INPUT ERROR HELPERS
========================= */
function showInputError(msg, id = "inputError") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
}

function clearInputError(id = "inputError") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
}

/* =========================
   CHIPS (selected enemies + allies)
========================= */
function chipHTML(key, removeFn) {
    return `
        <div class="chip">
            <img src="${data[key].img}" class="chip-img ${getClass(key)}">
            <span>${capitalize(key)}</span>
            <button class="chip-remove" onclick="${removeFn}('${key}')">&times;</button>
        </div>
    `;
}

/* "Enemies 2/3 · Allies 1/2" note (uses the #teamSizeNote element that
   already exists in index.html) */
function updateTeamNote() {
    const el = document.getElementById("teamSizeNote");
    if (!el) return;

    if (selectedBrawlers.length === 0 && selectedAllies.length === 0) {
        el.style.display = "none";
        return;
    }

    el.textContent = `⚔️ Enemies ${selectedBrawlers.length}/${MAX_ENEMIES} · 🤝 Allies ${selectedAllies.length}/${MAX_ALLIES}`;
    el.style.display = "block";
}

function renderChips() {
    const chipsBox = document.getElementById("chips");
    chipsBox.innerHTML = selectedBrawlers.map(key => chipHTML(key, "removeBrawler")).join("");
    updateTeamNote();
}

function addBrawler(rawName) {
    const key = normalize(rawName);
    const input = document.getElementById("input");
    const box = document.getElementById("suggestions");

    if (!data[key]) {
        showInputError(`Unknown brawler: "${rawName}"`);
        return;
    }

    if (selectedBrawlers.includes(key)) {
        showInputError(`${capitalize(key)} is already added`);
        input.value = "";
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }

    if (selectedAllies.includes(key)) {
        showInputError(`${capitalize(key)} is already one of your allies`);
        input.value = "";
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }

    if (selectedBrawlers.length >= MAX_ENEMIES) {
        showInputError(`Max ${MAX_ENEMIES} enemies — remove one first`);
        input.value = "";
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }

    selectedBrawlers.push(key);
    clearInputError();

    input.value = "";
    box.innerHTML = "";
    box.style.display = "none";
    selectedIndex = -1;

    renderChips();
    input.focus();
}

function removeBrawler(key) {
    selectedBrawlers = selectedBrawlers.filter(b => b !== key);
    clearInputError();
    renderChips();
    document.getElementById("input").focus();
}

/* =========================
   AUTOCOMPLETE (icon + name) — enemies
========================= */
function showSuggestions() {
    const input = document.getElementById("input");
    const box = document.getElementById("suggestions");

    const currentRaw = input.value.toLowerCase().trim();

    box.innerHTML = "";
    selectedIndex = -1;
    clearInputError();

    if (!currentRaw) {
        box.style.display = "none";
        return;
    }

    if (selectedBrawlers.length >= MAX_ENEMIES) {
        showInputError(`Max ${MAX_ENEMIES} enemies — remove one first`);
        box.style.display = "none";
        return;
    }

    const matches = Object.keys(data)
        .filter(n => n.toLowerCase().startsWith(currentRaw)
            && !selectedBrawlers.includes(n)
            && !selectedAllies.includes(n))
        .sort()
        .slice(0, 6);

    box.style.display = matches.length > 0 ? "block" : "none";

    matches.forEach(name => {
        const div = document.createElement("div");

        div.innerHTML = `
            <img src="${data[name].img}" class="brawler-img ${getClass(name)}">
            <span class="${getClass(name)}">${capitalize(name)}</span>
        `;

        div.dataset.name = name;
        div.onclick = () => addBrawler(name);
        box.appendChild(div);
    });
}

/* =========================
   KEY HANDLING — enemy input
========================= */
function handleKeyDown(e) {
    const box = document.getElementById("suggestions");
    const items = box.querySelectorAll("div");

    if (items.length > 0) {

        if (e.key === "ArrowDown") {
            selectedIndex = (selectedIndex + 1) % items.length;
            updateActive(items);
            e.preventDefault();
        }

        if (e.key === "ArrowUp") {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateActive(items);
            e.preventDefault();
        }

        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();

            const chosen =
                selectedIndex >= 0
                    ? items[selectedIndex].dataset.name
                    : items[0].dataset.name;

            addBrawler(chosen);
        }

        return;
    }

    if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById("input");
        const raw = input.value.trim();

        if (!raw) {
            if (selectedBrawlers.length > 0) {
                findCounters();
            }
            return;
        }

        const key = normalize(raw);
        if (data[key]) {
            addBrawler(key);
        } else {
            showInputError(`Unknown brawler: "${raw}"`);
        }
    }
}

function updateActive(items) {
    items.forEach((el, i) => {
        el.classList.toggle("active", i === selectedIndex);
    });
}

/* =========================
   ALLIES (teammates already picked)
   The ally section is injected into the page by injectAllyUI(), so
   index.html needs no edits. Allies are never offered as counters (a
   team can't have the same brawler twice) and get their own matchup
   panel in the results.
========================= */
let allyIndex = -1;

function renderAllyChips() {
    const chipsBox = document.getElementById("allyChips");
    if (chipsBox) {
        chipsBox.innerHTML = selectedAllies.map(key => chipHTML(key, "removeAlly")).join("");
    }
    updateTeamNote();
}

function hideAllySuggestions() {
    const box = document.getElementById("allySuggestions");
    if (!box) return;
    box.innerHTML = "";
    box.style.display = "none";
}

function addAlly(rawName) {
    const key = normalize(rawName);
    const input = document.getElementById("allyInput");

    if (!data[key]) {
        showInputError(`Unknown brawler: "${rawName}"`, "allyInputError");
        return;
    }

    let error = null;
    if (selectedAllies.includes(key)) error = `${capitalize(key)} is already an ally`;
    else if (selectedBrawlers.includes(key)) error = `${capitalize(key)} is already an enemy`;
    else if (selectedAllies.length >= MAX_ALLIES) error = `Max ${MAX_ALLIES} allies — remove one first`;

    if (error) {
        showInputError(error, "allyInputError");
        input.value = "";
        hideAllySuggestions();
        return;
    }

    selectedAllies.push(key);
    clearInputError("allyInputError");

    input.value = "";
    hideAllySuggestions();
    allyIndex = -1;

    renderAllyChips();
    input.focus();
}

function removeAlly(key) {
    selectedAllies = selectedAllies.filter(a => a !== key);
    clearInputError("allyInputError");
    renderAllyChips();
    document.getElementById("allyInput").focus();
}

function addAllyFromInput() {
    const raw = document.getElementById("allyInput").value.trim();
    if (!raw) {
        showInputError("Enter an ally to add", "allyInputError");
        return;
    }
    addAlly(raw);
}

function showAllySuggestions() {
    const input = document.getElementById("allyInput");
    const box = document.getElementById("allySuggestions");
    const currentRaw = input.value.toLowerCase().trim();

    box.innerHTML = "";
    allyIndex = -1;
    clearInputError("allyInputError");

    if (!currentRaw) {
        box.style.display = "none";
        return;
    }

    if (selectedAllies.length >= MAX_ALLIES) {
        showInputError(`Max ${MAX_ALLIES} allies — remove one first`, "allyInputError");
        box.style.display = "none";
        return;
    }

    const matches = Object.keys(data)
        .filter(n => n.toLowerCase().startsWith(currentRaw)
            && !selectedAllies.includes(n)
            && !selectedBrawlers.includes(n))
        .sort()
        .slice(0, 6);

    box.style.display = matches.length > 0 ? "block" : "none";

    matches.forEach(name => {
        const div = document.createElement("div");

        div.innerHTML = `
            <img src="${data[name].img}" class="brawler-img ${getClass(name)}">
            <span class="${getClass(name)}">${capitalize(name)}</span>
        `;

        div.dataset.name = name;
        div.onclick = () => addAlly(name);
        box.appendChild(div);
    });
}

function handleAllyKeyDown(e) {
    const box = document.getElementById("allySuggestions");
    const items = box.querySelectorAll("div");

    if (items.length > 0) {
        if (e.key === "ArrowDown") {
            allyIndex = (allyIndex + 1) % items.length;
            items.forEach((el, i) => el.classList.toggle("active", i === allyIndex));
            e.preventDefault();
        }

        if (e.key === "ArrowUp") {
            allyIndex = (allyIndex - 1 + items.length) % items.length;
            items.forEach((el, i) => el.classList.toggle("active", i === allyIndex));
            e.preventDefault();
        }

        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            const chosen = allyIndex >= 0 ? items[allyIndex].dataset.name : items[0].dataset.name;
            addAlly(chosen);
        }

        return;
    }

    if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const raw = document.getElementById("allyInput").value.trim();

        if (!raw) {
            if (selectedBrawlers.length > 0) findCounters();
            return;
        }

        addAlly(raw);
    }
}

function injectAllyUI() {
    if (document.getElementById("allyInput")) return;

    const topUI = document.getElementById("topUI");
    if (!topUI) return;

    const wrap = document.createElement("div");
    wrap.id = "allySection";
    wrap.innerHTML = `
        <div class="section-divider"><span class="section-label">🤝 Allies (optional, max ${MAX_ALLIES}) — teammates already picked</span></div>
        <div class="autocomplete-box">
            <div id="allyChips" class="chips"></div>
            <div class="input-wrap">
                <input id="allyInput" placeholder="Add an ally">
                <button class="enter-btn" id="allyEnterBtn" aria-label="Add ally">+</button>
            </div>
            <div id="allySuggestions" class="suggestions"></div>
            <div id="allyInputError" class="input-error"></div>
        </div>
    `;

    // Goes right before the Database section
    const firstDivider = topUI.querySelector(".section-divider");
    topUI.insertBefore(wrap, firstDivider);

    document.getElementById("allyInput").addEventListener("input", showAllySuggestions);
    document.getElementById("allyInput").addEventListener("keydown", handleAllyKeyDown);
    document.getElementById("allyEnterBtn").addEventListener("click", addAllyFromInput);

    // Panel that shows how your allies match up in the results view
    const shared = document.getElementById("shared");
    if (shared && !document.getElementById("allyPanel")) {
        const panel = document.createElement("div");
        panel.id = "allyPanel";
        panel.className = "shared-box ally-panel";
        panel.style.display = "none";
        shared.parentNode.insertBefore(panel, shared);
    }
}

/* Per-ally matchup vs the searched enemies, plus which classes your team
   doesn't have yet (ranked by the same net score as Class Matchups). */
function renderAllyPanel(enemies) {
    const box = document.getElementById("allyPanel");
    if (!box) return;

    if (selectedAllies.length === 0) {
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }

    buildIndexes();

    const scores = lastClassScores;
    const hasScores = Object.keys(scores).length > 0;
    const allyClasses = new Set(selectedAllies.map(getClass).filter(Boolean));
    const names = list => list.map(capitalize).join(", ");

    const cards = selectedAllies.map(ally => {
        const cls = getClass(ally);
        // enemy's counter list contains the ally  =>  ally beats that enemy
        const beats = enemies.filter(e => counterSets.get(e) && counterSets.get(e).has(ally));
        // ally's counter list contains the enemy  =>  enemy beats the ally
        const losesTo = enemies.filter(e => counterSets.get(ally) && counterSets.get(ally).has(e));

        const lines = [];
        if (beats.length) lines.push(`<div class="ally-line good">✅ Counters ${names(beats)}</div>`);
        if (losesTo.length) lines.push(`<div class="ally-line bad">⚠️ Countered by ${names(losesTo)}</div>`);
        if (!beats.length && !losesTo.length) lines.push(`<div class="ally-line">No direct matchup with these enemies</div>`);

        return `
            <div class="ally-card">
                ${iconLabel(ally)}
                <div class="ally-info">
                    ${cls && hasScores ? classPillWithNetScore(cls, scores[cls] || 0) : ""}
                    ${lines.join("")}
                </div>
            </div>
        `;
    }).join("");

    const fill = hasScores
        ? Object.keys(scores)
            .filter(c => !allyClasses.has(c))
            .sort((a, b) => scores[b] - scores[a])
            .slice(0, 2)
        : [];

    const fillHtml = fill.length
        ? `<div class="ally-fill">Best class to add (not on your team yet): ${fill.map(c => classPillWithNetScore(c, scores[c])).join("")}</div>`
        : "";

    box.style.display = "block";
    box.innerHTML = `
        <div class="shared-title">🤝 Your Team vs This Comp</div>
        <div class="ally-cards">${cards}</div>
        ${fillHtml}
    `;
}

/* =========================
   CLASS COUNTER SECTION
   Net +1/-1 calculator (see getClassCounterScores). Each class pill
   is clickable and opens that class's list.
========================= */
function renderClassCounters(brawlers) {
    const box = document.getElementById("classCounters");
    if (!box) return;

    const classesPresent = brawlers.map(getClass).filter(Boolean); // multiplicity kept on purpose

    if (classesPresent.length === 0) {
        lastClassScores = {};
        box.style.display = "none";
        return;
    }

    const scores = getClassCounterScores(classesPresent);
    lastClassScores = scores; // feeds "score" sort mode elsewhere on the page
    const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

    box.style.display = "block";
    box.innerHTML = `
        <div class="matchup-header">
            <div class="shared-title">Class Matchups — Net Score</div>
            <button class="matchup-sort-btn" onclick="toggleSortMode()">${sortModeLabel(sortMode)}</button>
        </div>
        <div class="class-matchup-grid">
            <div class="class-matchup-detail">
                ${ranked.map(cls => classPillWithNetScore(cls, scores[cls])).join("")}
            </div>
        </div>
    `;
}

/* =========================
   MAIN
========================= */
let currentBrawlers = [];

function findCounters() {
    const brawlers = [...new Set(selectedBrawlers)];
    currentBrawlers = brawlers;

    if (brawlers.length === 0) {
        showInputError("Add at least one enemy first");
        return;
    }

    inSearchView = true;
    returnToSearch = false;

    document.getElementById("topUI").classList.add("hidden");
    document.getElementById("input").blur();
    document.getElementById("backBtn").style.display = "inline-block";

    const resultDiv = document.getElementById("result");
    const counterBox = document.getElementById("shared");

    resultDiv.innerHTML = "";
    counterBox.innerHTML = "";

    const selectedSet = new Set(brawlers);          // enemies
    const allySet = new Set(selectedAllies);        // teammates (can't be picked again)
    const isTaken = c => selectedSet.has(c) || allySet.has(c);

    renderClassCounters(brawlers);
    renderAllyPanel(brawlers);

    /* scoreMap tracks, per counter: how many searched brawlers it counters (freq),
       and exactly WHICH searched brawlers those are (sources). Only OWNED
       counters count here. Enemies and allies are dropped entirely. */
    const scoreMap = {};

    for (const b of brawlers) {
        if (!data[b]) continue;

        const counters = getCombinedCounters(b).filter(c => !isTaken(c) && isOwned(c));

        counters.forEach(c => {
            if (!scoreMap[c]) scoreMap[c] = { freq: 0, sources: [] };
            scoreMap[c].freq++;
            scoreMap[c].sources.push(b);
        });
    }

    /* Risky picks sort to the end of the list. */
    const filteredCounters = Object.keys(scoreMap)
        .filter(c => scoreMap[c].freq >= 2)
        .sort((a, b) => {
            const riskyA = isRiskyGlobal(a, selectedSet) ? 1 : 0;
            const riskyB = isRiskyGlobal(b, selectedSet) ? 1 : 0;
            if (riskyA !== riskyB) return riskyA - riskyB;

            if (scoreMap[b].freq !== scoreMap[a].freq) {
                return scoreMap[b].freq - scoreMap[a].freq;
            }

            return compareBrawlers(a, b);
        });

    /* Only show the shared box if there's actually something to show */
    if (filteredCounters.length > 0) {
        counterBox.style.display = "block";
        counterBox.innerHTML = `
            <div class="shared-columns">
                ${withClassDividers(filteredCounters, c => {
                    const isRisky = isRiskyGlobal(c, selectedSet);
                    const sources = scoreMap[c].sources;
                    const sourceNames = sources.map(capitalize).join(", ");

                    return `
                        <div class="shared-col">
                            <div class="mini-sources" title="Strong against: ${sourceNames}">
                                ${sources.map(s => `<img src="${data[s].img}" class="mini-source-img clickable ${getClass(s)}" title="${capitalize(s)}" onclick="showBrawlerPopup('${s}')">`).join("")}
                            </div>
                            ${iconLabel(c, false, isRisky)}
                        </div>
                    `;
                })}
            </div>
        `;
    } else {
        counterBox.style.display = "none";
    }

    /* BOTTOM LIST (ROWS) */
    brawlers.forEach((b, idx) => {
        if (!data[b]) return;

        const showUnowned = showUnownedFor.has(b);
        const allCounters = getCombinedCounters(b).filter(c => !isTaken(c));
        const unownedCount = allCounters.filter(c => !isOwned(c)).length;

        const counters = allCounters.filter(c => showUnowned || isOwned(c));

        // push risky picks to the end of this row's list too
        const nonRisky = counters.filter(n => !isRiskyForRow(n, b, selectedSet));
        const risky = counters.filter(n => isRiskyForRow(n, b, selectedSet));
        const ordered = [...nonRisky, ...risky];

        const icons = withClassDividers(ordered, n => {
            const isBest = scoreMap[normalize(n)]?.freq >= 2;
            const isRisky = isRiskyForRow(n, b, selectedSet);
            return iconLabel(n, isBest, isRisky, !isOwned(n));
        });

        const info = getInfoText(b);
        const shortcut = idx < 9 ? ` (⇧${idx + 1})` : "";
        const unownedBtn = (unownedCount > 0 || showUnowned)
            ? `<button class="unowned-btn ${showUnowned ? "active" : ""}" onclick="toggleUnowned(${idx})" title="Shift+${idx + 1}">🔓 ${showUnowned ? "Hide" : "Show"} unowned${shortcut}</button>`
            : "";

        resultDiv.innerHTML += `
            <div class="row">
                <div class="name info-container">
                    <div class="img-wrap" onclick="showBrawlerPopup('${b}')">
                        <img src="${data[b].img}" class="brawler-img ${getClass(b)}">
                        ${info ? `<span class="info-btn" onclick="toggleInfo(event, this)">i</span>` : ""}
                        ${tagBadges(b)}
                    </div>
                    <div class="tiny-name">
                        ${capitalize(b)}
                    </div>
                    ${unownedBtn}
                    ${info ? `<div class="info-box">${info}</div>` : ""}
                </div>
                <div class="list">
                    ${icons || "<div class='tiny-name'>None</div>"}
                </div>
            </div>
        `;
    });
}

function resetSearch() {
    selectedBrawlers = [];
    selectedAllies = [];
    inSearchView = false;
    returnToSearch = false;
    showUnownedFor.clear();
    lastClassScores = {};
    renderChips();
    renderAllyChips();
    closeInfoModal();

    document.getElementById("result").innerHTML = "";
    document.getElementById("shared").innerHTML = "";
    document.getElementById("shared").style.display = "none";
    document.getElementById("classCounters").innerHTML = "";
    document.getElementById("classCounters").style.display = "none";

    const allyPanel = document.getElementById("allyPanel");
    if (allyPanel) {
        allyPanel.innerHTML = "";
        allyPanel.style.display = "none";
    }

    document.getElementById("backBtn").style.display = "none";
    clearInputError();
    clearInputError("strengthInputError");
    clearInputError("allyInputError");

    const topUI = document.getElementById("topUI");
    topUI.style.display = "";
    requestAnimationFrame(() => topUI.classList.remove("hidden"));

    document.getElementById("input").focus();
}

/* Back: from a class/tier list opened inside a search, return to that
   search; otherwise go all the way back to the start screen. */
function goBack() {
    if (returnToSearch && selectedBrawlers.length > 0) {
        returnToSearch = false;
        findCounters();
        return;
    }
    resetSearch();
}

/* =========================
   OWNED-BRAWLER EDITOR
   Tick which brawlers you own from a popup instead of editing
   owned-brawlers.js. Changes are saved in localStorage.
   - If owned-brawlers.js itself changes later, the file wins (the saved
     copy remembers which version of the file it was based on).
   - "Copy code" gives you the line to paste back into owned-brawlers.js.
========================= */
const OWNED_KEY = "brawlBrawlerOwnedV1";
let ownedFileDefaults = new Set();

function ownedSignature(set) {
    return [...set].sort().join(",");
}

function loadSavedOwned() {
    ownedFileDefaults = new Set(ownedBrawlers);

    try {
        const raw = localStorage.getItem(OWNED_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw);
        if (!saved || saved.base !== ownedSignature(ownedFileDefaults)) return; // file edited since → file wins

        ownedBrawlers.clear();
        (saved.list || []).map(normalize).filter(n => data[n]).forEach(n => ownedBrawlers.add(n));
    } catch (e) {
        /* storage unavailable or corrupt — just use the file */
    }
}

function saveOwned() {
    try {
        localStorage.setItem(OWNED_KEY, JSON.stringify({
            base: ownedSignature(ownedFileDefaults),
            list: [...ownedBrawlers]
        }));
    } catch (e) {
        /* ignore */
    }
}

function updateOwnedBtn() {
    const btn = document.getElementById("ownedEditorBtn");
    if (btn) btn.textContent = `Edit owned brawlers (${ownedBrawlers.size}/${Object.keys(data).length})`;
}

function ownedTile(k) {
    const cls = getClass(k);
    return `
        <div class="owned-tile ${isOwned(k) ? "on" : ""}" data-name="${k}" onclick="toggleOwned('${k}')">
            <div class="img-wrap"><img src="${data[k].img}" class="brawler-img ${cls}"></div>
            <div class="tiny-name">${capitalize(k)}</div>
        </div>
    `;
}

function renderOwnedGrid() {
    const grid = document.getElementById("ownedGrid");
    if (!grid) return;

    const q = normalize(document.getElementById("ownedFilter").value);
    const all = Object.keys(data);

    const groups = [...classOrder, null].map(cls => {
        const keys = all
            .filter(k => (cls ? getClass(k) === cls : !getClass(k)) && (!q || k.includes(q)))
            .sort();

        if (keys.length === 0) return "";

        const title = cls ? `${classEmoji[cls] || ""} ${capitalize(cls)}` : "Other";
        const actions = cls
            ? `<span class="owned-group-actions">
                   <button class="owned-action-btn" onclick="setClassOwned('${cls}', true)">all</button>
                   <button class="owned-action-btn" onclick="setClassOwned('${cls}', false)">none</button>
               </span>`
            : "";

        return `
            <div class="owned-group">
                <div class="owned-group-title">${title} ${actions}</div>
                <div class="shared-columns">${keys.map(ownedTile).join("")}</div>
            </div>
        `;
    }).join("");

    grid.innerHTML = groups || "<div class='tiny-name'>No brawlers match.</div>";
    updateOwnedCount();
}

function updateOwnedCount() {
    const el = document.getElementById("ownedCount");
    if (el) el.textContent = `${ownedBrawlers.size}/${Object.keys(data).length}`;
}

function toggleOwned(k) {
    if (ownedBrawlers.has(k)) ownedBrawlers.delete(k);
    else ownedBrawlers.add(k);

    saveOwned();

    const tile = document.querySelector(`#ownedGrid .owned-tile[data-name="${k}"]`);
    if (tile) tile.classList.toggle("on", ownedBrawlers.has(k));

    updateOwnedCount();
}

function setClassOwned(cls, value) {
    Object.keys(data).filter(k => getClass(k) === cls).forEach(k => {
        if (value) ownedBrawlers.add(k);
        else ownedBrawlers.delete(k);
    });
    saveOwned();
    renderOwnedGrid();
}

function setAllOwned(value) {
    Object.keys(data).forEach(k => {
        if (value) ownedBrawlers.add(k);
        else ownedBrawlers.delete(k);
    });
    saveOwned();
    renderOwnedGrid();
}

function resetOwnedToFile() {
    ownedBrawlers.clear();
    ownedFileDefaults.forEach(n => ownedBrawlers.add(n));
    try { localStorage.removeItem(OWNED_KEY); } catch (e) { /* ignore */ }
    renderOwnedGrid();
}

function copyOwnedCode(btn) {
    const list = [...ownedBrawlers].filter(n => data[n]).sort();
    const code = "const ownedBrawlers = new Set([\n"
        + list.map(n => `    "${n}"`).join(",\n")
        + "\n].map(normalize));";

    const done = () => {
        const old = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = old; }, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, () => window.prompt("Copy this code:", code));
    } else {
        window.prompt("Copy this code:", code);
    }
}

function openOwnedEditor() {
    const modal = document.getElementById("ownedModal");
    if (!modal) return;
    document.getElementById("ownedFilter").value = "";
    renderOwnedGrid();
    modal.style.display = "flex";
    document.getElementById("ownedFilter").focus();
}

function closeOwnedEditor() {
    const modal = document.getElementById("ownedModal");
    if (modal) modal.style.display = "none";
    updateOwnedBtn();
}

function injectOwnedUI() {
    const topUI = document.getElementById("topUI");
    if (!topUI || document.getElementById("ownedEditorBtn")) return;

    const section = document.createElement("div");
    section.innerHTML = `
        <div class="section-divider"><span class="section-label">🔓 Owned Brawlers</span></div>
        <button id="ownedEditorBtn" class="tier-toggle-btn" onclick="openOwnedEditor()"></button>
    `;
    topUI.appendChild(section);

    const modal = document.createElement("div");
    modal.id = "ownedModal";
    modal.className = "info-modal";
    modal.onclick = e => { if (e.target === modal) closeOwnedEditor(); };
    modal.innerHTML = `
        <div class="info-modal-box wide owned-box">
            <button class="info-modal-close" onclick="closeOwnedEditor()">&times;</button>
            <div class="owned-header">
                <div class="profile-name">Owned brawlers <span id="ownedCount"></span></div>
                <div class="owned-actions">
                    <button class="owned-action-btn" onclick="setAllOwned(true)">Select all</button>
                    <button class="owned-action-btn" onclick="setAllOwned(false)">Clear all</button>
                    <button class="owned-action-btn" onclick="resetOwnedToFile()">Reset to file</button>
                    <button class="owned-action-btn" onclick="copyOwnedCode(this)">Copy code</button>
                    <button class="owned-action-btn done" onclick="closeOwnedEditor()">Done</button>
                </div>
            </div>
            <input id="ownedFilter" class="owned-filter" placeholder="Filter brawlers" oninput="renderOwnedGrid()">
            <div id="ownedGrid"></div>
        </div>
    `;
    document.body.appendChild(modal);

    updateOwnedBtn();
}

/* =========================
   DATA CHECKER
   Runs on page load. Problems are logged to the console and, if there
   are any real warnings, a small "⚠ N data issues" badge appears in the
   bottom-left corner (click it to read the list).
========================= */
let dataIssues = [];

function addIssue(level, title, items) {
    if (!items || items.length === 0) return null;
    const issue = { level, title, items };
    dataIssues.push(issue);
    return issue;
}

function reportDataIssues(issues) {
    if (issues.length > 0) {
        const warnCount = issues.filter(i => i.level === "warn").length;
        console.groupCollapsed(`Data check: ${warnCount} warning group(s), ${issues.length - warnCount} note(s)`);
        issues.forEach(i => {
            const log = i.level === "warn" ? console.warn : console.info;
            log(`${i.title} (${i.items.length}):`, i.items);
        });
        console.groupEnd();
    }
    updateDataBadge();
}

function updateDataBadge() {
    const warnTotal = dataIssues
        .filter(i => i.level === "warn")
        .reduce((sum, i) => sum + i.items.length, 0);

    let badge = document.getElementById("dataCheckBadge");

    if (warnTotal === 0) {
        if (badge) badge.remove();
        return;
    }

    if (!badge) {
        badge = document.createElement("button");
        badge.id = "dataCheckBadge";
        badge.className = "data-check-badge";
        badge.onclick = showDataIssues;
        document.body.appendChild(badge);
    }

    badge.textContent = `⚠ ${warnTotal} data issue${warnTotal === 1 ? "" : "s"}`;
}

function showDataIssues() {
    const modal = document.getElementById("infoModal");
    const modalText = document.getElementById("infoModalText");

    const body = dataIssues.length
        ? dataIssues.map(i => `
            <div class="popup-section ${i.level === "warn" ? "popup-countered" : ""}">
                <strong>${i.title}</strong> (${i.items.length})<br>
                ${i.items.join(", ")}
            </div>
        `).join("")
        : "<div class='popup-section popup-strengths'>No issues found ✅</div>";

    setModalWide(true);
    modalText.innerHTML = `<div class="profile-name" style="margin-bottom:10px">Data check</div>${body}`;
    modal.style.display = "flex";
    openInfoIndex = null;
}

function runDataCheck() {
    dataIssues = [];
    const names = new Set(Object.keys(data));

    // --- counter lists ---
    const unknownCounters = [];
    const dupCounters = [];
    const selfCounters = [];
    const emptyLists = [];

    Object.keys(brawlerMain).forEach(b => {
        const list = (brawlerMain[b] || []).map(normalize).filter(Boolean);
        if (list.length === 0) emptyLists.push(b);

        const seen = new Set();
        list.forEach(c => {
            if (!names.has(c)) unknownCounters.push(`${b} → "${c}"`);
            if (c === b) selfCounters.push(b);
            if (seen.has(c)) dupCounters.push(`${b} → ${c}`);
            seen.add(c);
        });
    });

    addIssue("warn", "Counter lists: names that aren't brawlers", unknownCounters);
    addIssue("warn", "Counter lists: duplicate entries", dupCounters);
    addIssue("warn", "Counter lists: brawler listed as its own counter", selfCounters);
    addIssue("warn", "Counter lists: empty", emptyLists);

    // --- tier list ---
    const tierNames = Object.values(tierList).flat().map(normalize);
    addIssue("warn", "Tier list: names that aren't brawlers", tierNames.filter(n => !names.has(n)));
    addIssue("warn", "Tier list: listed more than once", [...new Set(tierNames.filter((n, i) => tierNames.indexOf(n) !== i))]);
    addIssue("warn", "Brawlers missing from the tier list", [...names].filter(n => !getTier(n)));

    // --- classes ---
    const classNames = Object.values(classGroups).flat().map(normalize);
    addIssue("warn", "Class groups: names that aren't brawlers", classNames.filter(n => !names.has(n)));
    addIssue("warn", "Class groups: brawler in more than one class", [...new Set(classNames.filter((n, i) => classNames.indexOf(n) !== i))]);
    addIssue("warn", "Brawlers with no class", [...names].filter(n => !getClass(n)));

    // --- owned list (as written in owned-brawlers.js) ---
    addIssue("warn", "Owned list: names that aren't brawlers", [...ownedFileDefaults].filter(n => !names.has(n)));

    // --- strategy info ---
    if (typeof brawlerInfo !== "undefined") {
        addIssue("warn", "Strategy info: names that aren't brawlers", Object.keys(brawlerInfo).filter(n => !names.has(normalize(n))));
    }
    addIssue("info", "Brawlers with no strategy info", [...names].filter(n => !getInfoText(n)));

    // --- kit tags ---
    if (typeof brawlerTags !== "undefined") {
        addIssue("warn", "Kit tags: names that aren't brawlers", Object.keys(brawlerTags).filter(n => !names.has(normalize(n))));

        if (typeof tagEmoji !== "undefined") {
            const used = new Set(Object.values(brawlerTags).flat());
            addIssue("warn", "Kit tags: used on brawlers but missing from tagEmoji", [...used].filter(t => !tagEmoji[t]));
        }
    }

    reportDataIssues(dataIssues);

    if (CHECK_IMAGES) checkImages(names);
}

/* Tries to load every portrait; reports any that fail. */
function checkImages(names) {
    Promise.all([...names].map(n => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(null);
        img.onerror = () => resolve(n);
        img.src = data[n].img;
    }))).then(results => {
        const missing = results.filter(Boolean).map(n => data[n].img);
        const issue = addIssue("warn", "Missing image files", missing);
        if (issue) reportDataIssues([issue]);
    });
}

/* =========================
   GLOBAL KEYS
========================= */
document.addEventListener("keydown", (e) => {
    const tag = document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA";

    // Escape: close whatever popup is open, otherwise close suggestion lists
    if (e.key === "Escape") {
        const ownedModal = document.getElementById("ownedModal");
        const infoModal = document.getElementById("infoModal");

        if (ownedModal && ownedModal.style.display === "flex") {
            closeOwnedEditor();
        } else if (infoModal && infoModal.style.display === "flex") {
            closeInfoModal();
        } else {
            ["suggestions", "strengthSuggestions", "allySuggestions"].forEach(id => {
                const box = document.getElementById(id);
                if (box) {
                    box.innerHTML = "";
                    box.style.display = "none";
                }
            });
        }
        return;
    }

    // Tab cycles sort mode (Score -> Class -> Tier) whenever the searched
    // results are showing (the Class Matchups box only appears there)
    if (e.key === "Tab") {
        const classCounters = document.getElementById("classCounters");
        if (classCounters && classCounters.style.display !== "none") {
            e.preventDefault();
            toggleSortMode();
        }
        return;
    }

    // Only Backspace exits the results view — Enter no longer does.
    if (e.key === "Backspace" && !typing) {
        const backBtn = document.getElementById("backBtn");
        if (backBtn && backBtn.style.display !== "none") {
            e.preventDefault();
            goBack();
        }
        return;
    }

    // Shift + number: toggle unowned counters on that row
    // (e.code is used because e.key becomes "!", "@", ... while Shift is held)
    if (!typing && e.shiftKey && /^Digit[1-9]$/.test(e.code)) {
        e.preventDefault();
        toggleUnowned(parseInt(e.code.slice(5), 10) - 1);
        return;
    }

    // Number: open that row's strategy info
    if (!typing && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        openInfoByIndex(parseInt(e.key, 10) - 1);
    }
});

/* INIT */
window.addEventListener("load", () => {
    document.getElementById("input").focus();

    // Route the Back button through goBack() — no index.html edit needed
    const backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.onclick = goBack;

    const topUI = document.getElementById("topUI");
    topUI.addEventListener("transitionend", () => {
        if (topUI.classList.contains("hidden")) {
            topUI.style.display = "none";
        }
    });

    loadSavedOwned();
    injectAllyUI();
    injectOwnedUI();
    renderTagBrowseBar();
    updateDatabaseLabel();
    updateTeamNote();
    runDataCheck();
});
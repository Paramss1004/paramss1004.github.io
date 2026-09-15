let selectedIndex = -1;
let selectedBrawlers = [];

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

/* =========================
   CLASS EMOJI (still used by class pills / legend text, just no longer
   shown as an overlay badge on brawler portraits — see KIT TAG BADGES)
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
   Small row of icons on a brawler's portrait (top-right corner — the
   spot the class indicator used to occupy, now freed up since class is
   read off the border color instead). A brawler can have zero or several.
   Data lives in brawler-tags.js.
========================= */
function tagBadges(name) {
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
   classWeakness[cls] = classes that counter it. classStrength is
   auto-derived as the reverse of that.
========================= */
const classWeakness = {
    thrower: ["assassin"],
    tank: ["antitank", "thrower"],
    assassin: ["tank", "antitank"],
    antitank: ["thrower", "sniper", "control"],
    sniper: ["thrower", "assassin"],
    control: ["thrower", "sniper"]
};

const classStrength = {};
Object.keys(classWeakness).forEach(cls => { classStrength[cls] = []; });
Object.entries(classWeakness).forEach(([cls, weakTo]) => {
    weakTo.forEach(counterCls => {
        if (!classStrength[counterCls]) classStrength[counterCls] = [];
        classStrength[counterCls].push(cls);
    });
});

function classPill(cls) {
    return `<span class="class-pill">${classEmoji[cls] || ""} ${capitalize(cls)}</span>`;
}

/* Item 4: pill variant showing a signed net score (+/-), color-coded
   green/red/neutral, used by the Class Matchups calculator. */
function classPillWithNetScore(cls, score) {
    const sign = score > 0 ? "net-positive" : score < 0 ? "net-negative" : "net-neutral";
    const display = score > 0 ? `+${score}` : `${score}`;
    return `<span class="class-pill ${sign}">${classEmoji[cls] || ""} ${capitalize(cls)} <span class="class-score ${sign}">${display}</span></span>`;
}

/* Item 4: net "+1 / -1" calculator.
   classesPresent is expected WITH multiplicity (one entry per searched
   brawler, not deduplicated) — e.g. two Controllers + one Assassin
   searched means "control" appears twice in the array.

   For each candidate class X and each enemy-class instance E:
     +1 if X counters E   (X ∈ classWeakness[E])
     -1 if E counters X   (E ∈ classWeakness[X])
   summed into a single net total per class. */
function getClassCounterScores(classesPresent) {
    const scores = {};
    Object.keys(classWeakness).forEach(cls => { scores[cls] = 0; });

    classesPresent.forEach(enemyCls => {
        Object.keys(classWeakness).forEach(candidate => {
            if ((classWeakness[enemyCls] || []).includes(candidate)) {
                scores[candidate] += 1; // candidate counters this enemy instance
            }
            if ((classWeakness[candidate] || []).includes(enemyCls)) {
                scores[candidate] -= 1; // candidate is countered by this enemy instance
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
   TIER SORTING
========================= */
function tierRank(name) {
    const t = getTier(name);
    const idx = tierOrder.indexOf(t);
    return idx === -1 ? tierOrder.length : idx; // unranked brawlers sort last
}

/* Risky for a specific row: skip the brawler this counter is meant to beat */
function isRiskyForRow(counterName, rowBrawler, selectedSet) {
    if (selectedSet.size < 2) return false;
    const theirCounters = getCombinedCounters(normalize(counterName));
    return [...selectedSet].some(enemy => enemy !== rowBrawler && theirCounters.includes(enemy));
}

/* Risky for the shared "Best Brawlers" box: no single row context, check against all enemies */
function isRiskyGlobal(counterName, selectedSet) {
    if (selectedSet.size < 2) return false;
    const theirCounters = getCombinedCounters(normalize(counterName));
    return [...selectedSet].some(enemy => theirCounters.includes(enemy));
}

/* Combine main+alt into one deduped list, sorted strongest (S+) to weakest (F) */
function getCombinedCounters(b) {
    const combined = [...(data[b].main || []), ...(data[b].alt || [])]
        .map(normalize)
        .filter(Boolean);

    const unique = [...new Set(combined)];

    unique.sort((a, c) => {
        const diff = currentRank(a) - currentRank(c);
        if (diff !== 0) return diff;

        const diff2 = secondaryRank(a) - secondaryRank(c);
        if (diff2 !== 0) return diff2;

        return a.localeCompare(c); // final fallback if both tier and class match
    });

    return unique;
}

/* Item 6: default sort mode is "class" instead of "tier" */
let sortMode = "class"; // "tier" or "class"

function classRank(name) {
    const cls = getClass(name);
    const idx = classOrder.indexOf(cls);
    return idx === -1 ? classOrder.length : idx;
}

function currentRank(name) {
    return sortMode === "tier" ? tierRank(name) : classRank(name);
}

function secondaryRank(name) {
    return sortMode === "tier" ? classRank(name) : tierRank(name);
}

function toggleSortMode() {
    sortMode = sortMode === "tier" ? "class" : "tier";
    document.getElementById("sortToggleBtn").textContent =
        `Sort ${sortMode === "tier" ? "by Tier 📉" : "by Class 🔰"}`;

    if (selectedBrawlers.length > 0) {
        findCounters(); // re-render with the new sort applied
    }
}

/* =========================
   RESULTS GRID (shared by class-browse, tag-browse and the strengths database)
========================= */
function renderResultsGrid(title, keys, sortFn) {
    document.getElementById("topUI").classList.add("hidden");
    document.getElementById("input").blur();
    document.getElementById("backBtn").style.display = "inline-block";

    document.getElementById("shared").style.display = "none";
    document.getElementById("sortControls").style.display = "none";
    document.getElementById("classCounters").style.display = "none";

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
    const label = cls.charAt(0).toUpperCase() + cls.slice(1);
    // within this class, sort by tier order
    renderResultsGrid(label, keys, (a, b) => {
        const diff = tierRank(a) - tierRank(b);
        return diff !== 0 ? diff : a.localeCompare(b);
    });
}

/* Item 2: browse the roster by kit tag (knockback, wallbreak, etc.) —
   same list/grid machinery as browseClass, just filtered on brawlerTags. */
function browseTag(tag) {
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

/* Item 2: relabel the Database section + input placeholder now that it
   shows a full profile, not just a strengths list. Done via JS so no
   index.html edit is needed. */
function updateDatabaseLabel() {
    document.querySelectorAll(".section-label").forEach(el => {
        if (el.textContent.includes("Database")) {
            el.textContent = "📚 Database — Brawler Profiles & Kit Browser";
        }
    });

    const strengthInput = document.getElementById("strengthInput");
    if (strengthInput) {
        strengthInput.placeholder = "Search a brawler for its full profile";
    }
}

/* =========================
   BRAWLER PROFILE (item 2)
   Full profile view for the Database search: portrait, tier, class,
   kit tags, and both directional matchup lists in clearly separated
   red/green panels (mirrors the popup styling from item 1).
========================= */
function renderBrawlerProfile(key) {
    document.getElementById("topUI").classList.add("hidden");
    document.getElementById("input").blur();
    document.getElementById("backBtn").style.display = "inline-block";

    document.getElementById("shared").style.display = "none";
    document.getElementById("sortControls").style.display = "none";
    document.getElementById("classCounters").style.display = "none";

    const cls = getClass(key);
    const tier = getTier(key);
    const tags = brawlerTags[key] || [];
    const counters = getCombinedCounters(key);
    const strengths = getStrengths(key);

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <div class="shared-box browse-results profile-box">
            <div class="profile-header">
                <div class="img-wrap">
                    <img src="${data[key].img}" class="brawler-img ${cls}">
                    ${tagBadges(key)}
                </div>
                <div class="profile-title">
                    <div class="profile-name">${capitalize(key)}</div>
                    <div class="profile-meta">
                        ${cls ? classPill(cls) : ""}
                        ${tier ? `<span class="tier-tag tier-${tier.replace('+', 'plus')}">${tier}</span>` : ""}
                    </div>
                    ${tags.length ? `<div class="profile-meta">${tags.map(t => `<span class="class-pill">${tagEmoji[t] || ""} ${tagLabel[t] || t}</span>`).join("")}</div>` : ""}
                </div>
            </div>
            <div class="profile-columns">
                <div class="popup-section popup-countered profile-section">
                    <div class="shared-title">Countered by (${counters.length})</div>
                    <div class="shared-columns">
                        ${counters.length ? counters.map(c => iconLabel(c)).join("") : "<div class='tiny-name'>None</div>"}
                    </div>
                </div>
                <div class="popup-section popup-strengths profile-section">
                    <div class="shared-title">Strong against (${strengths.length})</div>
                    <div class="shared-columns">
                        ${strengths.length ? strengths.map(c => iconLabel(c)).join("") : "<div class='tiny-name'>None</div>"}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/* =========================
   STRENGTHS DATABASE
   Reverse lookup: who does a given brawler counter / beat?
========================= */
function getStrengths(name) {
    const n = normalize(name);
    if (!data[n]) return [];

    const beats = [];
    for (const x in data) {
        if (x === n) continue;
        if (getCombinedCounters(x).includes(n)) beats.push(x);
    }

    beats.sort((a, b) => {
        const diff = currentRank(a) - currentRank(b);
        if (diff !== 0) return diff;
        return secondaryRank(a) - secondaryRank(b);
    });

    return beats;
}

/* Item 2: this now opens the full profile view instead of just a
   strengths list. */
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
function iconLabel(name, isBest = false, isRisky = false) {
    const n = normalize(name);
    if (!data[n]) return "";
    const cls = getClass(n);
    const tier = getTier(n);

    return `
        <div class="icon-label info-container ${isBest ? "best-pick" : ""} ${isRisky ? "risky-pick" : ""}" onclick="showBrawlerPopup('${n}')">
            <div class="img-wrap">
                <img src="${data[n].img}" class="brawler-img ${cls}">
                ${isRisky ? `<span class="risky-badge">⛔</span>` : ""}
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

function openInfoModal(text) {
    const modal = document.getElementById("infoModal");
    const modalText = document.getElementById("infoModalText");
    modalText.textContent = text;
    modal.style.display = "flex";
}

/* Item 1: popup showing a brawler's counters and strengths, now with
   clearly separated red ("Countered by") / green ("Strong against")
   panels so the two lists are easy to tell apart at a glance.
   Triggered by clicking ANY brawler icon — tier list, counters lists,
   AND now the searched-brawler's own row header too. */
function showBrawlerPopup(name) {
    const n = normalize(name);
    if (!data[n]) return;

    const counters = getCombinedCounters(n);   // brawlers that counter n
    const strengths = getStrengths(n);          // brawlers that n counters
    const tags = brawlerTags[n] || [];

    const countersText = counters.length ? counters.map(capitalize).join(", ") : "None";
    const strengthsText = strengths.length ? strengths.map(capitalize).join(", ") : "None";
    const tagsLine = tags.length
        ? `<strong>Kit:</strong> ${tags.map(t => `${tagEmoji[t] || ""} ${tagLabel[t] || t}`).join(", ")}<br><br>`
        : "";

    const modal = document.getElementById("infoModal");
    const modalText = document.getElementById("infoModalText");

    modalText.innerHTML = `
        <strong>${capitalize(n)}</strong><br><br>
        ${tagsLine}
        <span class="popup-section popup-countered">
            <strong>Countered by:</strong> ${countersText}
        </span>
        <span class="popup-section popup-strengths">
            <strong>Strong against:</strong> ${strengthsText}
        </span>
    `;

    modal.style.display = "flex";
    openInfoIndex = null;
}

function closeInfoModal() {
    document.getElementById("infoModal").style.display = "none";
    openInfoIndex = null;
}

function openInfoByIndex(idx) {
    const b = currentBrawlers[idx];
    if (!b || !data[b] || !data[b].info) return;

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

document.addEventListener("click", () => {
    document.querySelectorAll(".info-box.open").forEach(b => b.classList.remove("open"));
});

/* =========================
   INPUT ERROR HELPERS
========================= */
function showInputError(msg, id = "inputError") {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = "block";
}

function clearInputError(id = "inputError") {
    const el = document.getElementById(id);
    el.textContent = "";
    el.style.display = "none";
}

/* =========================
   CHIPS (selected brawlers)
========================= */
function renderChips() {
    const chipsBox = document.getElementById("chips");
    chipsBox.innerHTML = selectedBrawlers.map(key => `
        <div class="chip">
            <img src="${data[key].img}" class="chip-img ${getClass(key)}">
            <span>${capitalize(key)}</span>
            <button class="chip-remove" onclick="removeBrawler('${key}')">&times;</button>
        </div>
    `).join("");
}

function addBrawler(rawName) {
    const key = normalize(rawName);

    if (!data[key]) {
        showInputError(`Unknown brawler: "${rawName}"`);
        return;
    }

    if (selectedBrawlers.includes(key)) {
        showInputError(`${capitalize(key)} is already added`);
        document.getElementById("input").value = "";
        document.getElementById("suggestions").innerHTML = "";
        return;
    }

    selectedBrawlers.push(key);
    clearInputError();

    const input = document.getElementById("input");
    input.value = "";
    document.getElementById("suggestions").innerHTML = "";
    selectedIndex = -1;

    renderChips();
    input.focus();
}

function removeBrawler(key) {
    selectedBrawlers = selectedBrawlers.filter(b => b !== key);
    renderChips();
    document.getElementById("input").focus();
}

/* =========================
   AUTOCOMPLETE (icon + name)
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

    const matches = Object.keys(data)
        .filter(n => n.toLowerCase().startsWith(currentRaw) && !selectedBrawlers.includes(n))
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
   KEY HANDLING
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
   CLASS COUNTER SECTION (item 4)
   Net +1/-1 calculator: for the classes present among the searched
   brawlers (WITH multiplicity — e.g. two Controllers count twice),
   scores every class by (# enemy instances it counters) minus
   (# enemy instances that counter it), then shows all six classes
   ranked by that net total.
========================= */
function renderClassCounters(brawlers) {
    const box = document.getElementById("classCounters");
    if (!box) return;

    const classesPresent = brawlers.map(getClass).filter(Boolean); // multiplicity kept on purpose

    if (classesPresent.length === 0) {
        box.style.display = "none";
        return;
    }

    const scores = getClassCounterScores(classesPresent);
    const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

    box.style.display = "block";
    box.innerHTML = `
        <div class="shared-title">Class Matchups — Net Score</div>
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
        showInputError("Add at least one brawler first");
        return;
    }

    document.getElementById("topUI").classList.add("hidden");
	document.getElementById("input").blur();
    document.getElementById("backBtn").style.display = "inline-block";

    const resultDiv = document.getElementById("result");
    const counterBox = document.getElementById("shared");
    const sortControls = document.getElementById("sortControls");

    resultDiv.innerHTML = "";
    counterBox.innerHTML = "";

    sortControls.style.display = "flex";
    const selectedSet = new Set(brawlers);

    renderClassCounters(brawlers);

    /* scoreMap tracks, per counter: how many searched brawlers it counters (freq),
       and exactly WHICH searched brawlers those are (sources).
       Counters that are themselves one of the searched brawlers are dropped
       entirely rather than just crossed out. */
    const scoreMap = {};

    for (const b of brawlers) {
        if (!data[b]) continue;

        const counters = getCombinedCounters(b).filter(c => !selectedSet.has(c) && isOwned(c));

        counters.forEach(c => {
            if (!scoreMap[c]) scoreMap[c] = { freq: 0, sources: [] };
            scoreMap[c].freq++;
            scoreMap[c].sources.push(b);
        });
    }

    /* Risky picks (they also get countered by another searched enemy)
       are sorted to the end of the list, instead of being mixed in by tier/freq. */
    const filteredCounters = Object.keys(scoreMap)
		.filter(c => scoreMap[c].freq >= 2)
		.sort((a, b) => {
			const riskyA = isRiskyGlobal(a, selectedSet) ? 1 : 0;
			const riskyB = isRiskyGlobal(b, selectedSet) ? 1 : 0;
			if (riskyA !== riskyB) return riskyA - riskyB;

			if (scoreMap[b].freq !== scoreMap[a].freq) {
				return scoreMap[b].freq - scoreMap[a].freq;
			}

			const diff = currentRank(a) - currentRank(b);
			if (diff !== 0) return diff;

			return secondaryRank(a) - secondaryRank(b);
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
								${sources.map(s => `<img src="${data[s].img}" class="mini-source-img ${getClass(s)}" title="${capitalize(s)}">`).join("")}
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

		const counters = getCombinedCounters(b).filter(c => !selectedSet.has(c) && isOwned(c));

		// push risky picks to the end of this row's list too
		const nonRisky = counters.filter(n => !isRiskyForRow(n, b, selectedSet));
		const risky = counters.filter(n => isRiskyForRow(n, b, selectedSet));
		const ordered = [...nonRisky, ...risky];

		const icons = withClassDividers(ordered, n => {
			const isBest = scoreMap[normalize(n)]?.freq >= 2;
			const isRisky = isRiskyForRow(n, b, selectedSet);
			return iconLabel(n, isBest, isRisky);
		});

		resultDiv.innerHTML += `
			<div class="row">
				<div class="name info-container">
					<div class="img-wrap" onclick="showBrawlerPopup('${b}')">
						<img src="${data[b].img}" class="brawler-img ${getClass(b)}">
						${data[b].info ? `<span class="info-btn" onclick="toggleInfo(event, this)">i</span>` : ""}
						${tagBadges(b)}
					</div>
					<div class="tiny-name">
						${capitalize(b)}
					</div>
					${data[b].info ? `<div class="info-box">${data[b].info}</div>` : ""}
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
    renderChips();

    document.getElementById("result").innerHTML = "";
    document.getElementById("shared").innerHTML = "";
    document.getElementById("shared").style.display = "none";
    document.getElementById("classCounters").innerHTML = "";
    document.getElementById("classCounters").style.display = "none";
    document.getElementById("sortControls").style.display = "none";
    document.getElementById("backBtn").style.display = "none";
    clearInputError();
    clearInputError("strengthInputError");

    const topUI = document.getElementById("topUI");
    topUI.style.display = "";
    requestAnimationFrame(() => topUI.classList.remove("hidden"));

    document.getElementById("input").focus();
}

document.addEventListener("keydown", (e) => {
    const tag = document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA";

    // Tab switches sort mode (Tier <-> Class) whenever results are showing
    if (e.key === "Tab") {
        const sortControls = document.getElementById("sortControls");
        if (sortControls && sortControls.style.display !== "none") {
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
            resetSearch();
        }
        return;
    }

    if (!typing && /^[1-9]$/.test(e.key)) {
        openInfoByIndex(parseInt(e.key, 10) - 1);
    }
});

/* INIT */
window.addEventListener("load", () => {
    document.getElementById("input").focus();

    const topUI = document.getElementById("topUI");
    topUI.addEventListener("transitionend", () => {
        if (topUI.classList.contains("hidden")) {
            topUI.style.display = "none";
        }
    });

    renderTagBrowseBar();
    updateDatabaseLabel();
});
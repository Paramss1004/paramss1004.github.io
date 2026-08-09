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
   CLASS BADGES
========================= */
const classEmoji = {
    "thrower": "💥",
    "tank": "🛡️",
    "assassin": "⚡",
    "antitank": "⚔️",
    "support": "💚",
    "sniper": "🎯",
    "control": "🌀"
};

function classBadge(cls) {
    return cls && classEmoji[cls]
        ? `<span class="class-badge">${classEmoji[cls]}</span>`
        : "";
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

let sortMode = "tier"; // "tier" or "class"

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
   BROWSE MODE
========================= */
function renderBrowseGrid(title, keys, sortFn) {
    document.getElementById("topUI").classList.add("hidden");
    document.getElementById("input").blur();
    document.getElementById("backBtn").style.display = "inline-block";

    document.getElementById("shared").style.display = "none";
    document.getElementById("sortControls").style.display = "none";
    document.getElementById("teamSuggestion").style.display = "none";

    const resultDiv = document.getElementById("result");

    if (keys.length === 0) {
        resultDiv.innerHTML = `<div class="tiny-name">No brawlers found for "${title}".</div>`;
        return;
    }

    const sorted = [...keys].sort(sortFn);

    resultDiv.innerHTML = `
        <div class="shared-box browse-results">
            <div class="shared-title">${title} (${sorted.length})</div>
            <div class="shared-columns">
                ${sorted.map(k => iconLabel(k)).join("")}
            </div>
        </div>
    `;
}

/* =========================
   BROWSE SEARCH (Tab-activated)
========================= */
let browseSelectedIndex = -1;

function matchBrowseOptions(raw) {
    const q = raw.toLowerCase().trim();
    if (!q) return [];

    const tierKeys = ["s+", "s", "a", "b", "c", "d", "f"];

    // Exact tier match wins outright — nothing else should show alongside it
    const exactTier = tierKeys.find(t => t === q);
    if (exactTier) {
        return [{ type: "tier", key: exactTier.toUpperCase(), label: `${exactTier.toUpperCase()} Tier` }];
    }

    const results = [];

    tierKeys.forEach(t => {
        if (t.startsWith(q)) results.push({ type: "tier", key: t.toUpperCase(), label: `${t.toUpperCase()} Tier` });
    });

    Object.keys(classGroups).forEach(cls => {
        if (cls.startsWith(q)) results.push({ type: "class", key: cls, label: capitalize(cls) });
    });

    return results.slice(0, 6);
}

function showBrowseSuggestions() {
    const input = document.getElementById("browseInput");
    const box = document.getElementById("browseSuggestions");
    box.innerHTML = "";
    browseSelectedIndex = -1;

    if (!input.value.trim()) {
        box.style.display = "none";
        return;
    }

    const matches = matchBrowseOptions(input.value);
    box.style.display = matches.length > 0 ? "block" : "none";

    matches.forEach(m => {
        const div = document.createElement("div");
        div.innerHTML = `<span>${m.label}</span>`;
        div.dataset.type = m.type;
        div.dataset.key = m.key;
        div.onclick = () => selectBrowseOption(m.type, m.key);
        box.appendChild(div);
    });
}

function selectBrowseOption(type, key) {
    document.getElementById("browseInput").value = "";
    document.getElementById("browseSuggestions").innerHTML = "";
    document.getElementById("browseInput").blur();

    if (type === "tier") browseTier(key);
    else browseClass(key);
}

function handleBrowseKeyDown(e) {
    const box = document.getElementById("browseSuggestions");
    const items = box.querySelectorAll("div");

    if (e.key === "Tab" || e.key === "Escape") {
        e.preventDefault();
        document.getElementById("browseInput").value = "";
        box.innerHTML = "";
        document.getElementById("input").focus();
        return;
    }

    if (items.length > 0) {
        if (e.key === "ArrowDown") {
            browseSelectedIndex = (browseSelectedIndex + 1) % items.length;
            items.forEach((el, i) => el.classList.toggle("active", i === browseSelectedIndex));
            e.preventDefault();
        }

        if (e.key === "ArrowUp") {
            browseSelectedIndex = (browseSelectedIndex - 1 + items.length) % items.length;
            items.forEach((el, i) => el.classList.toggle("active", i === browseSelectedIndex));
            e.preventDefault();
        }

        if (e.key === "Enter") {
            e.preventDefault();
			e.stopPropagation();
            const chosen = browseSelectedIndex >= 0 ? items[browseSelectedIndex] : items[0];
            selectBrowseOption(chosen.dataset.type, chosen.dataset.key);
        }
    }
}

function browseTier(tier) {
    const keys = Object.keys(data).filter(k => getTier(k) === tier);
    // within this tier, sort by class order
    renderBrowseGrid(`Tier ${tier}`, keys, (a, b) => {
        const diff = classRank(a) - classRank(b);
        return diff !== 0 ? diff : a.localeCompare(b);
    });
}

function browseClass(cls) {
    const keys = Object.keys(data).filter(k => getClass(k) === cls);
    const label = cls.charAt(0).toUpperCase() + cls.slice(1);
    // within this class, sort by tier order
    renderBrowseGrid(label, keys, (a, b) => {
        const diff = tierRank(a) - tierRank(b);
        return diff !== 0 ? diff : a.localeCompare(b);
    });
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
        <div class="icon-label info-container ${isBest ? "best-pick" : ""} ${isRisky ? "risky-pick" : ""}">
            <div class="img-wrap">
                <img src="${data[n].img}" class="brawler-img ${cls}">
                ${classBadge(cls)}
                ${isRisky ? `<span class="risky-badge">⛔</span>` : ""}
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
    const wasOpen = box.classList.contains("open");
    document.querySelectorAll(".info-box.open").forEach(b => b.classList.remove("open"));
    if (!wasOpen) box.classList.add("open");
}

function openInfoByIndex(idx) {
    const b = currentBrawlers[idx];
    if (!b || !data[b] || !data[b].info) return;

    const rows = document.querySelectorAll("#result .row");
    const row = rows[idx];
    if (!row) return;

    const box = row.querySelector(".info-box");
    if (!box) return;

    const wasOpen = box.classList.contains("open");
    document.querySelectorAll(".info-box.open").forEach(b => b.classList.remove("open"));
    if (!wasOpen) box.classList.add("open");
}

document.addEventListener("click", () => {
    document.querySelectorAll(".info-box.open").forEach(b => b.classList.remove("open"));
});

/* =========================
   INPUT ERROR HELPERS
========================= */
function showInputError(msg) {
    const el = document.getElementById("inputError");
    el.textContent = msg;
    el.style.display = "block";
}

function clearInputError() {
    const el = document.getElementById("inputError");
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
	if (e.key === "Tab") {
        e.preventDefault();
        document.getElementById("suggestions").innerHTML = "";
        document.getElementById("browseInput").focus();
        return;
    }
	
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

    let allCounters = [];

    for (const b of brawlers) {
        if (data[b]) {
            allCounters.push(...getCombinedCounters(b));
        }
    }

    const scoreMap = {};

    allCounters.forEach(c => {
        const key = normalize(c);

        if (!scoreMap[key]) {
            scoreMap[key] = { freq: 0 };
        }

        scoreMap[key].freq++;
    });

    const filteredCounters = Object.keys(scoreMap)
		.filter(c => scoreMap[c].freq >= 2)
		.sort((a, b) => {
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
				${filteredCounters.map(c => {
					const isCrossed = selectedSet.has(c);
					const isRisky = isRiskyGlobal(c, selectedSet);

					return `
						<div class="shared-col ${isCrossed ? "crossed" : ""}">
							<div class="score-top">x${scoreMap[c].freq}</div>
							${iconLabel(c, false, isRisky)}
						</div>
					`;
				}).join("")}
			</div>
		`;
	} else {
		counterBox.style.display = "none";
	}

    /* BOTTOM LIST (ROWS) — unchanged from here down */
    brawlers.forEach((b, idx) => {
		if (!data[b]) return;

		const counters = getCombinedCounters(b);
		const icons = counters
			.map(n => {
				const isBest = scoreMap[normalize(n)]?.freq >= 2;
				const isRisky = isRiskyForRow(n, b, selectedSet);
				return iconLabel(n, isBest, isRisky);
			})
			.join("");

		resultDiv.innerHTML += `
			<div class="row">
				<div class="name info-container">
					<div class="img-wrap">
						<img src="${data[b].img}" class="brawler-img ${getClass(b)}">
						${classBadge(getClass(b))}
						${data[b].info ? `<span class="info-btn" onclick="toggleInfo(event, this)">i</span>` : ""}
					</div>
					<div class="tiny-name">
						<span class="row-number">${idx + 1}</span>
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

/* =========================
   TEAM SUGGESTION
========================= */
function countBits(mask) {
    let count = 0;
    while (mask) {
        count += mask & 1;
        mask >>= 1;
    }
    return count;
}

function combinations(arr, k) {
    const results = [];
    function helper(start, combo) {
        if (combo.length === k) {
            results.push([...combo]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            helper(i + 1, combo);
            combo.pop();
        }
    }
    helper(0, []);
    return results;
}

function suggestTeam() {
    const enemies = currentBrawlers;
    const box = document.getElementById("teamSuggestion");

    if (enemies.length === 0) {
        box.style.display = "none";
        return;
    }

    // Build: for each candidate brawler, which searched enemies does it counter?
    const coverage = {};
    enemies.forEach((enemy, i) => {
        getCombinedCounters(enemy).forEach(c => {
            coverage[c] = (coverage[c] || 0) | (1 << i);
        });
    });

    const candidates = Object.keys(coverage);

    if (candidates.length === 0) {
        box.style.display = "block";
        box.innerHTML = `<div class="shared-title">No counter data available to suggest a team.</div>`;
        return;
    }

    const teamSize = Math.min(3, candidates.length);
    const combos = combinations(candidates, teamSize);

    let best = null;
    combos.forEach(team => {
        let mask = 0;
        let rankSum = 0;
        team.forEach(t => {
            mask |= coverage[t];
            rankSum += currentRank(t); // lower = stronger tier/class
        });
        const coverCount = countBits(mask);

        if (
            !best ||
            coverCount > best.coverCount ||
            (coverCount === best.coverCount && rankSum < best.rankSum)
        ) {
            best = { team, coverCount, rankSum, mask };
        }
    });

    box.style.display = "block";
    box.innerHTML = `
        <div class="shared-title">
            Suggested Team — covers ${best.coverCount}/${enemies.length} enemies
        </div>
        <div class="shared-columns">
            ${best.team.map(t => iconLabel(t)).join("")}
        </div>
    `;
}

function resetSearch() {
    selectedBrawlers = [];
    renderChips();

    document.getElementById("result").innerHTML = "";
    document.getElementById("shared").innerHTML = "";
    document.getElementById("shared").style.display = "none";
    document.getElementById("sortControls").style.display = "none";
    document.getElementById("teamSuggestion").style.display = "none";
    document.getElementById("backBtn").style.display = "none";
    clearInputError();

    const topUI = document.getElementById("topUI");
    topUI.style.display = "";
    requestAnimationFrame(() => topUI.classList.remove("hidden"));

    document.getElementById("input").focus();
}

document.addEventListener("keydown", (e) => {
    const tag = document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA";

    if ((e.key === "Backspace" || e.key === "Enter") && !typing) {
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
});
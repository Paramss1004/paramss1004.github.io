let selectedIndex = -1;
let selectedBrawlers = [];

/* =========================
   HELPERS
========================= */
function normalize(s) {
    return (s || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");
}

function capitalize(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
}

function getClass(name) {
    return brawlerClass[normalize(name)] || null;
}

/* =========================
   TIER SORTING
========================= */
function tierRank(name) {
    const t = getTier(name);
    const idx = tierOrder.indexOf(t);
    return idx === -1 ? tierOrder.length : idx; // unranked brawlers sort last
}

/* Combine main+alt into one deduped list, sorted strongest (S+) to weakest (F) */
function getCombinedCounters(b) {
    const combined = [...(data[b].main || []), ...(data[b].alt || [])]
        .map(normalize)
        .filter(Boolean);

    const unique = [...new Set(combined)];

    unique.sort((a, c) => {
        const diff = tierRank(a) - tierRank(c);
        if (diff !== 0) return diff;
        return a.localeCompare(c);
    });

    return unique;
}

/* =========================
   ICON + LABEL BLOCK
========================= */
function iconLabel(name, isBest = false) {
    const n = normalize(name);
    const cls = getClass(n);
    const tier = getTier(n);

    return `
        <div class="icon-label ${isBest ? "best-pick" : ""}">
            <img src="${data[n].img}" class="brawler-img ${cls}">
            <div class="tiny-name">${capitalize(n)}</div>
            ${tier ? `<div class="tier-tag tier-${tier.replace('+', 'plus')}">${tier}</div>` : ""}
        </div>
    `;
}

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

    if (!currentRaw) return;

    const matches = Object.keys(data)
        .filter(n => n.toLowerCase().startsWith(currentRaw) && !selectedBrawlers.includes(n))
        .sort()
        .slice(0, 6);

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
function findCounters() {
	document.getElementById("topUI").classList.add("hidden");

    const resultDiv = document.getElementById("result");
    const counterBox = document.getElementById("shared");

    resultDiv.innerHTML = "";
    counterBox.innerHTML = "";

    const brawlers = [...new Set(selectedBrawlers)];
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
            return tierRank(a) - tierRank(b);
        });

    /* Only show the shared box if there's actually something to show */
    if (filteredCounters.length > 0) {
        counterBox.style.display = "block";
        counterBox.innerHTML = `
            <div class="shared-columns">
                ${filteredCounters.map(c => {
                    const isCrossed = selectedSet.has(c);

                    return `
                        <div class="shared-col ${isCrossed ? "crossed" : ""}">
                            <div class="score-top">x${scoreMap[c].freq}</div>
                            ${iconLabel(c)}
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    } else {
        counterBox.style.display = "none";
    }

    /* BOTTOM LIST (ROWS) — unchanged from here down */
    brawlers.forEach(b => {
        if (!data[b]) return;

        const counters = getCombinedCounters(b);

        const icons = counters
            .map(n => iconLabel(n, scoreMap[normalize(n)]?.freq >= 2))
            .join("");

        resultDiv.innerHTML += `
			<div class="row">
				<div class="name">
					<img src="${data[b].img}" class="brawler-img ${getClass(b)}">
					<div class="tiny-name">⮞ ${capitalize(b)} ⮜</div>
				</div>
				<div class="list">
					${icons || "<div class='tiny-name'>None</div>"}
				</div>
			</div>
		`;
    });
}

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
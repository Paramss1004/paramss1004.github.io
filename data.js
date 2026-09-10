/* =========================
   BRAWLERS DATA
   Assembled from brawler-main.js, brawler-info.js and brawler-img.js
   (all three must be loaded before this file). Rest of the app
   (script.js, tier-list.js) keeps reading data[name].img/.main/.info
   exactly as before.
========================= */
const data = {};
Object.keys(brawlerMain).forEach(name => {
    data[name] = {
        img: brawlerImg(name),
        main: brawlerMain[name],
        info: brawlerInfo[name]
    };
});

const brawlerClass = {};
for (const cls in classGroups) {
    classGroups[cls].forEach(name => {
        brawlerClass[name] = cls;
    });
}

/* =========================
   CLASS ORDER (for sort toggle)
========================= */
const classOrder = [
    "assassin",
    "tank",
    "antitank",
    "sniper",
    "thrower",
    "control",
];
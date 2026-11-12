/* =========================
   TIER LIST
   The tier list of brawlers, ranked on how strong they are from S+ to F, which is also changing monthly or so.
========================= */

const tierList = {
    "S": ["lou","mrp","chester","gale","amber","sirius","vince","melodie"],
    "A": ["edgar","nita","lou","shade","gray","angelo","ash","stu","spike","mina","8bit","brock","colette","max","squeak","mandy","rico","emz","berry"],
    "B": ["willow","wendy","kit","pearl","barley","damian","pierce","gloo","things","kenji","twins","cordelius","otis","buzz","bruce","carl","mortis","colette","cole","gene","surge","piper","byron","belle","griff","gus","rt","moe","draco"],
    "C": ["crow","maisie","primo","nita","shelly","penny","ollie","ziggy","hank","leon","sprout","bibi","darryl","lola","charlie","chuck","bea","jaeyong","alli","star power","gg","poco"],
    "D": ["bonnie","rico","colt","chuck","bo","tick","bull","rosa","frank","doug","pam","nani","tara","meg","janet","sandy","buster","jessie","juju","eve"],
    "F": ["sam","dynamike","jacky","grom","clancy","bea"]
};

const tierOrder = Object.keys(tierList); // ["S","A","B","C","D","F"] — restores the missing order array

const brawlerTier = {};
for (const tier in tierList) {
    tierList[tier].forEach(name => {
        brawlerTier[name] = tier;
    });
}
function getTier(name) {
    return brawlerTier[normalize(name)] || null;
}

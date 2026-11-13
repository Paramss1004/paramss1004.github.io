/* =========================
   TIER LIST
   The tier list of brawlers, ranked on how strong they are from S+ to F, which is also changing monthly or so.
========================= */

const tierList = {
    "S": ["lou","mrp","chester","gale","amber","vince","melodie","mandy","rico","colette"],
    "A": ["sirius","edgar","nori","lumi","shade","gray","angelo","ash","stu","spike","mina","8bit","brock","max","squeak","emz","berry"],
    "B": ["willow","wendy","kit","pearl","barley","damian","pierce","glowbert","finx","kenji","larry","cord","otis","buzz","ruffs","carl","mortis","kaze","colt","gene","surge","piper","byron","belle","griff","gus","rt","moe","cosmo","draco","najia"],
    "C": ["crow","maisie","primo","nita","shelly","penny","ollie","ziggy","hank","leon","sprout","bibi","darryl","lola","charlie","chuck","meeple","jaeyong","alli","starrnova","gigi","poco"],
    "D": ["bonnie","mico","trunk","bolt","bo","tick","bull","rosa","frank","doug","fang","pam","nani","tara","meg","janet","sandy","lily","buster","jessie","juju","eve"],
    "F": ["sam","jacky","grom","clancy","bea","dyna"]
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

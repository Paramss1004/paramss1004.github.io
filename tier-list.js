const tierList = {
    "S": ["rico","lumi","stu","griff","max","meg","8bit","ruffs","emz","kaze","mina","lou","pearl","wendy","nori"],
    "A": ["surge","brock","meeple","otis","mortis","ash","starrnova","finx","gray","damian","sirius","buzz","byron","gene","crow","kit","shade","cord","pierce"],
    "B": ["edgar","piper","najia","charlie","bolt","colt","carl","kenji","moe","penny","poco","leon","alli","willow","angelo","bonnie","belle","berry","buster","colette","bull","barley","frank","nita","lola","jaeyong"],
    "C": ["nani","melodie","bibi","mico","jessie","doug","squeak","draco","chuck","lily","rt","gale","sandy","sprout","tara","clancy","janet","gigi","chester","darryl","larry","pam","eve","ziggy"],
    "D": ["fang","maisie","rosa","spike","ollie","bea","tick","amber","gus","sam","dyna","grom","hank","mandy","bo"],
    "F": ["trunk","primo","shelly","mrp","juju","jacky","glowbert"]
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
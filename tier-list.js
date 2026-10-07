const tierList = {
    "S+": ["amber","wendy","gus","shade"],
    "S": ["rico","poco","emz","maisie","colette","8bit","griff","max","nori","primo"],
    "A": ["chuck","ruffs","kaze","gray","byron","gene","lou","lumi","mina","sirius","meg","pierce","stu","edgar","meeple","brock"],
    "B": ["kenji","kit","ash","cord","piper","crow","glowbert","janet","barley","najia","otis","buzz","pearl","mortis","belle","penny","surge","colt","moe","jaeyong","starrnova","charlie","finx"],
    "C": ["larry","doug","alli","sandy","spike","sprout","squeak","nani","eve","gale","bibi","barry","buster","chester","angelo","jessie","damian","bo","lola","nita","tara","carl","bolt","willow","melodie","leon","berry"],
    "D": ["tick","trunk","mandy","hank","ollie","gigi","mico","shelly","darryl","frank","bonnie","fang","bull","draco","lily","clancy","pam","rt","bea"],
    "F": ["mrp","grom","juju","sam","rosa","jacky","dyna","ziggy"]
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
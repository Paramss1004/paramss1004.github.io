const tierList = {
    "S+": ["surge","damian","8bit","bolt","max","starrnova","brock","meg"],
    "S": ["colette","lumi","crow","edgar","mortis","meeple","byron","ruffs","otis","chester","pierce","lou"],
    "A": ["griff","mina","najia","kaze","emz","gene","finx","charlie","alli","glowbert","spike","kit","shade","angelo","stu"],
    "B": ["sirius","kenji","cord","pearl","rico","belle","carl","nita","colt","penny","ash","fang","gray","rt","lily","moe","leon","poco","gus","sprout","amber","piper"],
    "C": ["nani","jaeyong","tara","draco","sandy","ollie","melodie","bibi","berry","bull","barley","bea","gale","larry","trunk","squeak","buzz","eve","janet","buster","willow"],
    "D": ["shelly","clancy","ziggy","juju","hank","mandy","lola","pam","frank","tick","dyna","maisie","rosa","darryl","bo","doug","chuck","mico"],
    "F": ["bonnie","mrp","sam","primo","jessie","jacky","grom","gigi"]
};

const tierOrder = Object.keys(tierList); // ["S+","S","A","B","C","D","F"] — restores the missing order array

const brawlerTier = {};
for (const tier in tierList) {
    tierList[tier].forEach(name => {
        brawlerTier[name] = tier;
    });
}

function getTier(name) {
    return brawlerTier[normalize(name)] || null;
}
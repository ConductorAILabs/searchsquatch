// Comprehensive content filter for Sasquatch Search
// Returns true if the query is safe, false if it should be blocked

const BANNED_WORDS = new Set([
  // Profanity
  "fuck", "fucking", "fucker", "fucked", "fucks", "fuckoff",
  "shit", "shitting", "shitty", "bullshit", "horseshit", "dipshit",
  "ass", "asshole", "arsehole", "arse", "dumbass", "jackass", "fatass", "badass",
  "bitch", "bitches", "bitching",
  "damn", "goddamn", "goddamnit",
  "dick", "dicks", "dickhead",
  "cock", "cocks", "cocksucker",
  "cunt", "cunts",
  "bastard", "bastards",
  "whore", "whores",
  "slut", "sluts", "slutty",
  "piss", "pissed", "pissing",
  "crap", "crappy",
  "tits", "titty", "titties",
  "twat", "twats",
  "wanker", "wankers", "wank",
  "bellend",
  "bollocks",
  "bugger",
  "tosser",
  "prick", "pricks",
  "douche", "douchebag",
  "motherfucker", "motherfucking",
  "wtf", "stfu", "gtfo", "lmfao",

  // Slurs — racial, ethnic, identity-based
  "nigger", "nigga", "niggers", "niggas",
  "chink", "chinks",
  "spic", "spics", "spick",
  "wetback", "wetbacks",
  "kike", "kikes",
  "gook", "gooks",
  "raghead", "ragheads",
  "towelhead", "towelheads",
  "camel jockey",
  "beaner", "beaners",
  "cracker", "crackers",
  "honky", "honkey",
  "gringo",
  "coon", "coons",
  "darkie", "darkies",
  "redskin", "redskins",
  "squaw",
  "chinaman",
  "jap", "japs",
  "paki", "pakis",
  "wog", "wogs",
  "fag", "fags", "faggot", "faggots",
  "dyke", "dykes",
  "tranny", "trannies",
  "shemale", "shemales",
  "retard", "retarded", "retards",
  "spaz", "spazz", "spastic",
  "mongoloid",
  "midget",

  // Sexual / explicit
  "porn", "porno", "pornography", "pornstar",
  "xxx", "xxxx",
  "hentai",
  "milf",
  "dildo", "dildos",
  "vibrator",
  "blowjob", "blowjobs", "bj",
  "handjob", "handjobs",
  "rimjob",
  "cumshot", "cumshots",
  "creampie",
  "gangbang",
  "orgy", "orgies",
  "threesome", "foursome",
  "anal",
  "bondage",
  "bdsm",
  "fetish",
  "dominatrix",
  "stripper", "strippers",
  "escort", "escorts",
  "prostitute", "prostitution", "prostitutes",
  "brothel", "brothels",
  "hooker", "hookers",
  "onlyfans",
  "camgirl", "camgirls",
  "sexting",
  "nudes", "nude",
  "naked",
  "erotic", "erotica",
  "masturbate", "masturbation", "masturbating",
  "ejaculate", "ejaculation",
  "orgasm", "orgasms",
  "clitoris",
  "vagina", "pussy", "pussies",
  "penis", "penises",
  "boobs", "boobies",
  "deepthroat",
  "facial",
  "bukake", "bukkake",
  "fisting",
  "pegging",
  "squirting",
  "voyeur", "voyeurism",
  "upskirt",
  "nsfw",
  "rule34",
  "r34",
  "loli", "lolicon",
  "shota", "shotacon",
  "jailbait",
  "underage",

  // Violence / harm
  "murder", "murders", "murderer",
  "kill", "killing", "killer",
  "homicide",
  "suicide", "suicidal",
  "selfharm", "self-harm",
  "rape", "raping", "rapist",
  "molest", "molestation", "molester",
  "pedophile", "pedophilia", "pedo", "paedophile",
  "abuse", "abusing", "abuser",
  "torture", "torturing",
  "decapitate", "decapitation", "beheading", "behead",
  "dismember", "dismemberment",
  "mutilate", "mutilation",
  "stab", "stabbing",
  "shooting", "shootings", "mass shooting",
  "massacre",
  "genocide",
  "terrorism", "terrorist", "terrorists",
  "jihad", "jihadist",
  "isis", "alqaeda", "al-qaeda",
  "bomb", "bombing", "bomber",
  "explosives", "explosive",
  "anthrax",
  "ricin",
  "sarin",
  "cyanide",
  "assassinate", "assassination",
  "hitman",
  "serial killer",
  "school shooting",
  "columbine",
  "swatting", "swat",
  "lynch", "lynching",
  "hate crime",
  "ethnic cleansing",

  // Drugs / illegal substances
  "cocaine", "coke",
  "heroin",
  "methamphetamine", "meth", "crystal meth",
  "crack",
  "ecstasy", "mdma", "molly",
  "lsd", "acid",
  "ketamine",
  "fentanyl",
  "opioid", "opioids",
  "opium",
  "pcp",
  "dmt",
  "shrooms", "mushrooms magic",
  "drug dealer", "drug dealing",
  "drug trafficking",
  "cartel",

  // Weapons / dangerous
  "how to make a bomb",
  "how to make poison",
  "how to hack",
  "how to kill",
  "how to murder",
  "buy guns",
  "buy weapons",
  "illegal weapons",
  "pipe bomb",
  "molotov cocktail",
  "napalm",
  "chlorine gas",
  "mustard gas",
  "nerve agent",

  // Hate / extremism
  "nazi", "nazis", "neonazi", "neo-nazi",
  "white supremacy", "white supremacist",
  "white power",
  "kkk", "ku klux klan",
  "aryan",
  "holocaust denial",
  "antisemitic", "antisemitism",
  "islamophobia",
  "xenophobia",
  "incel", "incels",
  "blackpill",
  "redpill",

  // Scams / illegal activity
  "credit card fraud",
  "identity theft",
  "money laundering",
  "counterfeit",
  "phishing",
  "ransomware",
  "darkweb", "dark web", "darknet",
  "silk road",
  "tor market",
  "stolen credit cards",
  "fake id", "fake ids",
  "child exploitation",
  "human trafficking",
  "sex trafficking",
  "organ trafficking",

  // Self-harm / eating disorders
  "anorexia", "anorexic",
  "bulimia", "bulimic",
  "pro-ana", "proana",
  "thinspo", "thinspiration",
  "cutting",
  "self mutilation",
]);

// Phrases that should be blocked as substrings (multi-word)
const BANNED_PHRASES = [
  "how to kill",
  "how to murder",
  "how to make a bomb",
  "how to make poison",
  "how to hack someone",
  "child porn",
  "child pornography",
  "child abuse",
  "sexual assault",
  "mass shooting",
  "school shooting",
  "serial killer",
  "drug dealer",
  "drug dealing",
  "drug trafficking",
  "white supremacy",
  "white supremacist",
  "white power",
  "ku klux klan",
  "ethnic cleansing",
  "hate crime",
  "human trafficking",
  "sex trafficking",
  "organ trafficking",
  "credit card fraud",
  "identity theft",
  "money laundering",
  "dark web",
  "stolen credit",
  "fake id",
  "child exploitation",
  "how to stab",
  "how to poison",
  "how to strangle",
  "how to kidnap",
  "how to steal",
  "how to rob",
];

// Leetspeak normalization map
const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "2": "z", "3": "e", "4": "a", "5": "s",
  "6": "g", "7": "t", "8": "b", "9": "g", "@": "a", "$": "s",
  "!": "i", "+": "t", "€": "e", "¢": "c", "£": "l",
};

function normalize(input: string): string {
  let s = input.toLowerCase().trim();

  // Unicode NFKD normalization — converts fullwidth, ligatures, etc.
  s = s.normalize("NFKD");

  // Strip diacritical marks (accents)
  s = s.replace(/[\u0300-\u036f]/g, "");

  // Strip zero-width chars, soft hyphens, invisible separators
  s = s.replace(/[\u200B-\u200D\u200E\u200F\uFEFF\u00AD\u2060\u2061-\u2064\u034F\u115F\u1160\u17B4\u17B5\u180E]/g, "");

  // Leetspeak substitution
  s = s.replace(/[0-9@$!+€¢£]/g, (ch) => LEET_MAP[ch] || ch);

  // Collapse repeated chars (e.g., fuuuck → fuuck → fuck)
  s = s.replace(/(.)\1{2,}/g, "$1$1");

  return s;
}

export function isQuerySafe(query: string): boolean {
  const normalized = normalize(query);

  // Also create a version with all non-alpha stripped (catches f.u.c.k, f-u-c-k, etc.)
  const collapsed = normalized.replace(/[^a-z]/g, "");

  // Check banned phrases against normalized input
  for (const phrase of BANNED_PHRASES) {
    if (normalized.includes(phrase)) return false;
  }

  // Check collapsed version against banned words as substrings
  const bannedArr = Array.from(BANNED_WORDS);
  for (let i = 0; i < bannedArr.length; i++) {
    const word = bannedArr[i];
    if (word.length >= 4 && collapsed.includes(word)) return false;
  }

  // Check individual words from normalized input
  const words = normalized.split(/[\s,.\-_!?;:'"()\[\]{}]+/);
  for (const word of words) {
    if (word && BANNED_WORDS.has(word)) return false;
  }

  return true;
}

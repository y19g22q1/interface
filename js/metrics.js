// metrics.js

// Stop words from sklearn.feature_extraction.text.ENGLISH_STOP_WORDS
const ENGLISH_STOP_WORDS = new Set([
  "a", "about", "above", "across", "after", "afterwards", "again", "against", "all", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "amoungst", "amount", "an", "and", "another", "any", "anyhow", "anyone", "anything", "anyway", "anywhere", "are", "around", "as", "at", "back", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "below", "beside", "besides", "between", "beyond", "bill", "both", "bottom", "but", "by", "call", "can", "cannot", "cant", "co", "con", "could", "couldnt", "cry", "de", "describe", "detail", "do", "done", "down", "due", "during", "each", "eg", "eight", "either", "eleven", "else", "elsewhere", "empty", "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", "fifteen", "fifty", "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", "four", "from", "front", "full", "further", "get", "give", "go", "had", "has", "hasnt", "have", "he", "hence", "her", "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how", "however", "hundred", "i", "ie", "if", "in", "inc", "indeed", "interest", "into", "is", "it", "its", "itself", "keep", "last", "latter", "latterly", "least", "less", "ltd", "made", "many", "may", "me", "meanwhile", "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "myself", "name", "namely", "neither", "never", "nevertheless", "next", "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own", "part", "per", "perhaps", "please", "put", "rather", "re", "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several", "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere", "still", "such", "system", "take", "ten", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore", "therein", "thereupon", "these", "they", "thick", "thin", "third", "this", "those", "though", "three", "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "twelve", "twenty", "two", "un", "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were", "what", "whatever", "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within", "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves"
]);

function codeCorrectness(code) {
    try {
        if (!code || typeof code !== 'string') return 0;

        // If the code doesn't contain any HTML tags, it's not valid HTML/code
        if (!/<[a-z]/i.test(code)) {
            return 0;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(code, "text/html");
        
        // DOMParser rarely throws for text/html, but we can verify it parsed into a document
        if (doc && doc.documentElement) {
            return 1;
        }
        return 0;
    } catch (e) {
        return 0;
    }
}

function extractKeywords(prompt) {
    const promptLower = prompt.toLowerCase();
    // match \b\w+\b similar to python's re.findall(r'\b\w+\b', prompt)
    const words = promptLower.match(/\b\w+\b/g) || [];
    
    // filter stop words and len > 2, then unique
    const keywords = words.filter(w => !ENGLISH_STOP_WORDS.has(w) && w.length > 2);
    return [...new Set(keywords)];
}

function taskAlignment(prompt, code) {
    const keywords = extractKeywords(prompt);
    if (keywords.length === 0) {
        return 0;
    }
    const codeLower = code.toLowerCase();
    let match = 0;
    for (const k of keywords) {
        if (codeLower.includes(k)) {
            match += 1;
        }
    }
    return match / keywords.length;
}

const DEFAULT_ELEMENTS = ["form", "input", "button", "div", "label"];

function structuralConsistency(code, elements = DEFAULT_ELEMENTS) {
    const codeLower = code.toLowerCase();
    let score = 0;
    for (const e of elements) {
        if (codeLower.includes(e)) {
            score += 1;
        }
    }
    return score / elements.length;
}

// Export functions if using modules, otherwise they are attached to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { codeCorrectness, taskAlignment, structuralConsistency, extractKeywords };
} else {
    window.Metrics = { codeCorrectness, taskAlignment, structuralConsistency, extractKeywords };
}

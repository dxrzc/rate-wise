import { featureContexts } from './ai.context';

/**
 * Returns true only if every single word in the phrase is found in the query
 */
function isKeywordMatched(keyword: string, query: string): boolean {
    const requiredWords = keyword.split(' ');
    return requiredWords.every((word) => query.includes(word));
}

export function findRelevantContexts(messageContent: string): string {
    const normalizedQuery = messageContent.toLowerCase();
    const matchedContexts = featureContexts
        .filter((featureBucket) => {
            // keeps the bucket if at least one of its keyword phrases matches the query
            return featureBucket.keywords.some((keyword) => {
                return isKeywordMatched(keyword, normalizedQuery);
            });
        })
        .map((featureBucket) => featureBucket.context);
    return JSON.stringify(matchedContexts);
}

import { GoogleGenAI, Type } from '@google/genai';
import type { User, DailyMatchRecommendation } from '../types/tcg.ts';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiInstance;
}

// Fallback models if primary model is experiencing high demand (503) or rate limits
const MODELS_TO_TRY = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

async function generateWithModelFallback(
  ai: GoogleGenAI,
  prompt: string,
  responseSchema?: any
): Promise<string | null> {
  for (const model of MODELS_TO_TRY) {
    try {
      const config: any = {
        temperature: 0.7,
      };
      if (responseSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (err: any) {
      // If model is busy (503 / 429), try next model in the priority list
      const errorMsg = err?.message || String(err);
      const isTemporaryDemand =
        errorMsg.includes('503') ||
        errorMsg.includes('high demand') ||
        errorMsg.includes('UNAVAILABLE') ||
        errorMsg.includes('429') ||
        errorMsg.includes('RESOURCE_EXHAUSTED');

      if (isTemporaryDemand) {
        console.info(`Model ${model} is experiencing high demand. Falling back to alternative model...`);
        continue;
      }
      console.warn(`Gemini generation warning on ${model}:`, err);
    }
  }
  return null;
}

function generateHeuristicExplanation(currentUser: User, candidate: User, sharedItems: string[]): { explanation: string; score: number } {
  let score = 76;
  if (sharedItems.length > 0) {
    score += Math.min(18, sharedItems.length * 6);
  }
  if (Math.abs((currentUser.age || 20) - (candidate.age || 20)) <= 3) {
    score += 4;
  }

  const isSameLocation =
    currentUser.locationArea &&
    candidate.locationArea &&
    currentUser.locationArea.toLowerCase().trim() === candidate.locationArea.toLowerCase().trim();

  if (isSameLocation) {
    score += 2;
  }

  // Generate natural, human-feeling personalized reason
  let explanation = '';
  if (sharedItems.length >= 2) {
    const top2 = sharedItems.slice(0, 2).join(' and ');
    if (isSameLocation) {
      explanation = `You both share a passion for ${top2} and are based in ${candidate.locationArea}! Perfect opportunity to connect and start a friendship streak.`;
    } else {
      explanation = `You both love ${top2} with complementary weekend availability. Great potential for co-op chats and deck collection!`;
    }
  } else if (sharedItems.length === 1) {
    explanation = `You both enjoy ${sharedItems[0]}! A great mutual spark to break the ice, trade cards, and level up your friendship.`;
  } else if (isSameLocation) {
    explanation = `You are both in ${candidate.locationArea} with curious minds and active hobby collections. A great local connection to explore!`;
  } else {
    explanation = `You both have creative pursuits, open availability, and active collector profiles. Excellent candidate to expand your Legendary TCG Deck.`;
  }

  return { explanation, score: Math.min(99, Math.max(68, score)) };
}

export async function generateMatchExplanations(
  currentUser: User,
  candidates: User[]
): Promise<DailyMatchRecommendation[]> {
  if (!candidates || candidates.length === 0) return [];

  const ai = getAI();
  const candidateExplanationsMap = new Map<string, { explanation: string; score?: number }>();

  // Attempt batched Gemini generation if AI is available
  if (ai) {
    try {
      const candidateSummaries = candidates
        .map(
          (c, idx) => `Candidate ${idx + 1} (ID: "${c.id}", Name: "${c.name}", Age: ${c.age}):
- Bio: ${c.bio || 'Not specified'}
- Hobbies: ${c.hobbies?.join(', ') || 'None listed'}
- Interests: ${c.interests?.join(', ') || 'None listed'}
- Favorite Activities: ${c.favoriteActivities?.join(', ') || 'None listed'}
- Location: ${c.locationArea || 'Global'}
- Availability: ${c.availability?.map((a) => `${a.day}: ${a.timeRange}`).join('; ') || 'Flexible'}`
        )
        .join('\n\n');

      const batchedPrompt = `You are the AI Matchmaker for 'TCG Friends', a social friendship app where real people connect and collect Legendary TCG cards for every friendship.

Current User (${currentUser.name}, Age ${currentUser.age}):
- Bio: ${currentUser.bio || 'Not specified'}
- Hobbies: ${currentUser.hobbies?.join(', ') || 'None listed'}
- Interests: ${currentUser.interests?.join(', ') || 'None listed'}
- Favorite Activities: ${currentUser.favoriteActivities?.join(', ') || 'None listed'}
- Location: ${currentUser.locationArea || 'Global'}
- Availability: ${currentUser.availability?.map((a) => `${a.day}: ${a.timeRange}`).join('; ') || 'Flexible'}

Analyze each candidate below and write a warm, engaging, personalized 1-2 sentence explanation of "Why you might get along" based strictly on their actual profile details and shared interests.
Rules:
- Strictly for PLATONIC FRIENDSHIP (no dating/romance).
- Be direct, genuine, and conversational.
- Assign a compatibility score between 70 and 98.

Candidates:
${candidateSummaries}`;

      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            candidateId: { type: Type.STRING, description: 'The exact ID of the candidate' },
            compatibilityScore: { type: Type.NUMBER, description: 'Score between 70 and 98' },
            whyYouMightGetAlong: { type: Type.STRING, description: '1-2 sentence warm explanation' },
          },
          required: ['candidateId', 'compatibilityScore', 'whyYouMightGetAlong'],
        },
      };

      const rawJson = await generateWithModelFallback(ai, batchedPrompt, schema);
      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item.candidateId && item.whyYouMightGetAlong) {
                candidateExplanationsMap.set(item.candidateId, {
                  explanation: item.whyYouMightGetAlong,
                  score: Number(item.compatibilityScore) || undefined,
                });
              }
            });
          }
        } catch {
          // JSON parsing fallback handled below
        }
      }
    } catch {
      // Handled gracefully below
    }
  }

  // Assemble final results with fallback safeguards
  const results: DailyMatchRecommendation[] = candidates.map((candidate) => {
    const sharedHobbies = (currentUser.hobbies || []).filter((h) =>
      (candidate.hobbies || []).some((ch) => ch.toLowerCase() === h.toLowerCase())
    );
    const sharedInterests = (currentUser.interests || []).filter((i) =>
      (candidate.interests || []).some((ci) => ci.toLowerCase() === i.toLowerCase())
    );
    const sharedActivities = (currentUser.favoriteActivities || []).filter((a) =>
      (candidate.favoriteActivities || []).some((ca) => ca.toLowerCase() === a.toLowerCase())
    );

    const allShared = Array.from(new Set([...sharedHobbies, ...sharedInterests, ...sharedActivities]));
    const heuristic = generateHeuristicExplanation(currentUser, candidate, allShared);

    const aiResult = candidateExplanationsMap.get(candidate.id);
    const finalExplanation = aiResult?.explanation || heuristic.explanation;
    const finalScore = aiResult?.score || heuristic.score;

    return {
      user: {
        id: candidate.id,
        name: candidate.name,
        age: candidate.age,
        tcgId: candidate.tcgId,
        avatarUrl: candidate.avatarUrl,
        bio: candidate.bio,
        hobbies: candidate.hobbies,
        interests: candidate.interests,
        favoriteActivities: candidate.favoriteActivities,
        locationArea: candidate.locationArea,
        availability: candidate.availability,
        cardTheme: candidate.cardTheme,
        customQuote: candidate.customQuote,
        equippedFrame: candidate.equippedFrame,
        equippedTitle: candidate.equippedTitle,
        onlineStatus: candidate.onlineStatus,
        cardsCount: 0,
        isFriend: false,
        hasPendingRequest: false,
      },
      compatibilityScore: Math.min(99, Math.max(65, finalScore)),
      whyYouMightGetAlong: finalExplanation,
      sharedInterests: allShared,
    };
  });

  return results;
}

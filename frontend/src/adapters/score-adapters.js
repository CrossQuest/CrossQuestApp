import { fetchHandler, getPostOptions } from "../utils/fetchingUtils";

const baseUrl = "/api";

export const submitScore = async ({ score }) => {
  return fetchHandler(`${baseUrl}/posts`, getPostOptions({ score }));
};

export const getAllScores = async () => {
  return fetchHandler(`${baseUrl}/posts`);
};

export const getUserScores = async (userId) => {
    return fetchHandler(`${baseUrl}/users/${userId}/posts`);
}

export const createFeedEntry = async ({ score, message }) => {
    return fetchHandler(`${baseUrl}/feed`, getPostOptions({ score, message }));
}

export const getAllFeed = async () => {
    return fetchHandler(`${baseUrl}/feed`);
}

export const getUserFeed = async (userId) => {
    return fetchHandler(`${baseUrl}/users/${userId}/feed`);
}

// Competition adapters
export const createCompetition = async ({ challengedId }) => {
    return fetchHandler(`${baseUrl}/competitions`, getPostOptions({ challengedId }));
}

export const getUserCompetitions = async () => {
    return fetchHandler(`${baseUrl}/competitions`);
}

export const getPendingCompetitions = async () => {
    return fetchHandler(`${baseUrl}/competitions/pending`);
}

export const getActiveCompetitions = async () => {
    return fetchHandler(`${baseUrl}/competitions/active`);
}

export const acceptCompetition = async (competitionId) => {
    return fetchHandler(`${baseUrl}/competitions/${competitionId}/accept`, { method: 'PUT' });
}

export const declineCompetition = async (competitionId) => {
    return fetchHandler(`${baseUrl}/competitions/${competitionId}/decline`, { method: 'PUT' });
}

export const getUserAttempts = async (competitionId) => {
    return fetchHandler(`${baseUrl}/competitions/${competitionId}/attempts`);
}

export const submitCompetitionScore = async (competitionId, score) => {
    return fetchHandler(`${baseUrl}/competitions/${competitionId}/score`, getPostOptions({ score }));
}

export const completeCompetition = async (competitionId) => {
    return fetchHandler(`${baseUrl}/competitions/${competitionId}/complete`, { method: 'PUT' });
};

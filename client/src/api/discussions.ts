import apiClient from './client';
import type {
  Comment,
  CreateDiscussionRequest,
  Discussion,
  RecommendedTopic,
} from '../types';

export const discussionsApi = {
  listByGroup: (groupId: string, params?: { authorId?: string; participantId?: string; bookTitle?: string }) =>
    apiClient.get<Discussion[]>(`/groups/${groupId}/discussions`, { params }),

  create: (groupId: string, data: CreateDiscussionRequest) => {
    if (!data.image) {
      return apiClient.post<Discussion>(`/groups/${groupId}/discussions`, data);
    }

    const formData = new FormData();
    formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.memoId) formData.append('memoId', data.memoId);
    if (data.endDate) formData.append('endDate', data.endDate);
    if (data.bookTitle) formData.append('bookTitle', data.bookTitle);
    if (data.bookCoverUrl) formData.append('bookCoverUrl', data.bookCoverUrl);
    formData.append('image', data.image);
    return apiClient.post<Discussion>(`/groups/${groupId}/discussions`, formData);
  },

  getById: (discussionId: string) =>
    apiClient.get<Discussion>(`/discussions/${discussionId}`),

  getComments: async (discussionId: string) => {
    const res = await apiClient.get<any[]>(`/discussions/${discussionId}/comments`);
    // Map server response (author.nickname) to flat authorNickname
    res.data = res.data.map((c: any) => ({
      ...c,
      authorId: c.authorId || c.author?.id,
      authorNickname: c.authorNickname || c.author?.nickname || '알 수 없음',
      imageUrl: c.imageUrl,
      replies: (c.replies || []).map((r: any) => ({
        ...r,
        authorId: r.authorId || r.author?.id,
        authorNickname: r.authorNickname || r.author?.nickname || '알 수 없음',
      })),
    }));
    return res as { data: Comment[] };
  },

  addComment: (discussionId: string, content: string, image?: File | null) => {
    if (!image) {
      return apiClient.post<Comment>(`/discussions/${discussionId}/comments`, { content });
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('image', image);
    return apiClient.post<Comment>(`/discussions/${discussionId}/comments`, formData);
  },

  addReply: (commentId: string, content: string) =>
    apiClient.post(`/comments/${commentId}/replies`, { content }),

  updateComment: (commentId: string, content: string) =>
    apiClient.put(`/comments/${commentId}`, { content }),

  updateReply: (replyId: string, content: string) =>
    apiClient.put(`/replies/${replyId}`, { content }),

  getRecommendations: (groupId: string) =>
    apiClient.get<RecommendedTopic[]>(`/groups/${groupId}/discussions/recommendations`),

  getRemainingCount: (groupId: string) =>
    apiClient.get<{ used: number; remaining: number; limit: number }>(`/groups/${groupId}/discussions/remaining`),

  updateTopic: (discussionId: string, data: { title: string; content?: string; endDate?: string }) =>
    apiClient.put(`/discussions/${discussionId}`, data),

  deleteTopic: (discussionId: string) =>
    apiClient.delete(`/discussions/${discussionId}`),

  updateEndDate: (discussionId: string, endDate: string) =>
    apiClient.patch(`/discussions/${discussionId}/end-date`, { endDate }),

  pinThread: (discussionId: string) =>
    apiClient.post(`/discussions/${discussionId}/pin`),

  unpinThread: (discussionId: string) =>
    apiClient.delete(`/discussions/${discussionId}/pin`),

  // 발언권
  getTokens: (discussionId: string) =>
    apiClient.get<{ remaining: number; requested: boolean }>(`/discussions/${discussionId}/tokens`),

  requestTokens: (discussionId: string) =>
    apiClient.post(`/discussions/${discussionId}/tokens/request`),

  getTokenRequests: (discussionId: string) =>
    apiClient.get<any[]>(`/discussions/${discussionId}/tokens/requests`),

  grantTokens: (discussionId: string, userId: string, amount: number) =>
    apiClient.post(`/discussions/${discussionId}/tokens/grant`, { userId, amount }),

  // 유사 스레드 검색
  findSimilar: (groupId: string, title: string, content?: string) =>
    apiClient.post<any[]>(`/groups/${groupId}/discussions/similar`, { title, content }),
  getRequestedThreads: (groupId: string) =>
    apiClient.get<any[]>(`/groups/${groupId}/tokens/requested-threads`),
};

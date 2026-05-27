import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { discussionsApi } from '../api/discussions';
import { dashboardApi } from '../api/dashboard';
import { groupsApi } from '../api/groups';
import { useAuthStore } from '../stores/authStore';
import { aiApi } from '../api/ai';
import { showToast } from '../api/client';
import { Markdown } from '../components/Markdown';
import { InsightCard } from '../components/InsightCard';
import ReportModal from '../components/ReportModal';
import { timeAgo } from '../utils/timeAgo';
import type { Comment as CommentType, Discussion, ApiError } from '../types';
import { AxiosError } from 'axios';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 16px',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: 16,
    fontSize: 14,
    color: '#C8962E',
  },
  topicSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  topicTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    color: '#3D2E1E',
  },
  topicContent: {
    fontSize: 14,
    color: '#5C4A32',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  attachedImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 420,
    objectFit: 'contain' as const,
    borderRadius: 8,
    border: '1px solid #E8DFD3',
    marginTop: 12,
    marginBottom: 12,
  },
  topicMeta: {
    fontSize: 12,
    color: '#a0aec0',
  },
  memoRef: {
    backgroundColor: '#FFF8E7',
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 13,
    color: '#C8962E',
    marginTop: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: '#3D2E1E',
  },
  commentCard: {
    padding: '16px 0',
    borderBottom: '1px solid #E8DFD3',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 600,
    color: '#3D2E1E',
    marginBottom: 6,
  },
  commentContent: {
    fontSize: 14,
    color: '#5C4A32',
    lineHeight: 1.7,
    marginBottom: 8,
    whiteSpace: 'pre-wrap' as const,
  },
  commentImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 320,
    objectFit: 'contain' as const,
    borderRadius: 8,
    border: '1px solid #E8DFD3',
    marginBottom: 8,
  },
  commentMeta: {
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 8,
  },
  replySection: {
    marginLeft: 24,
    paddingLeft: 12,
    borderLeft: '2px solid #E8DFD3',
  },
  replyCard: {
    padding: '8px 0',
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: 600,
    color: '#5C4A32',
    marginBottom: 2,
  },
  replyContent: {
    fontSize: 13,
    color: '#5C4A32',
    lineHeight: 1.5,
  },
  replyMeta: {
    fontSize: 11,
    color: '#a0aec0',
    marginTop: 2,
  },
  formRow: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    minHeight: 80,
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 6,
    resize: 'vertical' as const,
    lineHeight: 1.6,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  submitBtn: {
    padding: '8px 16px',
    backgroundColor: '#4E342E',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  replyToggle: {
    fontSize: 12,
    color: '#C8962E',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  loading: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#a0aec0',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    color: '#a0aec0',
    fontSize: 14,
  },
  commentsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiButton: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: '#90bce0',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
  },
  aiSummaryResult: {
    backgroundColor: '#FFF8E7',
    padding: '12px 16px',
    borderRadius: 6,
    marginBottom: 16,
    borderLeft: '3px solid #C8962E',
  },
  recommendedBadge: {
    display: 'inline-block',
    backgroundColor: '#fefcbf',
    color: '#975a16',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 8,
  },
};

function DiscussionThreadPage() {
  const { id: discussionId } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [topic, setTopic] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try { currentUserId = JSON.parse(atob(accessToken.split('.')[1] || '')).userId || ''; } catch {}
  }

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [tokenRemaining, setTokenRemaining] = useState<number | null>(null);
  const [tokenRequested, setTokenRequested] = useState(false);

  // Reply forms
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Edit forms
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // AI summary
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Thread insight (종료 시 자동 생성된 인사이트)
  const [threadInsight, setThreadInsight] = useState<any>(null);

  // 신고 모달
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);

  const fetchData = async () => {
    if (!discussionId) return;
    setLoading(true);
    try {
      const [topicRes, commentsRes] = await Promise.all([
        discussionsApi.getById(discussionId).catch(() => ({ data: null })),
        discussionsApi.getComments(discussionId),
      ]);
      setTopic(topicRes.data);
      setComments(commentsRes.data);

      // 발언권 조회
      if (discussionId) {
        const tokenRes = await discussionsApi.getTokens(discussionId).catch(() => ({ data: { remaining: 10, requested: false } }));
        setTokenRemaining(tokenRes.data.remaining);
        setTokenRequested(tokenRes.data.requested);
      }

      // Check if current user is group owner
      if (topicRes.data?.groupId) {
        const groupRes = await groupsApi.getDetail(topicRes.data.groupId).catch(() => ({ data: null }));
        if (groupRes.data) {
          setIsOwner(groupRes.data.ownerId === currentUserId);
        }

        // 종료된 스레드면 인사이트 불러오기
        if (topicRes.data && (topicRes.data as any).status === 'closed' && topicRes.data.groupId) {
          const insightRes = await aiApi.getSavedInsight(topicRes.data.groupId).catch(() => ({ data: null }));
          if (insightRes.data) setThreadInsight(insightRes.data);
        }
      }
    } catch { /* ignore */ }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [discussionId]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !discussionId) return;
    setSubmittingComment(true);
    try {
      await discussionsApi.addComment(discussionId, newComment.trim());
      setNewComment('');
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr?.response?.data?.error?.message;
      if (msg) showToast(msg);
    }
    finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      await discussionsApi.addReply(commentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr?.response?.data?.error?.message;
      if (msg) showToast(msg);
    }
    finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('이 의견을 삭제하시겠습니까?')) return;
    try {
      await dashboardApi.deleteComment(commentId);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('이 답글을 삭제하시겠습니까?')) return;
    try {
      await dashboardApi.deleteReply(replyId);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    setEditSaving(true);
    try {
      await discussionsApi.updateComment(commentId, editCommentContent.trim());
      setEditingCommentId(null);
      setEditCommentContent('');
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      showToast(axiosErr?.response?.data?.error?.message || '수정에 실패했습니다');
    } finally { setEditSaving(false); }
  };

  const handleEditReply = async (replyId: string) => {
    if (!editReplyContent.trim()) return;
    setEditSaving(true);
    try {
      await discussionsApi.updateReply(replyId, editReplyContent.trim());
      setEditingReplyId(null);
      setEditReplyContent('');
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      showToast(axiosErr?.response?.data?.error?.message || '수정에 실패했습니다');
    } finally { setEditSaving(false); }
  };

  const handleAiSummary = async () => {
    if (!discussionId) return;
    setAiLoading(true);
    try {
      const res = await aiApi.summarizeThread(discussionId);
      setAiSummary(res.data.summary);
    } catch {
      alert('AI 요청이 많아 일시적으로 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Link
        to={topic?.groupId ? `/groups/${topic.groupId}/discussions` : '/'}
        style={styles.backLink}
      >
        ← 스레드 목록
      </Link>

      {/* Topic Header */}
      <div style={styles.topicSection}>
        <div style={styles.topicTitle}>
          {topic?.title || '스레드'}
          {topic?.isRecommended && <span style={styles.recommendedBadge}>추천</span>}
        </div>
        {topic?.content && <div style={styles.topicContent}>{topic.content}</div>}
        <div style={styles.topicMeta}>
          {topic?.authorNickname || ''} · {topic?.createdAt ? timeAgo(topic.createdAt) : ''}
          {topic && (topic as any).authorId !== currentUserId && (
            <>
              {' · '}
              <button
                style={{ background: 'none', border: 'none', color: '#e53e3e', fontSize: 12, cursor: 'pointer', padding: 0 }}
                onClick={() => setReportTarget({ type: 'discussion', id: topic.id })}
              >
                신고
              </button>
            </>
          )}
        </div>
        {(topic as any)?.memo && (
          <div style={styles.memoRef}>
            📝 연결된 메모: p.{(topic as any).memo.pageStart}~{(topic as any).memo.pageEnd} — {(topic as any).memo.content.slice(0, 80)}
          </div>
        )}
      </div>

      {/* Thread Insight (종료된 스레드) */}
      {threadInsight && (topic as any)?.status === 'closed' && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📊 인사이트</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 12 }}>
            이 스레드가 종료되어 AI가 자동으로 생성한 인사이트입니다.
          </div>
          <InsightCard insight={threadInsight} />
        </div>
      )}

      {/* Comments List */}
      <div style={styles.section}>
        <div style={styles.commentsHeader}>
          <div style={styles.sectionTitle}>의견 목록</div>
          {comments.length > 0 && (
            <button onClick={handleAiSummary} disabled={aiLoading} style={styles.aiButton}>
              {aiLoading ? '정리 중...' : '🤖 스레드 정리'}
            </button>
          )}
        </div>
        {aiSummary && (
          <div style={styles.aiSummaryResult}>
            <Markdown content={aiSummary} />
          </div>
        )}
        {loading ? (
          <div style={styles.emptyState}>불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div style={styles.emptyState}>아직 의견이 없습니다. 첫 의견을 남겨보세요!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
              <div style={styles.commentAuthor}>{comment.authorNickname}</div>
              {editingCommentId === comment.id ? (
                <div>
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    value={editCommentContent}
                    onChange={(e) => setEditCommentContent(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button style={styles.submitBtn} onClick={() => handleEditComment(comment.id)} disabled={editSaving}>{editSaving ? '...' : '저장'}</button>
                    <button style={{ ...styles.submitBtn, backgroundColor: '#a0aec0' }} onClick={() => setEditingCommentId(null)}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.commentContent}>{comment.content}</div>
                  {comment.imageUrl && <img src={comment.imageUrl} alt="" style={styles.commentImage} />}
                </>
              )}
              <div style={styles.commentMeta}>
                {timeAgo(comment.createdAt)}
                {(
                  <>
                    {' · '}
                    <button
                      style={styles.replyToggle}
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyContent('');
                      }}
                    >
                      {replyingTo === comment.id ? '취소' : '댓글 달기'}
                    </button>
                  </>
                )}
                {comment.authorId === currentUserId && editingCommentId !== comment.id && (
                  <>
                    {' · '}
                    <button style={styles.replyToggle} onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); }}>수정</button>
                  </>
                )}
                {(isOwner || comment.authorId === currentUserId) && (
                  <>
                    {' · '}
                    <button style={{ ...styles.replyToggle, color: '#e53e3e' }} onClick={() => handleDeleteComment(comment.id)}>삭제</button>
                  </>
                )}
                {comment.authorId !== currentUserId && (
                  <>
                    {' · '}
                    <button style={{ ...styles.replyToggle, color: '#e53e3e' }} onClick={() => setReportTarget({ type: 'comment', id: comment.id })}>신고</button>
                  </>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div style={{ marginLeft: 24, marginTop: 8 }}>
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="댓글을 작성해주세요"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      style={styles.submitBtn}
                      onClick={() => handleAddReply(comment.id)}
                      disabled={submittingReply}
                    >
                      {submittingReply ? '...' : '댓글'}
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div style={styles.replySection}>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} style={styles.replyCard}>
                      <div style={styles.replyAuthor}>{reply.authorNickname}</div>
                      {editingReplyId === reply.id ? (
                        <div>
                          <textarea
                            style={{ ...styles.textarea, minHeight: 60 }}
                            rows={2}
                            value={editReplyContent}
                            onChange={(e) => setEditReplyContent(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button style={{ ...styles.submitBtn, fontSize: 12, padding: '5px 12px' }} onClick={() => handleEditReply(reply.id)} disabled={editSaving}>{editSaving ? '...' : '저장'}</button>
                            <button style={{ ...styles.submitBtn, fontSize: 12, padding: '5px 12px', backgroundColor: '#a0aec0' }} onClick={() => setEditingReplyId(null)}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.replyContent}>{reply.content}</div>
                      )}
                      <div style={styles.replyMeta}>
                        {timeAgo(reply.createdAt)}
                        {reply.authorId === currentUserId && editingReplyId !== reply.id && (
                          <>
                            {' · '}
                            <button style={{ ...styles.replyToggle, fontSize: 11 }} onClick={() => { setEditingReplyId(reply.id); setEditReplyContent(reply.content); }}>수정</button>
                          </>
                        )}
                        {(isOwner || reply.authorId === currentUserId) && (
                          <>
                            {' · '}
                            <button style={{ ...styles.replyToggle, color: '#e53e3e', fontSize: 11 }} onClick={() => handleDeleteReply(reply.id)}>삭제</button>
                          </>
                        )}
                        {reply.authorId !== currentUserId && (
                          <>
                            {' · '}
                            <button style={{ ...styles.replyToggle, color: '#e53e3e', fontSize: 11 }} onClick={() => setReportTarget({ type: 'reply', id: reply.id })}>신고</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      {(topic as any)?.status === 'closed' ? (
        <div style={{ ...styles.section, backgroundColor: '#fff5f5', textAlign: 'center' as const }}>
          <div style={{ color: '#c53030', fontSize: 14, fontWeight: 500 }}>🔴 이 스레드는 종료되었습니다. 의견 작성이 불가능합니다.</div>
        </div>
      ) : (
        <div style={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={styles.sectionTitle}>의견 작성</div>
            {!isOwner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: tokenRemaining && tokenRemaining > 3 ? '#48bb78' : '#e53e3e' }}>
                🎫 내 발언권: {tokenRemaining ?? '...'}개
                <span style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
                  onMouseEnter={e => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) tip.style.display = 'block'; }}
                  onMouseLeave={e => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) tip.style.display = 'none'; }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', backgroundColor: '#E8DFD3', color: '#5C4A32', fontSize: 11, fontWeight: 700 }}>?</span>
                  <span data-tip="" style={{ display: 'none', position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#3D2E1E', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 }}>
                    의견/댓글 작성 시 발언권이 차감되며,<br/>삭제해도 돌려받을 수 없으니 신중하게 작성해주세요!
                  </span>
                </span>
                {tokenRemaining !== null && tokenRemaining <= 0 && !tokenRequested && (
                  <button
                    style={{ marginLeft: 6, padding: '2px 8px', fontSize: 11, border: '1px solid #C8962E', borderRadius: 4, backgroundColor: '#fff', color: '#C8962E', cursor: 'pointer' }}
                    onClick={async () => {
                      try {
                        await discussionsApi.requestTokens(discussionId!);
                        setTokenRequested(true);
                        alert('발언권 추가를 요청했습니다.');
                      } catch { alert('이미 요청했습니다.'); }
                    }}
                  >
                    추가 요청
                  </button>
                )}
                {tokenRequested && <span style={{ marginLeft: 4, fontSize: 11, color: '#718096' }}>(요청됨)</span>}
              </div>
            )}
          </div>
          {!isOwner && tokenRemaining !== null && tokenRemaining <= 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: '#e53e3e', fontSize: 13 }}>
              발언권이 부족합니다. 모임장에게 추가 요청하세요.
            </div>
          ) : (
            <form onSubmit={handleAddComment}>
              <textarea
                style={styles.textarea}
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="의견을 작성해주세요"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={submittingComment}
                >
                  {submittingComment ? '작성 중...' : '의견 작성'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

export default DiscussionThreadPage;

import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionsApi } from '../api/discussions';
import { booksApi } from '../api/books';
import { aiApi, type AiTopic } from '../api/ai';
import { showToast } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { Discussion, BookSearchResult, RecommendedTopic, ApiError } from '../types';
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
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
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
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  helpText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 6,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
    minHeight: 80,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
  },
  button: {
    padding: '10px 24px',
    backgroundColor: '#4E342E',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  discussionItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
  },
  discussionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#3D2E1E',
    marginBottom: 4,
  },
  discussionMeta: {
    fontSize: 12,
    color: '#a0aec0',
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
  recCard: {
    padding: '12px 16px',
    border: '1px dashed #C8962E',
    borderRadius: 6,
    marginBottom: 8,
    cursor: 'pointer',
    backgroundColor: '#FFF8E7',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#C8962E',
    marginBottom: 4,
  },
  recContent: {
    fontSize: 13,
    color: '#5C4A32',
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  searchButton: {
    padding: '10px 18px',
    backgroundColor: '#4E342E',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  clearButton: {
    padding: '10px 14px',
    backgroundColor: '#fff',
    color: '#8B7355',
    border: '1px solid #E8DFD3',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  filterBtn: {
    padding: '6px 14px',
    fontSize: 13,
    border: '1px solid #ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#4E342E',
    color: '#fff',
    borderColor: '#C8962E',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    color: '#a0aec0',
    fontSize: 14,
  },
  serverError: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '10px 12px',
    borderRadius: 4,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 640,
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#3D2E1E',
  },
  closeBtn: {
    padding: '6px 12px',
    fontSize: 20,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#718096',
    lineHeight: 1,
  },
  guideOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: 16,
  },
  guideModal: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    border: '1px solid #E8DFD3',
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#3D2E1E',
    marginBottom: 12,
  },
  guideList: {
    margin: '0 0 20px',
    paddingLeft: 20,
    color: '#5C4A32',
    fontSize: 14,
    lineHeight: 1.8,
  },
  guideButton: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: '#4E342E',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  createBtn: {
    padding: '10px 20px',
    backgroundColor: '#4E342E',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid #E8DFD3',
    backgroundColor: '#FFF8E7',
    color: '#5C4A32',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer',
    lineHeight: 1,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fileButton: {
    display: 'inline-block',
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#C8962E',
    backgroundColor: '#FFF8E7',
    border: '1px solid #E8DFD3',
    borderRadius: 6,
    cursor: 'pointer',
  },
  imagePreview: {
    width: 120,
    height: 80,
    objectFit: 'cover' as const,
    borderRadius: 6,
    border: '1px solid #E8DFD3',
  },
};

function DiscussionsPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([]);
  const [aiTopics, setAiTopics] = useState<AiTopic[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [activePage, setActivePage] = useState(1);
  const [bookTitleSearch, setBookTitleSearch] = useState('');
  const [appliedBookTitleSearch, setAppliedBookTitleSearch] = useState('');
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const PAGE_SIZE = 5;

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 책 검색
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const [bookSearching, setBookSearching] = useState(false);

  // 수정 상태
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try {
      const token = accessToken;
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1] || ''));
      currentUserId = payload.userId || '';
    } catch { /* ignore */ }
  }

  const fetchData = async (bookTitle = appliedBookTitleSearch) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [discRes, recRes] = await Promise.all([
        discussionsApi.listByGroup(groupId!, bookTitle.trim() ? { bookTitle: bookTitle.trim() } : undefined),
        discussionsApi.getRecommendations(groupId!).catch(() => ({ data: [] as RecommendedTopic[] })),
      ]);
      setDiscussions(discRes.data);
      setRecommendations(recRes.data);
    } catch {
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  useEffect(() => {
    if (sessionStorage.getItem('showDemoThreadGuide') === 'true') {
      setShowDemoGuide(true);
      sessionStorage.removeItem('showDemoThreadGuide');
    }
  }, []);

  const closeDemoGuide = () => {
    setShowDemoGuide(false);
  };

  const handleBookTitleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = bookTitleSearch.trim();
    setAppliedBookTitleSearch(query);
    setActivePage(1);
    fetchData(query);
  };

  const clearBookTitleSearch = () => {
    setBookTitleSearch('');
    setAppliedBookTitleSearch('');
    setActivePage(1);
    fetchData('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal]);

  const handleBookSearch = async () => {
    if (!bookQuery.trim()) return;
    setBookSearching(true);
    try {
      const { data } = await booksApi.search(bookQuery.trim());
      setBookResults(data);
    } catch {
      setBookResults([]);
    } finally {
      setBookSearching(false);
    }
  };

  // 수정 모달 열릴 때 값 세팅
  useEffect(() => {
    if (editingDiscussion) {
      setEditTitle(editingDiscussion.title);
      setEditContent((editingDiscussion as any).content || '');
      setEditEndDate((editingDiscussion as any).endDate ? (new Date((editingDiscussion as any).endDate).toISOString().split('T')[0] ?? '') : '');
    }
  }, [editingDiscussion]);

  const handleEditSubmit = async () => {
    if (!editingDiscussion || !editTitle.trim()) return;
    setEditSaving(true);
    try {
      await discussionsApi.updateTopic(editingDiscussion.id, {
        title: editTitle.trim(),
        content: editContent.trim() || undefined,
        endDate: editEndDate || undefined,
      });
      setEditingDiscussion(null);
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      showToast(axiosErr.response?.data?.error?.message || '수정에 실패했습니다');
    } finally { setEditSaving(false); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs: Record<string, string> = {};
    if (!formTitle.trim()) errs.title = '제목을 입력해주세요';
    if (!formContent.trim()) errs.content = '내용을 입력해주세요';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!groupId) return;

    setSubmitting(true);
    try {
      await discussionsApi.create(groupId!, {
        title: formTitle.trim(),
        content: formContent.trim(),
        bookTitle: selectedBook?.title || undefined,
        bookCoverUrl: selectedBook?.coverImageUrl || undefined,
      });
      setFormTitle('');
      setFormContent('');
      setSelectedBook(null);
      setBookQuery('');
      setBookResults([]);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setServerError(axiosErr.response?.data?.error?.message || '스레드 생성에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectRecommendation = async (rec: RecommendedTopic) => {
    if (!groupId) return;
    try {
      await discussionsApi.create(groupId!, {
        title: rec.title,
        content: rec.content,
      });
      setShowCreateModal(false);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleAiSuggest = async () => {
    if (!groupId) return;
    setAiLoading(true);
    try {
      const res = await aiApi.suggestTopics(groupId);
      setAiTopics(res.data.topics || []);
    } catch {
      alert('AI 요청이 많아 일시적으로 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectAiTopic = async (topic: AiTopic) => {
    if (!groupId) return;
    try {
      await discussionsApi.create(groupId, {
        title: topic.title,
        content: topic.content,
      });
      setAiTopics([]);
      setShowCreateModal(false);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowCreateModal(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💬 스레드</h1>

      {showDemoGuide && (
        <div style={styles.guideOverlay} onClick={closeDemoGuide}>
          <div style={styles.guideModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.guideTitle}>스레드 체험 방법</div>
            <ol style={styles.guideList}>
              <li>목록에서 관심 있는 스레드를 눌러 다른 사람의 의견을 읽어보세요.</li>
              <li>의견 작성란에 자신의 생각을 남기세요.</li>
              <li>새 이야기를 시작하고 싶다면 스레드 만들기를 누르세요. 제목과 내용, 책 제목을 검색해 입력하면 새로운 스레드가 만들어집니다.</li>
              <li>책 이름 검색으로 관련 스레드를 빠르게 찾을 수 있습니다.</li>
            </ol>
            <button type="button" style={styles.guideButton} onClick={closeDemoGuide}>
              시작하기
            </button>
          </div>
        </div>
      )}

      {/* 헤더: 스레드 만들기 버튼 */}
      <div style={styles.headerRow}>
        <div />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            style={styles.helpBtn}
            onClick={() => setShowDemoGuide(true)}
            aria-label="스레드 사용 방법 보기"
            title="스레드 사용 방법"
          >
            ?
          </button>
          <button
            style={styles.createBtn}
            onClick={() => {
              setShowCreateModal(true);
            }}
          >
            + 스레드 만들기
          </button>
        </div>
      </div>

      {/* 스레드 목록 */}
      <div style={styles.section}>
        <form onSubmit={handleBookTitleSearch} style={styles.searchBar}>
          <input
            type="text"
            style={styles.input}
            value={bookTitleSearch}
            onChange={(e) => setBookTitleSearch(e.target.value)}
            placeholder="책 이름으로 스레드 검색"
            aria-label="책 이름으로 스레드 검색"
          />
          <button type="submit" style={styles.searchButton}>검색</button>
          {appliedBookTitleSearch && (
            <button type="button" style={styles.clearButton} onClick={clearBookTitleSearch}>초기화</button>
          )}
        </form>

        {/* 정렬 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <select
            style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }}
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value as 'newest' | 'oldest' | 'popular');
              setActivePage(1);
            }}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="popular">답글 많은순</option>
          </select>
        </div>

        {(() => {
          const filtered = discussions.filter((d: any) => d.status !== 'closed');
          const sorted = [...filtered].sort((a: any, b: any) => {
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            return (b.commentCount || 0) - (a.commentCount || 0);
          });
          const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
          const paged = sorted.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

          if (loading) return <div style={styles.emptyState}>불러오는 중...</div>;
          if (sorted.length === 0) return <div style={styles.emptyState}>아직 스레드가 없습니다. 첫 스레드를 만들어보세요!</div>;

          return (
            <>
              {paged.map((d: any) => (
                <div
                  key={d.id}
                  style={{ ...styles.discussionItem, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => navigate(`/discussions/${d.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {d.imageUrl && (
                        <img src={d.imageUrl} alt="" style={{ width: 32, height: 46, objectFit: 'contain', borderRadius: 3, flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={styles.discussionTitle}>
                          {d.title}
                          {d.endDate && <span style={{ fontSize: 11, color: '#718096', marginLeft: 8 }}>~{new Date(d.endDate).toLocaleDateString()}</span>}
                          {d.status === 'closed' && <span style={{ fontSize: 11, backgroundColor: '#fed7d7', color: '#c53030', padding: '2px 8px', borderRadius: 12, marginLeft: 8 }}>종료</span>}
                          {d.commentCount > 0 && <span style={{ fontSize: 11, color: '#a0aec0', marginLeft: 8 }}>💬 {d.commentCount}</span>}
                        </div>
                        <div style={styles.discussionMeta}>
                          {d.authorNickname} · {new Date(d.createdAt).toLocaleDateString()}
                          {d.bookTitle && <> · 📖 {d.bookTitle}</>}
                        </div>
                      </div>
                    </div>
                  </div>
                  {d.authorId === currentUserId && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingDiscussion(d); }}
                        style={{ padding: '3px 10px', fontSize: 11, color: '#C8962E', background: 'none', border: '1px solid #E8DFD3', borderRadius: 4, cursor: 'pointer' }}
                      ><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 3 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>수정</button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('이 스레드를 삭제하시겠습니까?')) return;
                          try {
                            await discussionsApi.deleteTopic(d.id);
                            fetchData();
                          } catch (err) {
                            const axiosErr = err as AxiosError<ApiError>;
                            showToast(axiosErr.response?.data?.error?.message || '삭제에 실패했습니다');
                          }
                        }}
                        style={{ padding: '3px 10px', fontSize: 11, color: '#e53e3e', background: 'none', border: '1px solid #fed7d7', borderRadius: 4, cursor: 'pointer' }}
                      ><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 3 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>삭제</button>
                    </div>
                  )}
                </div>
              ))}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, backgroundColor: p === activePage ? '#C8962E' : '#fff', color: p === activePage ? '#fff' : '#333', cursor: 'pointer' }}
                      onClick={() => setActivePage(p)}
                    >{p}</button>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* 스레드 만들기 모달 */}
      {showCreateModal && (
        <div style={styles.overlay} onClick={handleOverlayClick}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>💬 스레드 만들기</div>
              <button style={styles.closeBtn} onClick={() => setShowCreateModal(false)} aria-label="닫기">×</button>
            </div>

            {/* 직접 작성 폼 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...styles.sectionTitle, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>직접 작성</div>
              <form onSubmit={handleSubmit} noValidate>

                <div style={styles.field}>
                  <label style={styles.label}>제목 *</label>
                  <input
                    type="text"
                    style={{ ...styles.input, ...(formErrors.title ? styles.inputError : {}) }}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="제목을 입력해주세요"
                  />
                  {formErrors.title && <div style={styles.errorText}>{formErrors.title}</div>}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>내용 *</label>
                  <textarea
                    style={styles.textarea}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="내용을 입력해주세요"
                  />
                  {formErrors.content && <div style={styles.errorText}>{formErrors.content}</div>}
                </div>

                {/* 책 검색 연결 */}
                <div style={styles.field}>
                  <label style={styles.label}>📖 책 연결 (선택)</label>
                  {!selectedBook ? (
                    <>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          style={{ ...styles.input, flex: 1 }}
                          value={bookQuery}
                          onChange={(e) => setBookQuery(e.target.value)}
                          placeholder="책 제목을 검색하세요"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleBookSearch();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleBookSearch}
                          disabled={bookSearching}
                          style={{ padding: '8px 14px', backgroundColor: '#4E342E', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {bookSearching ? '...' : '검색'}
                        </button>
                      </div>
                      {bookResults.length > 0 && (
                        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #E8DFD3', borderRadius: 6, marginTop: 8 }}>
                          {bookResults.map((b, i) => (
                            <div
                              key={i}
                              style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                              onClick={() => { setSelectedBook(b); setBookResults([]); }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF8E7')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                              {b.coverImageUrl && (
                                <img src={b.coverImageUrl} alt="" style={{ width: 32, height: 46, objectFit: 'contain', borderRadius: 2, flexShrink: 0 }} />
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>{b.title}</div>
                                <div style={{ fontSize: 11, color: '#718096' }}>{b.author}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#FFF8E7', borderRadius: 8, border: '1px solid #E8DFD3' }}>
                      {selectedBook.coverImageUrl && (
                        <img src={selectedBook.coverImageUrl} alt="" style={{ width: 40, height: 56, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#3D2E1E' }}>{selectedBook.title}</div>
                        <div style={{ fontSize: 12, color: '#718096' }}>{selectedBook.author}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedBook(null); setBookQuery(''); }}
                        style={{ background: 'none', border: 'none', color: '#C8962E', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                      >변경</button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
                  disabled={submitting}
                >
                  {submitting ? '생성 중...' : '스레드 만들기'}
                </button>
                {serverError && (
                  <div style={{ marginTop: 10, padding: '10px 14px', backgroundColor: '#fff5f5', color: '#e53e3e', borderRadius: 6, fontSize: 13 }}>
                    {serverError}
                  </div>
                )}
              </form>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E8DFD3', margin: '20px 0' }} />

            {/* AI 스레드 주제 제안 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={styles.sectionTitle}>🤖 AI 스레드 주제 제안</div>
                <button
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  style={{ ...styles.button, padding: '8px 16px', fontSize: 13, backgroundColor: '#90bce0', color: '#fff', ...(aiLoading ? styles.buttonDisabled : {}) }}
                >
                  {aiLoading ? '생성 중...' : '🤖 AI 주제 생성'}
                </button>
              </div>
              {aiTopics.length > 0 && aiTopics.map((topic, i) => (
                <div
                  key={i}
                  style={{ ...styles.recCard, borderColor: '#C8962E', backgroundColor: '#FFF8E7' }}
                  onClick={() => handleSelectAiTopic(topic)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectAiTopic(topic)}
                >
                  <div style={{ ...styles.recTitle, color: '#4E342E' }}>🤖 {topic.title}</div>
                  <div style={styles.recContent}>{topic.content}</div>
                </div>
              ))}
              {aiTopics.length === 0 && !aiLoading && (
                <div style={styles.emptyState}>
                  버튼을 눌러 AI가 스레드 주제를 제안합니다. 원하는 주제를 클릭하면 바로 스레드로 등록됩니다.
                </div>
              )}
            </div>

            {/* 추천 주제 */}
            {recommendations.length > 0 && (
              <div>
                <hr style={{ border: 'none', borderTop: '1px solid #E8DFD3', margin: '20px 0' }} />
                <div style={styles.sectionTitle}>✨ 추천 주제</div>
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={styles.recCard}
                    onClick={() => handleSelectRecommendation(rec)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectRecommendation(rec)}
                  >
                    <div style={styles.recTitle}>{rec.title}</div>
                    <div style={styles.recContent}>{rec.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingDiscussion && (
        <div style={styles.overlay} onClick={() => setEditingDiscussion(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ ...styles.modalTitle, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>스레드 수정</div>
              <button style={styles.closeBtn} onClick={() => setEditingDiscussion(null)} aria-label="닫기">×</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>제목</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={styles.input} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>내용</label>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ ...styles.input, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit' }} />
              </div>
              <button onClick={handleEditSubmit} disabled={editSaving} style={styles.button}>
                {editSaving ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscussionsPage;

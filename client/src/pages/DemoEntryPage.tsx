import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FDF8F0 0%, #F5E6D3 100%)',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 20px 60px rgba(61,46,30,0.12)',
    border: '1px solid #E8DFD3',
    textAlign: 'center' as const,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#3D2E1E',
    marginBottom: 8,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 32,
    lineHeight: 1.6,
  },
  description: {
    fontSize: 14,
    color: '#5C4A32',
    lineHeight: 1.8,
    marginBottom: 32,
    padding: '16px 20px',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    border: '1px solid #E8DFD3',
    textAlign: 'left' as const,
  },
  field: {
    marginBottom: 20,
    textAlign: 'left' as const,
  },
  label: {
    display: 'block',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#5C4A32',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: '2px solid #E8DFD3',
    borderRadius: 12,
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '16px 0',
    background: 'linear-gradient(135deg, #4E342E 0%, #3D2E1E 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(78,52,46,0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    letterSpacing: '0.3px',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: '#a0aec0',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    textAlign: 'left' as const,
  },
  featureItem: {
    padding: '6px 0',
    fontSize: 14,
    color: '#5C4A32',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center' as const,
  },
};

function DemoEntryPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.demo(nickname.trim());
      setTokens(data.accessToken, data.refreshToken);
      setUser({ id: '', email: '', nickname: data.nickname, createdAt: '' });
      sessionStorage.setItem('showDemoThreadGuide', 'true');

      if (data.groupId) {
        navigate(`/groups/${data.groupId}/discussions`);
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message;
      setError(msg || '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/favicon.svg" alt="버지페이지" style={styles.logo} />
        <h1 style={styles.title}>버지페이지</h1>
        <p style={styles.subtitle}>독서 모임 스레드 체험</p>

        <div style={styles.description}>
          <ul style={styles.featureList}>
            <li style={styles.featureItem}>💬 스레드에서 다른 독자들과 의견을 나눠보세요</li>
            <li style={styles.featureItem}>💡 댓글과 답글로 깊이 있는 토론을 경험하세요</li>
            <li style={styles.featureItem}>🤖 AI가 토론 내용을 정리해드립니다</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="demo-nickname">닉네임</label>
            <input
              id="demo-nickname"
              type="text"
              style={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사용할 닉네임을 입력하세요"
              autoFocus
            />
          </div>

          {error && <div style={styles.errorText}>{error}</div>}

          <button
            type="submit"
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            disabled={loading}
          >
            {loading ? '준비 중...' : '🐝 체험 시작하기'}
          </button>
        </form>

        <div style={styles.footer}>
          닉네임을 입력하면 체험 계정이 자동으로 생성됩니다
        </div>
      </div>
    </div>
  );
}

export default DemoEntryPage;

import { Router, Response } from 'express';
import multer from 'multer';
import { discussionService } from '../services/discussion.service';
import { similarThreadService } from '../services/similar-thread.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { CreateDiscussionSchema, CreateCommentSchema } from '../validators';
import { isAllowedImageType, saveCommentImage, saveThreadImage } from '../services/file-storage.service';

const router = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImageType(file.mimetype)) {
      cb(new AppError(400, 'VALIDATION_ERROR', 'JPG, PNG, GIF, WEBP 형식의 이미지만 사용할 수 있습니다'));
      return;
    }
    cb(null, true);
  },
});

// GET /api/groups/:groupId/discussions/remaining
router.get('/groups/:groupId/discussions/remaining', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await discussionService.getRemainingCount(req.params.groupId as string, req.user!.userId);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// GET /api/groups/:groupId/discussions
router.get('/groups/:groupId/discussions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authorId = typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const participantId = typeof req.query.participantId === 'string' ? req.query.participantId : undefined;
    const bookTitle = typeof req.query.bookTitle === 'string' ? req.query.bookTitle : undefined;
    const discussions = await discussionService.listTopics(
      req.params.groupId as string,
      { ...(authorId && { authorId }), ...(status && { status }), ...(participantId && { participantId }), ...(bookTitle && { bookTitle }) },
    );
    res.json(discussions);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// POST /api/groups/:groupId/discussions
router.post('/groups/:groupId/discussions', authMiddleware, imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const body = {
      ...req.body,
      memoId: req.body.memoId || undefined,
      endDate: req.body.endDate || undefined,
      content: req.body.content || undefined,
      bookTitle: req.body.bookTitle || undefined,
    };
    const parsed = CreateDiscussionSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
      return;
    }

    // 이미지: 파일 업로드 또는 책 커버 URL
    const imageUrl = req.file
      ? await saveThreadImage(req.file)
      : (req.body.bookCoverUrl || undefined);

    const discussion = await discussionService.createTopic(
      req.params.groupId as string,
      req.user!.userId,
      parsed.data,
      imageUrl,
    );
    res.status(201).json(discussion);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// GET /api/discussions/:id
router.get('/discussions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const discussion = await discussionService.getById(req.params.id as string);
    res.json(discussion);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// GET /api/discussions/:id/comments
router.get('/discussions/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const comments = await discussionService.getComments(req.params.id as string);
    res.json(comments);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// POST /api/discussions/:id/comments
router.post('/discussions/:id/comments', authMiddleware, imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
      return;
    }

    const imageUrl = req.file ? await saveCommentImage(req.file) : undefined;
    const comment = await discussionService.addComment(
      req.params.id as string,
      req.user!.userId,
      parsed.data.content,
      imageUrl,
    );
    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// POST /api/comments/:id/replies
router.post('/comments/:id/replies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
      return;
    }

    const reply = await discussionService.addReply(
      req.params.id as string,
      req.user!.userId,
      parsed.data.content,
    );
    res.status(201).json(reply);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// PUT /api/comments/:id - 의견 수정 (작성자)
router.put('/comments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '내용을 입력해주세요' } });
      return;
    }
    const result = await discussionService.updateComment(req.params.id as string, req.user!.userId, content.trim());
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// PUT /api/replies/:id - 댓글 수정 (작성자)
router.put('/replies/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '내용을 입력해주세요' } });
      return;
    }
    const result = await discussionService.updateReply(req.params.id as string, req.user!.userId, content.trim());
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// PATCH /api/discussions/:id/end-date - 종료일 수정 (방장)
router.patch('/discussions/:id/end-date', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { endDate } = req.body;
    if (!endDate) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '종료일을 입력해주세요' } });
      return;
    }
    const result = await discussionService.updateEndDate(req.params.id as string, req.user!.userId, endDate);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// PUT /api/discussions/:id - 스레드 수정 (작성자)
router.put('/discussions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, endDate } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' } });
      return;
    }
    const result = await discussionService.updateTopic(req.params.id as string, req.user!.userId, { title: title.trim(), content: content?.trim() || null, endDate: endDate || null });
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// DELETE /api/discussions/:id - 스레드 삭제 (작성자, 댓글 없는 경우만)
router.delete('/discussions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await discussionService.deleteTopic(req.params.id as string, req.user!.userId);
    res.json({ message: '스레드가 삭제되었습니다' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// POST /api/discussions/:id/pin - 대표 스레드 설정 (방장)
router.post('/discussions/:id/pin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await discussionService.pinThread(req.params.id as string, req.user!.userId);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// DELETE /api/discussions/:id/pin - 대표 스레드 해제 (방장)
router.delete('/discussions/:id/pin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await discussionService.unpinThread(req.params.id as string, req.user!.userId);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// GET /api/groups/:groupId/discussions/recommendations
router.get('/groups/:groupId/discussions/recommendations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recommendations = await discussionService.getRecommendations(req.params.groupId as string);
    res.json(recommendations);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// POST /api/groups/:groupId/discussions/recommendations/select
router.post('/groups/:groupId/discussions/recommendations/select', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, keywords, memoIds } = req.body;
    if (!title) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '추천 주제 정보가 필요합니다',
        },
      });
      return;
    }

    const discussion = await discussionService.createFromRecommendation(
      req.params.groupId as string,
      req.user!.userId,
      { title, content, keywords: keywords || [], memoIds: memoIds || [] },
    );
    res.status(201).json(discussion);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// POST /api/groups/:groupId/discussions/similar — 유사 스레드 검색
router.post('/groups/:groupId/discussions/similar', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' } });
      return;
    }
    const results = await similarThreadService.findSimilar(req.params.groupId as string, title, content);
    res.json(results);
  } catch (err: any) {
    console.error('[Similar thread error]', err?.message || err);
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

export default router;

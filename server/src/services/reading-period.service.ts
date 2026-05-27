import { AppError } from './auth.service';

const READING_PERIOD_NOT_STARTED_MESSAGE = '독서기간이 시작되지 않아 아직 작성, 수정, 삭제할 수 없습니다';
const READING_PERIOD_ENDED_MESSAGE = '독서기간이 종료되어 더 이상 작성, 수정, 삭제할 수 없습니다';

export function hasReadingPeriodNotStarted(readingStartDate: Date, now = new Date()): boolean {
  const startOfReadingDay = new Date(readingStartDate);
  startOfReadingDay.setHours(0, 0, 0, 0);
  return startOfReadingDay > now;
}

export function hasReadingPeriodEnded(readingEndDate: Date, now = new Date()): boolean {
  const endOfReadingDay = new Date(readingEndDate);
  endOfReadingDay.setHours(23, 59, 59, 999);
  return endOfReadingDay < now;
}

export function assertReadingPeriodOpen(readingStartDate: Date, readingEndDate: Date): void {
  // 전시회(데모) 모드에서는 독서기간 제한 비활성화
  if (process.env.DEMO_MODE === 'true') return;

  if (hasReadingPeriodNotStarted(readingStartDate)) {
    throw new AppError(403, 'READING_PERIOD_NOT_STARTED', READING_PERIOD_NOT_STARTED_MESSAGE);
  }
  if (hasReadingPeriodEnded(readingEndDate)) {
    throw new AppError(403, 'READING_PERIOD_ENDED', READING_PERIOD_ENDED_MESSAGE);
  }
}

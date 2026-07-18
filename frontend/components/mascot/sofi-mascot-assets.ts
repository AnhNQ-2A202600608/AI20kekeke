export type SofiMascotState =
  | 'idle'
  | 'thinking'
  | 'correct'
  | 'wrong'
  | 'coach'
  | 'mastery'
  | 'loading'
  | 'soft_error';

export type SofiMascotOneShotState = Exclude<SofiMascotState, 'idle' | 'loading'>;

export type SofiMascotAsset = {
  state: SofiMascotState;
  fileName: string;
  alt: string;
  prompt: string;
  durationMs: number;
};

const MASCOT_BASE_PATH = '/mascot/sofi';

export const SOFI_MASCOT_ASSETS: Record<SofiMascotState, SofiMascotAsset> = {
  idle: {
    state: 'idle',
    fileName: 'mentora-fox-idle-welcome.webp',
    alt: 'Sofi the Mentora fox mascot welcoming the learner',
    prompt: 'Sẵn sàng học tiếp.',
    durationMs: 0,
  },
  thinking: {
    state: 'thinking',
    fileName: 'mentora-fox-thinking.webp',
    alt: 'Sofi the Mentora fox mascot thinking',
    prompt: 'Sofi đang chuẩn bị gợi ý.',
    durationMs: 1500,
  },
  correct: {
    state: 'correct',
    fileName: 'mentora-fox-correct-answer.webp',
    alt: 'Sofi the Mentora fox mascot celebrating a correct answer',
    prompt: 'Chính xác. Giữ nhịp này.',
    durationMs: 1400,
  },
  wrong: {
    state: 'wrong',
    fileName: 'mentora-fox-wrong-answer-encouragement.webp',
    alt: 'Sofi the Mentora fox mascot encouraging another attempt',
    prompt: 'Chưa đúng. Thử tách bài thành bước nhỏ hơn.',
    durationMs: 1600,
  },
  coach: {
    state: 'coach',
    fileName: 'mentora-fox-quiz-coach.webp',
    alt: 'Sofi the Mentora fox mascot coaching the learner',
    prompt: 'Nhìn vào quan hệ giữa khái niệm và câu hỏi.',
    durationMs: 1700,
  },
  mastery: {
    state: 'mastery',
    fileName: 'mentora-fox-level-up-mastery.webp',
    alt: 'Sofi the Mentora fox mascot celebrating mastery',
    prompt: 'Đã đạt mastery cho phần này.',
    durationMs: 2200,
  },
  loading: {
    state: 'loading',
    fileName: 'mentora-fox-loading-reading.webp',
    alt: 'Sofi the Mentora fox mascot reading while loading',
    prompt: 'Đang tải dữ liệu học tập...',
    durationMs: 0,
  },
  soft_error: {
    state: 'soft_error',
    fileName: 'mentora-fox-error-apology.webp',
    alt: 'Sofi the Mentora fox mascot apologizing for a recoverable issue',
    prompt: 'Có lỗi nhẹ, thử lại là được.',
    durationMs: 1400,
  },
};

export const PRELOAD_SOFI_MASCOT_STATES: SofiMascotState[] = [
  'idle',
  'loading',
  'thinking',
  'correct',
  'wrong',
];

export function getSofiMascotSrc(
  state: SofiMascotState,
  size: 512 | 1024 = 512,
) {
  return `${MASCOT_BASE_PATH}/${size}/${SOFI_MASCOT_ASSETS[state].fileName}`;
}

export function getSofiMascotSrcSet(state: SofiMascotState) {
  return `${getSofiMascotSrc(state, 512)} 512w, ${getSofiMascotSrc(state, 1024)} 1024w`;
}

export function preloadSofiMascotAssets(states = PRELOAD_SOFI_MASCOT_STATES) {
  if (typeof window === 'undefined') return;

  states.forEach((state) => {
    const image = new Image();
    image.src = getSofiMascotSrc(state, 512);
  });
}

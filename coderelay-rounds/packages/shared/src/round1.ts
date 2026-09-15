export type Round1State =
  | 'DRAFT'
  | 'READY'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'ACTIVE'
  | 'SUBMISSION'
  | 'LOCKED'
  | 'SCORING'
  | 'QUALIFICATION'
  | 'COMPLETE';

export interface SaveAnswerDto {
  questionId: string;
  selectedOptionId?: string;
  selectedLabel?: string;
  answerText?: string;
}

export interface SubmitRound1Dto {
  confirmation: boolean;
}

export interface Round1StateTransitionDto {
  targetState: Round1State;
  countdownSeconds?: number;
  qualificationRatio?: number;
  qualificationCount?: number;
}

export interface Round1LeaderboardEntry {
  rank: number;
  teamId: string;
  teamCode: string;
  teamName: string;
  representativeName: string;
  score: number;
  submittedAt: string | null;
  isQualified: boolean;
  requiresReview?: boolean;
}

export interface Round1WebSocketPayload {
  event:
    | 'ROUND_STATE_UPDATED'
    | 'ROUND_STARTED'
    | 'ROUND_DEADLINE'
    | 'PARTICIPANT_SUBMITTED'
    | 'ROUND_LOCKED'
    | 'RESULTS_READY';
  roundId: string;
  state: Round1State;
  startedAt?: string;
  deadlineAt?: string;
  remainingSeconds?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Round1ParticipantStateResponse {
  state: Round1State;
  startedAt: string | null;
  deadlineAt: string | null;
  remainingSeconds: number;
  isSubmitted: boolean;
  submittedAt: string | null;
  representativeId: string;
  representativeName: string;
  teamId: string;
  teamCode: string;
  teamName: string;
  answeredQuestionIds: string[];
}

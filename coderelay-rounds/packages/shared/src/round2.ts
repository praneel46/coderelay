export type Round2State =
  | 'DRAFT'
  | 'READY'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'MEMBER_1_ACTIVE'
  | 'MEMBER_1_HANDOFF'
  | 'MEMBER_2_ACTIVE'
  | 'MEMBER_2_HANDOFF'
  | 'MEMBER_3_ACTIVE'
  | 'MEMBER_3_FINALIZE'
  | 'LOCKED'
  | 'SCORING'
  | 'COMPLETE';

export type Round2StageType = 'DEBUGGING' | 'CODING' | 'PREDICT_OUTPUT';

export interface SaveRound2AnswerDto {
  questionId: string;
  selectedOptionId?: string;
  selectedLabel?: string;
  answerText?: string;
  codeContent?: string;
}

export interface SubmitRound2StageDto {
  confirmation: boolean;
}

export interface Round2StateTransitionDto {
  targetState: Round2State;
}

export interface ReportSecurityEventDto {
  violationType: 'TAB_SWITCH' | 'VISIBILITY_CHANGE' | 'FULLSCREEN_EXIT' | 'COPY' | 'PASTE';
  details?: string;
}

export interface Round2LeaderboardEntry {
  rank: number;
  teamId: string;
  teamCode: string;
  teamName: string;
  currentStageOrder: number;
  activeMemberOrder: number;
  stageStatus: string;
  warningCount: number;
  score: number;
  submittedAt: string | null;
  isQualified: boolean;
  requiresReview?: boolean;
}

export interface Round2WebSocketPayload {
  event:
    | 'ROUND2_STATE_UPDATED'
    | 'ROUND2_STARTED'
    | 'ROUND_LOADED'
    | 'ROUND_PAUSED'
    | 'ROUND_RESUMED'
    | 'ROUND_RESET'
    | 'ROUND_ENDED'
    | 'STAGE_STARTED'
    | 'STAGE_DEADLINE'
    | 'STAGE_SUBMITTED'
    | 'STAGE_HANDOFF'
    | 'SECURITY_WARNING'
    | 'STAGE_AUTO_SUBMITTED'
    | 'ROUND2_LOCKED'
    | 'RESULTS_READY';
  roundId: string;
  state: Round2State;
  teamId?: string;
  stageOrder?: number;
  memberOrder?: number;
  startedAt?: string;
  deadlineAt?: string;
  remainingSeconds?: number;
  warningCount?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Round2ParticipantStateResponse {
  roundState: Round2State;
  teamId: string;
  teamCode: string;
  teamName: string;
  memberId: string;
  memberName: string;
  memberOrder: number; // 1, 2, or 3
  activeStageOrder: number; // 1, 2, or 3
  activeRole: Round2StageType; // DEBUGGING, CODING, PREDICT_OUTPUT
  isCurrentMemberActive: boolean;
  stageStatus: string; // PENDING, ACTIVE, SUBMITTED, TIMED_OUT, FORCE_SUBMITTED
  startedAt: string | null;
  deadlineAt: string | null;
  remainingSeconds: number;
  warningCount: number;
  isSubmitted: boolean;
  isAutoSubmitted: boolean;
  submittedAt: string | null;
  answeredQuestionIds: string[];
}

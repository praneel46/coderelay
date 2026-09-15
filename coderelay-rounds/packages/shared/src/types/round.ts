import { RoundSlug, RoundStatus, StageStatus } from '../constants/rounds.js';

export interface RoundStage {
  id: string;
  roundId: string;
  stageOrder: number;
  title: string;
  durationSeconds: number;
  memberOrder?: 1 | 2 | 3;
}

export interface Round {
  id: string;
  roundNumber: 1 | 2 | 3 | 4;
  slug: RoundSlug;
  title: string;
  description: string;
  status: RoundStatus;
  durationSeconds: number;
  stages?: RoundStage[];
  startedAt?: string;
  endedAt?: string;
}

export interface StageSession {
  id: string;
  participantSessionId: string;
  stageId: string;
  memberId?: string;
  status: StageStatus;
  startedAt?: string;
  endedAt?: string;
  warningCount: number;
}

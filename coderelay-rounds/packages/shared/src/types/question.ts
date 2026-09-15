export enum QuestionType {
  MCQ = 'MCQ',
  PREDICT_OUTPUT = 'PREDICT_OUTPUT',
  DEBUGGING = 'DEBUGGING',
  CODING = 'CODING',
}

export enum QuestionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LOCKED = 'LOCKED',
}

export interface QuestionOption {
  id: string;
  label: string;
  content: string;
  displayOrder: number;
}

export interface OrganizerQuestionOption extends QuestionOption {
  isCorrect: boolean;
}

export interface ParticipantQuestion {
  id: string;
  roundId: string;
  stageId?: string | null;
  title: string;
  description: string;
  type: QuestionType;
  points: number;
  initialCode?: string | null;
  options?: QuestionOption[];
}

export interface OrganizerQuestion {
  id: string;
  roundId: string;
  stageId?: string | null;
  title: string;
  description: string;
  type: QuestionType;
  points: number;
  initialCode?: string | null;
  testCases?: any;
  status: QuestionStatus;
  displayOrder: number;
  options: OrganizerQuestionOption[];
  updatedAt: string;
  createdAt: string;
}

export interface CreateQuestionDto {
  roundId: string;
  stageId?: string;
  title: string;
  description: string;
  type: QuestionType;
  points?: number;
  initialCode?: string;
  testCases?: any;
  displayOrder?: number;
  options?: Array<{
    label: string;
    content: string;
    isCorrect: boolean;
    displayOrder?: number;
  }>;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {
  expectedUpdatedAt?: string;
}

export interface QuestionFilterQuery {
  roundId?: string;
  stageId?: string;
  type?: QuestionType;
  status?: QuestionStatus;
  search?: string;
}

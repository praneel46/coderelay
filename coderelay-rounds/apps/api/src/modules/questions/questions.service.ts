import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, QuestionType, QuestionStatus, Prisma } from '@prisma/client';

export interface CreateQuestionDto {
  roundId: string;
  stageId?: string;
  title: string;
  description: string;
  type: QuestionType;
  points?: number;
  initialCode?: string;
  language?: string;
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

export interface QuestionFilterDto {
  roundId?: string;
  stageId?: string;
  type?: QuestionType;
  status?: QuestionStatus;
  search?: string;
}

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Organizer query with search & filter
  async getQuestionsForOrganizer(filter: QuestionFilterDto) {
    const where: Prisma.QuestionWhereInput = {};

    if (filter.roundId) where.roundId = filter.roundId;
    if (filter.stageId) where.stageId = filter.stageId;
    if (filter.type) where.type = filter.type;

    if (filter.search && filter.search.trim()) {
      const query = filter.search.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { problemStatement: { contains: query, mode: 'insensitive' } },
      ];
    }

    const questions = await this.prisma.question.findMany({
      where,
      include: {
        round: { select: { roundNumber: true, title: true } },
        stage: { select: { stageOrder: true, title: true } },
        options: { orderBy: { displayOrder: 'asc' } },
      },
      orderBy: { id: 'desc' },
    });

    if (filter.status) {
      return questions.filter((q) => q.status === filter.status);
    }

    return questions;
  }

  // Get single question details for Organizer
  async getQuestionByIdForOrganizer(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        round: true,
        stage: true,
        options: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    return question;
  }

  // Participant Query: Returns ONLY PUBLISHED questions, and enforces member stage authorization & answer leak protection
  async getQuestionsForParticipant(
    user: any,
    requestedRoundId?: string,
    requestedStageId?: string,
  ) {
    if (user.role === Role.PARTICIPANT) {
      const where: Prisma.QuestionWhereInput = {
        status: QuestionStatus.PUBLISHED,
      };

      if (requestedRoundId) {
        where.roundId = requestedRoundId;
      }

      if (requestedStageId) {
        const stage = await this.prisma.roundStage.findUnique({
          where: { id: requestedStageId },
        });
        if (
          stage &&
          stage.memberOrder !== null &&
          stage.memberOrder !== user.memberOrder
        ) {
          throw new ForbiddenException(
            `Member ${user.memberOrder} is not authorized to access Stage ${stage.stageOrder} assigned to Member ${stage.memberOrder}`,
          );
        }
        where.stageId = requestedStageId;
      }

      const questions = await this.prisma.question.findMany({
        where,
        include: {
          options: {
            select: {
              id: true,
              label: true,
              content: true,
              displayOrder: true,
            },
            orderBy: { displayOrder: 'asc' },
          },
          stage: true,
        },
        orderBy: { displayOrder: 'asc' },
      });

      const authorizedQuestions = questions.filter((q) => {
        if (
          q.stage &&
          q.stage.memberOrder !== null &&
          q.stage.memberOrder !== user.memberOrder
        ) {
          return false;
        }
        return true;
      });

      return authorizedQuestions.map((q) => ({
        id: q.id,
        roundId: q.roundId,
        stageId: q.stageId,
        title: q.title,
        description: q.problemStatement,
        type: q.type,
        points: q.marks,
        initialCode: q.codeSnippet,
        language: q.language,
        options: q.options?.map(({ id, label, content, displayOrder }) => ({
          id,
          label,
          content,
          displayOrder,
        })),
      }));
    } else {
      // ORGANIZER Preview Mode
      const where: Prisma.QuestionWhereInput = { status: QuestionStatus.PUBLISHED };
      if (requestedRoundId) where.roundId = requestedRoundId;
      if (requestedStageId) where.stageId = requestedStageId;

      const questions = await this.prisma.question.findMany({
        where,
        include: {
          options: {
            select: {
              id: true,
              label: true,
              content: true,
              displayOrder: true,
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      });

      return questions.map((q) => ({
        id: q.id,
        roundId: q.roundId,
        stageId: q.stageId,
        title: q.title,
        description: q.problemStatement,
        type: q.type,
        points: q.marks,
        initialCode: q.codeSnippet,
        language: q.language,
        options: q.options?.map(({ id, label, content, displayOrder }) => ({
          id,
          label,
          content,
          displayOrder,
        })),
      }));
    }
  }

  // Create Question in DRAFT state
  async createQuestion(dto: CreateQuestionDto, actorUsername: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: dto.roundId },
    });
    if (!round) {
      throw new BadRequestException(`Round ${dto.roundId} does not exist`);
    }

    const question = await this.prisma.question.create({
      data: {
        roundId: dto.roundId,
        stageId: dto.stageId || null,
        title: dto.title,
        problemStatement: dto.description,
        type: dto.type,
        marks: dto.points ?? 10,
        codeSnippet: dto.initialCode || null,
        language: dto.language || 'python',
        status: QuestionStatus.DRAFT,
        options: dto.options
          ? {
              create: dto.options.map((opt, idx) => ({
                label: opt.label,
                content: opt.content,
                isCorrect: opt.isCorrect,
                displayOrder: opt.displayOrder ?? idx + 1,
              })),
            }
          : undefined,
      },
      include: {
        options: true,
      },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'CREATE_QUESTION',
      resource: 'Question',
      resourceId: question.id,
      metadata: { title: question.title, type: question.type },
    });

    this.logger.log(`Organizer ${actorUsername} created question "${question.title}"`);
    return question;
  }

  // Edit Question (Supports Optimistic Concurrency Check & Blocks LOCKED)
  async updateQuestion(id: string, dto: UpdateQuestionDto, actorUsername: string) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!existing) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    if (existing.status === QuestionStatus.LOCKED) {
      throw new ForbiddenException(
        `Question ${id} is LOCKED and cannot be edited directly. Use duplicate to create an editable copy.`,
      );
    }

    if (
      dto.expectedUpdatedAt &&
      new Date(existing.updatedAt || 0).toISOString() !==
        new Date(dto.expectedUpdatedAt).toISOString()
    ) {
      throw new ConflictException(
        'Question has been modified by another organizer since you loaded it. Please refresh and try again.',
      );
    }

    if (dto.options) {
      await this.prisma.questionOption.deleteMany({
        where: { questionId: id },
      });
    }

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        problemStatement: dto.description ?? existing.problemStatement,
        type: dto.type ?? existing.type,
        marks: dto.points ?? existing.marks,
        codeSnippet:
          dto.initialCode !== undefined ? dto.initialCode : existing.codeSnippet,
        language: dto.language ?? existing.language,
        options: dto.options
          ? {
              create: dto.options.map((opt, idx) => ({
                label: opt.label,
                content: opt.content,
                isCorrect: opt.isCorrect,
                displayOrder: opt.displayOrder ?? idx + 1,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'UPDATE_QUESTION',
      resource: 'Question',
      resourceId: updated.id,
      metadata: { title: updated.title },
    });

    return updated;
  }

  // Publish Question (DRAFT -> PUBLISHED)
  async publishQuestion(id: string, actorUsername: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    if (!question.title || !question.problemStatement) {
      throw new BadRequestException('Question title and problem statement are required for publishing');
    }

    if (question.type === QuestionType.MCQ || question.type === QuestionType.PREDICT_OUTPUT) {
      if (!question.options || question.options.length < 2) {
        throw new BadRequestException('MCQ/Predict Output questions require at least 2 options');
      }
      const correctCount = question.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException(
          `MCQ questions must have exactly 1 correct option (Found ${correctCount})`,
        );
      }
    }

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        status: QuestionStatus.PUBLISHED,
      },
      include: { options: true },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'PUBLISH_QUESTION',
      resource: 'Question',
      resourceId: id,
      metadata: { title: updated.title },
    });

    this.logger.log(`Organizer ${actorUsername} published question "${updated.title}"`);
    return updated;
  }

  // Lock Question (PUBLISHED -> LOCKED)
  async lockQuestion(id: string, actorUsername: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        status: QuestionStatus.LOCKED,
      },
      include: { options: true },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'LOCK_QUESTION',
      resource: 'Question',
      resourceId: id,
      metadata: { title: updated.title },
    });

    this.logger.log(`Organizer ${actorUsername} locked question "${updated.title}"`);
    return updated;
  }

  // Duplicate Question (Creates an editable DRAFT copy)
  async duplicateQuestion(id: string, actorUsername: string) {
    const original = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!original) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const copy = await this.prisma.question.create({
      data: {
        roundId: original.roundId,
        stageId: original.stageId,
        title: `${original.title} (Copy)`,
        problemStatement: original.problemStatement,
        type: original.type,
        marks: original.marks,
        codeSnippet: original.codeSnippet,
        language: original.language,
        status: QuestionStatus.DRAFT,
        options: {
          create: original.options.map((opt) => ({
            label: opt.label,
            content: opt.content,
            isCorrect: opt.isCorrect,
            displayOrder: opt.displayOrder,
          })),
        },
      },
      include: { options: true },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'DUPLICATE_QUESTION',
      resource: 'Question',
      resourceId: copy.id,
      metadata: { originalId: id, copyTitle: copy.title },
    });

    return copy;
  }
}

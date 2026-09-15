import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SubmissionQueryDto {
  roundId?: string;
  teamId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSubmissions(query: SubmissionQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.roundId) where.roundId = query.roundId;
    if (query.teamId) where.teamId = query.teamId;

    const [total, items] = await Promise.all([
      this.prisma.submission.count({ where }),
      this.prisma.submission.findMany({
        where,
        select: {
          id: true,
          teamId: true,
          roundId: true,
          stageId: true,
          memberId: true,
          questionId: true,
          answerText: true,
          codeContent: true,
          isAutoSubmitted: true,
          score: true,
          submittedAt: true,
          team: { select: { teamCode: true, name: true } },
          round: { select: { roundNumber: true, title: true } },
          question: { select: { title: true, marks: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: items.map((sub) => ({
        id: sub.id,
        teamId: sub.teamId,
        teamCode: sub.team.teamCode,
        teamName: sub.team.name,
        roundId: sub.roundId,
        roundNumber: sub.round.roundNumber,
        roundTitle: sub.round.title,
        stageId: sub.stageId,
        memberId: sub.memberId,
        questionId: sub.questionId,
        questionTitle: sub.question?.title || null,
        questionMarks: sub.question?.marks || null,
        answerText: sub.answerText,
        codeContent: sub.codeContent,
        isAutoSubmitted: sub.isAutoSubmitted,
        score: sub.score,
        submittedAt: sub.submittedAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

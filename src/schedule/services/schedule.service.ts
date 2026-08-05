import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Schedule } from '../entities/schedule.entity';
import { ScheduleOccurrence } from '../entities/schedule-occurrence.entity';

export type ScheduleListOptions = {
  filter: {
    userId: string;
    when?: { ge: Date; le: Date };
  };
  pagination?: {
    skip?: number;
    take?: number;
  };
};

@Injectable()
export class ScheduleService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduleOccurrence)
    private readonly scheduleOccurrenceRepository: Repository<ScheduleOccurrence>,
    @InjectQueue('schedules') private readonly schedulesQueue: Queue,
  ) {}

  async list(options: ScheduleListOptions): Promise<[Schedule[], number]> {
    const queryBuilder = this.scheduleRepository
      .createQueryBuilder('schedule')
      .select('schedule')
      .addSelect('COUNT(*) OVER() as count')
      .leftJoinAndSelect('schedule.user', 'user')
      .leftJoinAndSelect('schedule.category', 'category')
      .leftJoinAndSelect(
        'schedule.occurrences',
        'occurrences',
        `"occurrences"."entryId" IN (SELECT e.id FROM entry e WHERE e."when" >= :periodGe AND e."when" <= :periodLe)`,
      )
      .leftJoinAndSelect('occurrences.entry', 'entry')
      .where('(schedule."userId" = :userId)')
      .orderBy('schedule.createdAt', 'ASC')
      .setParameters({
        userId: options.filter.userId,
        periodGe: options.filter.when?.ge,
        periodLe: options.filter.when?.le,
      });

    if (options.pagination?.skip !== undefined) {
      queryBuilder.skip(options.pagination.skip);
    }

    if (options.pagination?.take !== undefined) {
      queryBuilder.take(options.pagination.take);
    }

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const count = raw.length > 0 ? Number(raw[0].count) : 0;

    return [entities, count];
  }

  async findOneBy(
    where: FindOptionsWhere<Schedule>,
    cycle?: { start: Date; end: Date },
  ): Promise<Schedule | null> {
    const queryBuilder = this.scheduleRepository
      .createQueryBuilder('schedule')
      .select('schedule')
      .leftJoinAndSelect('schedule.user', 'user')
      .leftJoinAndSelect('schedule.category', 'category');

    if (cycle) {
      queryBuilder
        .leftJoinAndSelect(
          'schedule.occurrences',
          'occurrences',
          `"occurrences"."entryId" IN (SELECT e.id FROM entry e WHERE e."when" >= :periodGe AND e."when" <= :periodLe)`,
        )
        .setParameter('periodGe', cycle.start)
        .setParameter('periodLe', cycle.end);
    } else {
      queryBuilder.leftJoinAndSelect('schedule.occurrences', 'occurrences');
    }

    queryBuilder.leftJoinAndSelect('occurrences.entry', 'entry').where(where);

    return await queryBuilder.getOne();
  }

  async create(data: DeepPartial<Schedule>): Promise<Schedule> {
    const schedule = await this.scheduleRepository.save(
      this.scheduleRepository.create(data),
    );

    if (process.env.NODE_ENV !== 'testing') {
      await this.addBullJobs(schedule);
    }

    return schedule;
  }

  async update(
    schedule: Schedule,
    data: DeepPartial<Schedule>,
  ): Promise<Schedule> {
    if (data.category === null) data.categoryId = null;

    if (process.env.NODE_ENV !== 'testing') {
      await this.removeBullJobs(schedule);
    }

    const updatedSchedule = await this.scheduleRepository.save(
      this.scheduleRepository.merge(schedule, data),
    );

    if (process.env.NODE_ENV !== 'testing') {
      await this.addBullJobs(updatedSchedule);
    }

    return updatedSchedule;
  }

  async remove(schedule: Schedule): Promise<Schedule> {
    if (process.env.NODE_ENV !== 'testing') {
      await this.removeBullJobs(schedule);
    }

    return await this.scheduleRepository.remove(schedule);
  }

  async createOccurrence(
    schedule: Schedule,
    when: Date,
  ): Promise<ScheduleOccurrence> {
    const occurrence = this.scheduleOccurrenceRepository.create({
      schedule,
      entry: {
        amount: schedule.amount,
        type: schedule.type,
        description: schedule.description,
        when,
        category: schedule.category,
        userId: schedule.userId,
      },
    });

    return await this.scheduleOccurrenceRepository.save(occurrence);
  }

  private async addBullJobs(schedule: Schedule) {
    try {
      await this.schedulesQueue.add(
        { id: schedule.id, scheduleId: schedule.id, beforeExpire: true },
        {
          jobId: `before-${schedule.id}`,
          repeat: {
            cron: schedule.getCronMinusOneDay(),
            tz: schedule.timezone,
          },
        },
      );

      await this.schedulesQueue.add(
        { id: schedule.id, scheduleId: schedule.id, beforeExpire: false },
        {
          jobId: `exact-${schedule.id}`,
          repeat: { cron: schedule.getCron(), tz: schedule.timezone },
        },
      );
    } catch (e) {
      console.error('Error adding bull jobs', e);
    }
  }

  private async removeBullJobs(schedule: Schedule) {
    try {
      await this.schedulesQueue.removeRepeatable({
        cron: schedule.getCronMinusOneDay(),
        tz: schedule.timezone,
        jobId: `before-${schedule.id}`,
      });

      await this.schedulesQueue.removeRepeatable({
        cron: schedule.getCron(),
        tz: schedule.timezone,
        jobId: `exact-${schedule.id}`,
      });
    } catch (e) {
      console.error('Error removing bull jobs', e);
    }
  }

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'testing') return;
    try {
      await this.reconcileRepeatableJobs();
    } catch (error: any) {
      this.logger.error(
        `Error during schedules reconciliation: ${error.message}`,
        error.stack,
      );
    }
  }

  private async reconcileRepeatableJobs() {
    this.logger.log('Starting Redis schedule jobs reconciliation...');
    const repeatableJobs = await this.schedulesQueue.getRepeatableJobs();
    const processedScheduleIds = new Set<string>();

    for (const job of repeatableJobs) {
      const jobId = job.id || '';
      const isLegacyId =
        !jobId.startsWith('before-') && !jobId.startsWith('exact-');
      const isMissingTz = !job.tz;
      const is6FieldCron = job.cron.split(' ').length === 6;

      if (isLegacyId || isMissingTz || is6FieldCron) {
        this.logger.log(
          `Found legacy/mismatched repeatable job (key: ${job.key}, id: ${jobId}). Upgrading...`,
        );

        await this.schedulesQueue.removeRepeatableByKey(job.key);

        const scheduleId = jobId.replace(/^(before|exact)-/, '');
        if (!scheduleId || processedScheduleIds.has(scheduleId)) continue;
        processedScheduleIds.add(scheduleId);

        const schedule = await this.scheduleRepository.findOne({
          where: { id: scheduleId },
        });

        if (schedule) {
          this.logger.log(
            `Re-registering upgraded repeatable jobs for schedule: ${schedule.id} (tz: ${schedule.timezone})`,
          );
          await this.addBullJobs(schedule);
        } else {
          this.logger.warn(
            `Schedule ${scheduleId} not found in database; cleaned up orphaned Redis job.`,
          );
        }
      }
    }

    this.logger.log('Redis schedule jobs reconciliation completed.');
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiUsage, AiUsageType } from '../entities/ai-usage.entity';

@Injectable()
export class AiUsageService {
  constructor(
    @InjectRepository(AiUsage)
    private readonly aiUsageRepository: Repository<AiUsage>,
  ) {}

  public async registerUsage(
    userId: string,
    type: AiUsageType,
    inputTokens: number = 0,
    outputTokens: number = 0,
  ) {
    if (inputTokens === 0 && outputTokens === 0) {
      return null;
    }
    
    const usage = this.aiUsageRepository.create({
      userId,
      type,
      inputTokens,
      outputTokens,
    });
    
    return this.aiUsageRepository.save(usage);
  }
}

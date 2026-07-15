import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlanService } from '../services/plan.service';

@ApiTags('Plan')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async index() {
    const plans = await this.planService.findAllWhere({ isPrivate: false });

    return { plans };
  }
}

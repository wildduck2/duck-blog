import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common'
import { ResponseType } from '~/common/types'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(): Promise<ResponseType<typeof this.analyticsService.getComprehensiveDashboard, string>> {
    const data = await this.analyticsService.getComprehensiveDashboard()
    return { data, message: 'ANALYTICS_GET_DASHBOARD_FAILED', state: 'success' }
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import type { ResponseType } from '~/common/types'
import { ServicesService } from './services.service'
import { CreateServicesDto, ServicesMessagesType, UpdateServicesDto } from './services.types'

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async getAll(): Promise<ResponseType<typeof this.servicesService.getAll, ServicesMessagesType>> {
    const services = await this.servicesService.getAll()
    return { data: services, message: 'SERVICES_GET_ALL_FAILED', state: 'success' }
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
  ): Promise<ResponseType<typeof this.servicesService.getOne, ServicesMessagesType>> {
    const service = await this.servicesService.getOne(id)
    return { data: service, message: 'SERVICES_GET_ONE_FAILED', state: 'success' }
  }

  @Post()
  async create(@Body() data: CreateServicesDto): Promise<ResponseType<typeof this.servicesService.create>> {
    const service = await this.servicesService.create(data)
    return { data: service, message: 'SERVICES_CREATE_FAILED', state: 'success' }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateServicesDto,
  ): Promise<ResponseType<typeof this.servicesService.update>> {
    const service = await this.servicesService.update(id, data)
    return { data: service, message: 'SERVICES_UPDATE_FAILED', state: 'success' }
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<ResponseType<typeof this.servicesService.delete, ServicesMessagesType>> {
    console.log(id)
    const service = await this.servicesService.delete(id)
    return { data: service, message: 'SERVICES_DELETE_FAILED', state: 'success' }
  }
}

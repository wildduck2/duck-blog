import { Body, Controller, Delete, Get, Param, Post, Put, Session, UseGuards } from '@nestjs/common'
import { SessionData } from 'express-session'
import { AuthGuard } from '~/auth/auth.guard'
import type { ResponseType } from '~/common/types'
import { AccessTokensService } from './access-tokens.service'
import { AccessTokenMessagesType, CreateAccessTokenDto, UpdateAccessTokenDto } from './access-tokens.types'

@Controller('access-tokens')
@UseGuards(AuthGuard)
export class AccessTokensController {
  constructor(private readonly accessTokensService: AccessTokensService) {}

  @Get()
  async getAll(): Promise<ResponseType<typeof this.accessTokensService.getAll, AccessTokenMessagesType>> {
    const tokens = await this.accessTokensService.getAll({
      order: 'desc',
      orderBy: 'created_at',
      page: 1,
      pageSize: 10,
    })
    return { data: tokens, message: 'ACCESS_TOKENS_GET_ALL_FAILED', state: 'success' }
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
  ): Promise<ResponseType<typeof this.accessTokensService.getOne, AccessTokenMessagesType>> {
    const token = await this.accessTokensService.getOne(id)
    return { data: token, message: 'ACCESS_TOKENS_GET_ONE_FAILED', state: 'success' }
  }

  @Post()
  async create(
    @Session() session: SessionData,
    @Body() data: CreateAccessTokenDto,
  ): Promise<ResponseType<typeof this.accessTokensService.create>> {
    const token = await this.accessTokensService.create({ ...data, user_id: session.user?.id })
    return { data: token, message: 'ACCESS_TOKENS_CREATE_FAILED', state: 'success' }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateAccessTokenDto,
  ): Promise<ResponseType<typeof this.accessTokensService.update>> {
    const token = await this.accessTokensService.update(id, data)
    return { data: token, message: 'ACCESS_TOKENS_UPDATE_FAILED', state: 'success' }
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<ResponseType<typeof this.accessTokensService.delete, AccessTokenMessagesType>> {
    const token = await this.accessTokensService.delete(id)
    return { data: token, message: 'ACCESS_TOKENS_DELETE_FAILED', state: 'success' }
  }

  @Put(':id/renew')
  async renew(
    @Param('id') id: string,
  ): Promise<ResponseType<typeof this.accessTokensService.renew, AccessTokenMessagesType>> {
    const token = await this.accessTokensService.renew(id)
    return { data: token, message: 'ACCESS_TOKENS_RENEW_FAILED', state: 'success' }
  }
}

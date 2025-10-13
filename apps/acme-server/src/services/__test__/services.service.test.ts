/**
 * @name SERVICES
 * @description Unit tests for ServicesService
 */

import { Test } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { throwError } from '~/common/libs'
import { DrizzleAsyncProvider } from '~/drizzle'
import { ServicesService } from '../services.service'
import type { CreateServicesDto, UpdateServicesDto } from '../services.types'

// Mock throwError so we can assert calls and keep behavior of throwing after being called
vi.mock('~/common/libs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/common/libs')>()
  return {
    ...actual,
    throwError: vi.fn((code: string, status: number, details?: any) => {
      throw new actual.AppError(`${code}:${status}`, status, undefined, details)
    }),
  }
})
const mockedThrowError = vi.mocked(throwError)

describe('ServicesService (unit)', () => {
  let service: ServicesService
  let mockDb: any

  beforeEach(async () => {
    mockDb = {
      delete: vi.fn(),
      insert: vi.fn(),
      query: {
        services: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      update: vi.fn(),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [ServicesService, { provide: DrizzleAsyncProvider, useValue: mockDb }],
    }).compile()

    service = moduleRef.get(ServicesService)
    mockedThrowError.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /* ===== GET ALL ===== */
  it('returns services when DB returns non-empty array', async () => {
    const rows = [{ id: 's1', name: 'Service 1' }]
    mockDb.query.services.findMany.mockResolvedValue(rows)

    const res = await service.getAll()
    expect(res).toEqual(rows)
    expect(mockDb.query.services.findMany).toHaveBeenCalledTimes(1)
  })

  it('throws 404 when DB returns empty array', async () => {
    mockDb.query.services.findMany.mockResolvedValue([])

    await expect(service.getAll()).rejects.toThrow('SERVICES_GET_ALL_FAILED:404')
  })

  it('throws 500 when DB rejects', async () => {
    mockDb.query.services.findMany.mockRejectedValue(new Error('db fail'))

    await expect(service.getAll()).rejects.toThrow('SERVICES_GET_ALL_FAILED:500')
  })

  it('throws 500 when DB returns undefined', async () => {
    mockDb.query.services.findMany.mockResolvedValue(undefined)

    await expect(service.getAll()).rejects.toThrow('SERVICES_GET_ALL_FAILED:500')
  })

  /* ===== GET ONE ===== */
  it('returns service when found', async () => {
    const row = { id: 's1', name: 'Service 1' }
    mockDb.query.services.findFirst.mockResolvedValue(row)

    const res = await service.getOne('s1')
    expect(res).toEqual(row)
    expect(mockDb.query.services.findFirst).toHaveBeenCalledTimes(1)
  })

  it('throws 404 when service not found', async () => {
    mockDb.query.services.findFirst.mockResolvedValue(null)

    await expect(service.getOne('missing')).rejects.toThrow('SERVICES_GET_ONE_FAILED:404')
  })

  it('throws 500 when DB rejects', async () => {
    mockDb.query.services.findFirst.mockRejectedValue(new Error('db boom'))

    await expect(service.getOne('err')).rejects.toThrow('SERVICES_GET_ONE_FAILED:500')
  })

  /* ===== CREATE ===== */
  it('inserts and returns created service on success', async () => {
    const created = { description: 'desc', id: 'c1', name: 'svc1' }

    mockDb.insert.mockImplementation(() => ({
      values: () => ({
        returning: () => Promise.resolve([created]),
      }),
    }))

    const dto = { description: 'desc', name: 'svc1' } as CreateServicesDto
    const res = await service.create(dto)

    expect(res).toEqual(created)
    expect(mockDb.insert).toHaveBeenCalledTimes(1)
  })

  it('throws 404 when insert returns empty array', async () => {
    mockDb.insert.mockImplementation(() => ({
      values: () => ({
        returning: () => Promise.resolve([]),
      }),
    }))

    await expect(service.create({ name: 'svc1' } as CreateServicesDto)).rejects.toThrow('SERVICES_CREATE_FAILED:404')
  })

  it('throws 500 when insert rejects', async () => {
    mockDb.insert.mockImplementation(() => ({
      values: () => ({
        returning: () => Promise.reject(new Error('insert fail')),
      }),
    }))

    await expect(service.create({ name: 'svc1' } as CreateServicesDto)).rejects.toThrow('SERVICES_CREATE_FAILED:500')
  })

  /* ===== UPDATE ===== */
  it('updates and returns service on success', async () => {
    const returnedRow = { id: 'u1', name: 'updated' }

    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([returnedRow]),
        }),
      }),
    }))

    const dto = { name: 'updated' } as UpdateServicesDto
    const res = await service.update('u1', dto)

    expect(res).toEqual(returnedRow)
    expect(mockDb.update).toHaveBeenCalledTimes(1)
  })

  it('throws 404 when update returns empty array', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    }))

    await expect(service.update('u1', { name: 'x' } as UpdateServicesDto)).rejects.toThrow('SERVICES_UPDATE_FAILED:404')
  })

  it('throws 500 when update rejects', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error('update fail')),
        }),
      }),
    }))

    await expect(service.update('u1', { name: 'x' } as UpdateServicesDto)).rejects.toThrow('SERVICES_UPDATE_FAILED:500')
  })

  /* ===== DELETE ===== */
  it('deletes and returns null on success', async () => {
    mockDb.delete.mockImplementation(() => ({
      where: () => ({
        returning: () => Promise.resolve([{ id: 'd1' }]),
      }),
    }))

    const res = await service.delete('d1')
    expect(res).toBeNull()
    expect(mockDb.delete).toHaveBeenCalledTimes(1)
  })

  it('throws 404 when delete returns empty array', async () => {
    mockDb.delete.mockImplementation(() => ({
      where: () => ({
        returning: () => Promise.resolve([]),
      }),
    }))

    await expect(service.delete('d1')).rejects.toThrow('SERVICES_DELETE_FAILED:404')
  })

  it('throws 500 when delete rejects', async () => {
    mockDb.delete.mockImplementation(() => ({
      where: () => ({
        returning: () => Promise.reject(new Error('delete fail')),
      }),
    }))

    await expect(service.delete('d1')).rejects.toThrow('SERVICES_DELETE_FAILED:500')
  })
})

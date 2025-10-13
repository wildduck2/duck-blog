/**
 * @name ACCESS_TOKENS
 * @description This is for the access tokens and verification tokens and so on
 */
import { Test } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { throwError } from '~/common/libs'
import { DrizzleAsyncProvider } from '~/drizzle'
import { AccessTokensService } from '../access-tokens.service'

// mock throwError so we can assert calls and keep behavior of throwing after being called
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

describe('AccessTokensService (refined error semantics)', () => {
  let service: AccessTokensService
  let mockDb: any

  beforeEach(async () => {
    mockDb = {
      delete: vi.fn(),
      insert: vi.fn(),
      query: {
        accessTokens: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      update: vi.fn(),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [AccessTokensService, { provide: DrizzleAsyncProvider, useValue: mockDb }],
    }).compile()

    service = moduleRef.get(AccessTokensService)
    mockedThrowError.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========== getAll ==========
  it('getAll - returns tokens when DB returns a non-empty array', async () => {
    mockDb.query.accessTokens.findMany.mockResolvedValue([{ id: 't1' }])

    const res = await service.getAll()
    expect(res).toEqual([{ id: 't1' }])
    expect(mockDb.query.accessTokens.findMany).toHaveBeenCalledOnce()
  })

  it('getAll - throws 404 when DB returns an empty array', async () => {
    mockDb.query.accessTokens.findMany.mockResolvedValue([])

    await expect(service.getAll()).rejects.toThrow('ACCESS_TOKENS_GET_ALL_FAILED:404')
  })

  it('getAll - throws 500 when DB throws', async () => {
    mockDb.query.accessTokens.findMany.mockRejectedValue(new Error('db boom'))

    await expect(service.getAll()).rejects.toThrow('ACCESS_TOKENS_GET_ALL_FAILED:500')
  })

  it('getAll - throws 500 when DB returns undefined (unexpected shape -> runtime error)', async () => {
    // tokens is undefined -> tokens.length will cause runtime error and be caught -> 500
    mockDb.query.accessTokens.findMany.mockResolvedValue(undefined)

    await expect(service.getAll()).rejects.toThrow('ACCESS_TOKENS_GET_ALL_FAILED:500')
  })

  // ========== getOne ==========
  it('getOne - returns token when found', async () => {
    mockDb.query.accessTokens.findFirst.mockResolvedValue({ id: 'abc' })

    const res = await service.getOne('abc')
    expect(res).toEqual({ id: 'abc' })
    expect(mockDb.query.accessTokens.findFirst).toHaveBeenCalledOnce()
  })

  it('getOne - throws 404 when token not found (null)', async () => {
    mockDb.query.accessTokens.findFirst.mockResolvedValue(null)

    await expect(service.getOne('missing')).rejects.toThrow('ACCESS_TOKENS_GET_ONE_FAILED:404')
  })

  it('getOne - throws 500 when DB throws', async () => {
    mockDb.query.accessTokens.findFirst.mockRejectedValue(new Error('db err'))

    await expect(service.getOne('err')).rejects.toThrow('ACCESS_TOKENS_GET_ONE_FAILED:500')
  })

  // ========== create ==========
  it('create - inserts and returns token on success; token passed to insert is 64 chars', async () => {
    // Prepare a fake returned row (DB returning)
    const returnedRow = { expires_at: new Date(), id: '1', token: 'x'.repeat(64) }

    // capture the values passed to .values(...) so we can assert token length
    let capturedValues: any = null

    mockDb.insert.mockImplementation((...args: any[]) => {
      return {
        values: (vals: any) => {
          capturedValues = vals
          return {
            returning: () => Promise.resolve([returnedRow]),
          }
        },
      }
    })

    const dto = { user_id: 'u1' } as any
    const res = await service.create(dto)

    expect(res).toEqual(returnedRow)
    // assert that service called insert on the db (argument isn't asserted to schema here)
    expect(mockDb.insert).toHaveBeenCalled()
    // ensure the generated token passed to insert has length 64
    expect(typeof capturedValues.token).toBe('string')
    expect(capturedValues.token.length).toBe(64)
    // ensure expires_at is present
    expect(capturedValues.expires_at).toBeInstanceOf(Date)
  })

  it('create - throws 404 when insert returning is an empty array', async () => {
    mockDb.insert.mockImplementation(() => ({
      values: () => ({
        returning: () => Promise.resolve([]),
      }),
    }))

    await expect(service.create({ user_id: 'u1' } as any)).rejects.toThrow('ACCESS_TOKENS_CREATE_FAILED:404')
  })

  it('create - throws 404 when insert returning is [undefined] (edge)', async () => {
    mockDb.insert.mockImplementation(() => ({
      values: () => ({
        returning: () => Promise.resolve([undefined]),
      }),
    }))

    await expect(service.create({ user_id: 'u1' } as any)).rejects.toThrow('ACCESS_TOKENS_CREATE_FAILED:404')
  })

  it('create - throws 500 when insert returning rejects', async () => {
    mockDb.insert.mockImplementation(() => ({
      values: () => ({
        returning: () => Promise.reject(new Error('insert fail')),
      }),
    }))

    await expect(service.create({ user_id: 'u1' } as any)).rejects.toThrow('ACCESS_TOKENS_CREATE_FAILED:500')
  })

  // ========== update ==========
  it('update - updates and returns token on success', async () => {
    const returnedRow = { id: '1', name: 'updated' }
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([returnedRow]),
        }),
      }),
    }))

    const res = await service.update('1', { name: 'updated' } as any)
    expect(res).toEqual(returnedRow)
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('update - throws 404 when update returning is empty', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    }))

    await expect(service.update('1', { name: 'no' } as any)).rejects.toThrow('ACCESS_TOKENS_UPDATE_FAILED:404')
  })

  it('update - throws 404 when update returning is [undefined] (edge)', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([undefined]),
        }),
      }),
    }))

    await expect(service.update('1', { name: 'no' } as any)).rejects.toThrow('ACCESS_TOKENS_UPDATE_FAILED:404')
  })

  it('update - throws 500 when update returning rejects', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error('update fail')),
        }),
      }),
    }))

    await expect(service.update('1', { name: 'no' } as any)).rejects.toThrow('ACCESS_TOKENS_UPDATE_FAILED:500')
  })

  // ========== delete ==========
  it('delete - deletes and returns null on success', async () => {
    mockDb.delete.mockImplementation(() => ({
      where: () => ({
        returning: () => Promise.resolve([{ id: '1' }]),
      }),
    }))

    const res = await service.delete('1')
    expect(res).toBeNull()
    expect(mockDb.delete).toHaveBeenCalled()
  })

  it('delete - throws 404 when delete returning is empty', async () => {
    mockDb.delete.mockImplementation(() => ({
      where: () => ({
        returning: () => Promise.resolve([]),
      }),
    }))

    await expect(service.delete('1')).rejects.toThrow('ACCESS_TOKENS_DELETE_FAILED:404')
  })

  it('delete - throws 404 when delete returning is [undefined]', async () => {
    mockDb.delete.mockImplementation(() => ({
      where: () => ({
        returning: () => Promise.resolve([undefined]),
      }),
    }))

    await expect(service.delete('1')).rejects.toThrow('ACCESS_TOKENS_DELETE_FAILED:404')
  })

  it('delete - throws 500 when delete returning rejects', async () => {
    mockDb.delete.mockImplementation(() => ({
      where: () => ({
        returning: () => Promise.reject(new Error('delete fail')),
      }),
    }))

    await expect(service.delete('1')).rejects.toThrow('ACCESS_TOKENS_DELETE_FAILED:500')
  })

  // ========== renew ==========
  it('renew - updates and returns token on success', async () => {
    const returnedRow = { id: '1', name: 'updated' }
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([returnedRow]),
        }),
      }),
    }))

    const res = await service.renew('1')
    expect(res).toEqual(returnedRow)
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('renew - throws 404 when update returning is empty', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    }))

    await expect(service.renew('1')).rejects.toThrow('ACCESS_TOKENS_RENEW_FAILED:404')
  })

  it('renew - throws 404 when update returning is [undefined] (edge)', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([undefined]),
        }),
      }),
    }))

    await expect(service.renew('1')).rejects.toThrow('ACCESS_TOKENS_RENEW_FAILED:404')
  })

  it('renew - throws 500 when update returning rejects', async () => {
    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error('update fail')),
        }),
      }),
    }))

    await expect(service.renew('1')).rejects.toThrow('ACCESS_TOKENS_RENEW_FAILED:500')
  })
})

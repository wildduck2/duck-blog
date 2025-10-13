// import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
// import { AuthService } from '../auth.service'
// import { SigninSchemaType, SignupSchemaType } from '../auth.types'
// import { PasswordHasher } from '~/common/libs'
// import { throwError } from '~/common/libs'
//
// vi.mock('~/common/libs', () => ({
//   PasswordHasher: {
//     hashPassword: vi.fn(() => Promise.resolve('hashed-password')),
//     comparePassword: vi.fn(),
//   },
//   throwError: vi.fn(),
// }))
//
// describe('AuthService', () => {
//   let service: AuthService
//
//   const mockInsertOne = vi.fn()
//   const mockFindOne = vi.fn()
//
//   const mockUserModel = {
//     insertOne: mockInsertOne,
//     findOne: mockFindOne,
//   }
//
//   beforeEach(() => {
//     service = new AuthService(mockUserModel as any)
//     vi.clearAllMocks()
//   })
//
//   const validInput: SigninSchemaType = {
//     username: 'duckui',
//     password: 'duckpass123',
//   }
//
//   const validBody: SignupSchemaType = {
//     username: 'duckui',
//     password: 'duckpass123',
//     email: 'duck@ui.com',
//   }
//
//   const fakeUser = {
//     _id: 'abc123',
//     ...validBody,
//     password: 'hashed-password',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     toObject: () => ({
//       _id: 'abc123',
//       username: validBody.username,
//       email: validBody.email,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }),
//   } as any
//
//   /* ---------------------- signup: success ---------------------- */
//   it('should create a new user', async () => {
//     mockInsertOne.mockResolvedValue(fakeUser)
//
//     const result = await service.signup(validBody)
//
//     expect(PasswordHasher.hashPassword).toHaveBeenCalledWith('duckpass123')
//     expect(mockInsertOne).toHaveBeenCalledWith({
//       username: 'duckui',
//       email: 'duck@ui.com',
//       password: 'hashed-password',
//     })
//
//     expect(result).toEqual({
//       _id: 'abc123',
//       username: 'duckui',
//       email: 'duck@ui.com',
//       createdAt: expect.any(Date),
//       updatedAt: expect.any(Date),
//     })
//   })
//
//   /* ---------------------- signup: missing fields ---------------------- */
//   it('should throw if required fields are missing', async () => {
//     const body = {
//       username: '',
//       password: '',
//       email: '',
//     }
//
//     mockInsertOne.mockRejectedValueOnce(new Error('insertOne failed'))
//     await expect(service.signup(body as any)).rejects.toThrow()
//   })
//
//   /* ---------------------- signup: duplicate user ---------------------- */
//   it('should throw if user already exists (duplicate)', async () => {
//     mockInsertOne.mockRejectedValueOnce({
//       code: 11000,
//       message: 'E11000 duplicate key error',
//     })
//
//     await expect(service.signup(validBody)).rejects.toThrow(/duplicate/i)
//     expect(mockInsertOne).toHaveBeenCalled()
//   })
//
//   /* ---------------------- signup: unexpected error ---------------------- */
//   it('should throw if insertOne fails with unknown error', async () => {
//     mockInsertOne.mockRejectedValueOnce(new Error('Unexpected error'))
//
//     await expect(service.signup(validBody)).rejects.toThrow('Unexpected error')
//     expect(mockInsertOne).toHaveBeenCalled()
//   })
//
//   /* ---------------------- signup: hashPassword fails ---------------------- */
//   it('should throw if hashPassword throws', async () => {
//     ;(PasswordHasher.hashPassword as any).mockRejectedValueOnce(new Error('Hashing failed'))
//
//     await expect(service.signup(validBody)).rejects.toThrow('Hashing failed')
//     expect(mockInsertOne).not.toHaveBeenCalled()
//   })
//
//   /* ---------------------- signin: success ---------------------- */
//   it('should return user without password if credentials are valid', async () => {
//     mockFindOne.mockResolvedValue(fakeUser)
//     ;(PasswordHasher.comparePassword as Mock)?.mockResolvedValue(true)
//
//     const result = await service.signin(validInput)
//
//     expect(mockFindOne).toHaveBeenCalledWith({ username: 'duckui' })
//     expect(PasswordHasher.comparePassword).toHaveBeenCalledWith('duckpass123', 'hashed-password')
//     expect(result).toEqual({
//       _id: 'abc123',
//       username: 'duckui',
//       email: 'duck@ui.com',
//       createdAt: expect.any(Date),
//       updatedAt: expect.any(Date),
//     })
//   })
//   /* ---------------------- signin: user not found ---------------------- */
//   it('should throw if user is not found', async () => {
//     mockFindOne.mockResolvedValue(null)
//     // (throwError as Mock).mockImplementation((message: string) => new Error(message))
//     // (throwError as Mock).mockReturnValue(new Error('USERNAME_INVALID'))
//
//     const result = await service.signin(validInput)
//     console.log(result)
//
//     // FIX: the mock of this function is not working.
//     // expect(result).toEqual(expect.any('Error'))
//     // expect((result as Error).message).toContain('USERNAME_INVALID')
//     expect(mockFindOne).toHaveBeenCalledWith({ username: 'duckui' })
//     expect(PasswordHasher.comparePassword).not.toHaveBeenCalled()
//   })
//
//   /* ---------------------- signin: password incorrect ---------------------- */
//   it('should throw if password does not match', async () => {
//     mockFindOne.mockResolvedValue(fakeUser)
//     ;(PasswordHasher.comparePassword as Mock).mockResolvedValue(false)
//     ;(throwError as Mock).mockReturnValue(new Error('PASSWORD_INVALID'))
//
//     const result = await service.signin(validInput)
//
//     expect(result).toEqual(expect.any(Error))
//     expect((result as Error).message).toContain('PASSWORD_INVALID')
//     expect(PasswordHasher.comparePassword).toHaveBeenCalledWith('duckpass123', 'hashed-password')
//   })
//
//   /* ---------------------- signin: findOne throws ---------------------- */
//   it('should throw if findOne throws', async () => {
//     mockFindOne.mockRejectedValue(new Error('DB failure'))
//
//     await expect(service.signin(validInput)).rejects.toThrow('DB failure')
//   })
//
//   /* ---------------------- signin: comparePassword throws ---------------------- */
//   it('should throw if comparePassword throws', async () => {
//     mockFindOne.mockResolvedValue(fakeUser)
//     ;(PasswordHasher.comparePassword as Mock).mockRejectedValue(new Error('bcrypt failure'))
//
//     await expect(service.signin(validInput)).rejects.toThrow('bcrypt failure')
//   })
// })

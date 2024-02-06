import { LimitPeriod, LimitStatus, LimitType, UserLimit } from '../../src/types/user-limit'
import { UserLimitProgressChangedPayloadType, UserLimitResetPayloadType } from '../../src/types/payloads'
import { UserLimitDoesNotExist } from '../../src/types/errors'
import { UserLimitRepositoryInterface } from '../../src/repository/user-limit-repository-interface'
import { UserLimitInMemoryDBRepository } from '../../src/repository/user-limit-inmemorydb-repository'

describe('UserLimitInMemoryDBRepository', () => {
	let userLimitInMemoryDBRepository: UserLimitRepositoryInterface

	beforeAll(() => {
		process.env.DB = 'inMemory'
		userLimitInMemoryDBRepository = new UserLimitInMemoryDBRepository('example-id')
	})

	it('should save a user limit', async () => {
		const mockUserLimit: UserLimit = {
			activeFrom: Date.now(),
			brandId: 'test-brand',
			currencyCode: 'USD',
			period: LimitPeriod.CALENDAR_DAY,
			status: LimitStatus.ACTIVE,
			type: LimitType.BET,
			userId: 'test-user',
			userLimitId: 'test-id',
			value: '100',
		}

		const result = await userLimitInMemoryDBRepository.saveUserLimit(mockUserLimit)

		expect(result).toEqual(mockUserLimit)
	})

	it('should update a user limit progress', async () => {
		const exampleUserLimitProgressChanged: UserLimitProgressChangedPayloadType = {
			userLimitId: 'test-id',
			brandId: 'test-brand',
			userId: 'test-user',
			amount: '70',
			previousProgress: '0',
			currencyCode: 'USD',
		}

		const result = await userLimitInMemoryDBRepository.updateUserLimitProgress(exampleUserLimitProgressChanged)

		expect(result.progress).toEqual('30')
	})

	it('should reset a user limit', async () => {
		const payload: UserLimitResetPayloadType = {
			userLimitId: 'test-id',
			brandId: 'test-brand',
			userId: 'test-user',
			nextResetTime: 1000,
			period: LimitPeriod.CALENDAR_DAY,
			resetAmount: '0',
			resetPercentage: '0',
			type: LimitType.BET,
			unusedAmount: '0',
			currencyCode: 'USD',
		}

		const result = await userLimitInMemoryDBRepository.resetUserLimit(payload)

		expect(result.progress).toEqual('0')
		expect(result.nextResetTime).toEqual(1000)
	})

	it('should get a user limit', async () => {
		const payload = {
			userLimitId: 'test',
		} as UserLimit

		await userLimitInMemoryDBRepository.saveUserLimit(payload)
		const result = await userLimitInMemoryDBRepository.getUserLimit('test')

		expect(result).toEqual(payload)
	})

	it('should throw an error when updating a non-existent user limit', async () => {
		const payload = {
			userLimitId: 'non-existent-id',
		} as UserLimitProgressChangedPayloadType

		await expect(userLimitInMemoryDBRepository.updateUserLimitProgress(payload)).rejects.toThrow(
			new UserLimitDoesNotExist(`Limit: ${payload.userLimitId}, does not exist in the database`)
		)
	})

	it('should throw an error when resetting a non-existent user limit', async () => {
		const payload = {
			userLimitId: 'non-existent-id',
		} as UserLimitResetPayloadType

		await expect(userLimitInMemoryDBRepository.resetUserLimit(payload)).rejects.toThrow(
			new UserLimitDoesNotExist(`Limit: ${payload.userLimitId}, does not exist in the database`)
		)
	})
})

import { UserLimitInMemoryDBRepository } from '../../src/repository/user-limit-inmemorydb-repository'
import { UserLimitRepositoryInterface } from '../../src/repository/user-limit-repository-interface'
import { UserLimitEventHandlerService } from '../../src/services/event-handlers/user-limit-event-handler-service'
import { UserLimitEventType } from '../../src/types/events'
import { UserLimitProgressChangedPayloadType, UserLimitResetPayloadType } from '../../src/types/payloads'
import { LimitPeriod, LimitStatus, LimitType, UserLimit } from '../../src/types/user-limit'

describe('UserLimitEventHandlerService', () => {
	let userLimitEventHandlerService: UserLimitEventHandlerService
	let userLimitInMemoryDBRepository: UserLimitRepositoryInterface

	beforeAll(() => {
		process.env.DB = 'inMemory'
		userLimitInMemoryDBRepository = new UserLimitInMemoryDBRepository('example-id')
		userLimitEventHandlerService = new UserLimitEventHandlerService(userLimitInMemoryDBRepository)
	})

	it('should handle UserLimitCreated event', async () => {
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

		await userLimitEventHandlerService.handle(mockUserLimit, UserLimitEventType.USER_LIMIT_CREATED)
		const result = await userLimitInMemoryDBRepository.getUserLimit(mockUserLimit.userLimitId)
		expect(result).toEqual(mockUserLimit)
	})

	it('should handle UserLimitProgressChanged event', async () => {
		const mockUserLimitProgressChanged = {
			userLimitId: 'test-id',
			brandId: 'test-brand',
			userId: 'test-user',
			amount: '30',
			previousProgress: '0',
			currencyCode: 'USD',
			nextResetTime: 1000,
			period: LimitPeriod.CALENDAR_DAY,
			remainingAmount: '70',
		} as UserLimitProgressChangedPayloadType

		await userLimitEventHandlerService.handle(mockUserLimitProgressChanged, UserLimitEventType.USER_LIMIT_PROGRESS_CHANGED)
		const result = await userLimitInMemoryDBRepository.getUserLimit(mockUserLimitProgressChanged.userLimitId)
		expect(result.progress).toBe('70')
	})

	it('should handle UserLimitReset event', async () => {
		const mockUserLimitReset: UserLimitResetPayloadType = {
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

		const result = await userLimitEventHandlerService.handle(mockUserLimitReset, UserLimitEventType.USER_LIMIT_RESET)
		expect(result).toBeTruthy()
	})

	it('should return false for unknown event type', async () => {
		const payload = {}
		await expect(userLimitEventHandlerService.handle(payload, 'unknown' as UserLimitEventType)).resolves.toBe(false)
	})

	it('should throw an error for invalid USER_LIMIT_CREATED payload', async () => {
		const payload = {}
		await expect(userLimitEventHandlerService.handle(payload, UserLimitEventType.USER_LIMIT_CREATED)).rejects.toThrow()
	})
})

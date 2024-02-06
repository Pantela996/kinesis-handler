import { Log } from '../services/logger'
import { InsufficientAmountLeft, UserLimitDoesNotExist } from '../types/errors'
import { UserLimitCreatedPayloadType, UserLimitProgressChangedPayloadType, UserLimitResetPayloadType } from '../types/payloads'
import { UserLimit } from '../types/user-limit'
import { UserLimitRepositoryInterface } from './user-limit-repository-interface'

export class UserLimitInMemoryDBRepository implements UserLimitRepositoryInterface {
	private userLimitCollection?: Map<string, UserLimit>
	private log: Log

	constructor(eventId?: string) {
		this.userLimitCollection = new Map<string, UserLimit>()
		this.log = new Log(this.constructor.name, eventId)
	}

	async saveUserLimit(payload: UserLimitCreatedPayloadType) {
		// for now always save new limit, even if it already exists

		// if (await this.getUserLimit(payload.userLimitId)) {
		// 	throw new UserLimitAlreadyExists(`Limit: ${payload.userLimitId}, already exists in the database`)
		// }

		this.log.info(`Saving user limit: ${payload.userLimitId}`)
		this.userLimitCollection.set(payload.userLimitId, payload as UserLimit)
		return this.getUserLimit(payload.userLimitId)
	}

	async updateUserLimitProgress(payload: UserLimitProgressChangedPayloadType) {
		const existingUserLimit = await this.getUserLimit(payload.userLimitId)

		if (!existingUserLimit) {
			throw new UserLimitDoesNotExist(`Limit: ${payload.userLimitId}, does not exist in the database`)
		}

		this.log.info(`Updating user limit progress: ${payload.userLimitId}`)
		const newAmount = Number(existingUserLimit.value) - Number(payload.amount ?? 0)

		if (newAmount < 0) {
			throw new InsufficientAmountLeft(`Insufficient amount left in limit: ${payload.userLimitId}`)
		}

		existingUserLimit.progress = newAmount.toString()
		this.userLimitCollection.set(payload.userLimitId, existingUserLimit)
		return this.getUserLimit(payload.userLimitId)
	}

	async resetUserLimit(payload: UserLimitResetPayloadType) {
		const existingUserLimit = await this.getUserLimit(payload.userLimitId)

		if (!existingUserLimit) {
			throw new UserLimitDoesNotExist(`Limit: ${payload.userLimitId}, does not exist in the database`)
		}

		this.log.info(`Resetting user limit: ${payload.userLimitId}`)
		existingUserLimit.progress = payload.resetAmount
		existingUserLimit.nextResetTime = payload.nextResetTime

		this.userLimitCollection.set(payload.userLimitId, existingUserLimit)
		return this.getUserLimit(payload.userLimitId)
	}

	// fake async function to simulate a database call
	async getUserLimit(key: string): Promise<UserLimit> {
		this.log.info(`Getting user limit: ${key}`)
		const limit = this.userLimitCollection.get(key)
		return limit
	}
}

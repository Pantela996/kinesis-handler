import {
	UserLimitCreatedPayloadType,
	UserLimitPayloadType,
	UserLimitProgressChangedPayloadType,
	UserLimitResetPayloadType,
	validateSchema,
} from '../../types/payloads'
import { UserLimitEventType } from '../../types/events'
import { InvalidUserCreatedPayloadError, InvalidUserProgressChangedPayloadError, InvalidUserResetPayloadError } from '../../types/errors'
import { UserLimitRepositoryInterface } from '../../repository/user-limit-repository-interface'
import { Log } from '../logger'
import { AWSKinesisClient } from '../../clients/aws-kinesis-client'

export class UserLimitEventHandlerService {
	private userLimitRepository: UserLimitRepositoryInterface
	private log: Log
	private kinesisClient: AWSKinesisClient

	constructor(userLimitRepository: UserLimitRepositoryInterface, kinesisClient?: AWSKinesisClient, eventId?: string) {
		this.log = new Log(this.constructor.name, eventId)
		this.userLimitRepository = userLimitRepository
		this.kinesisClient = kinesisClient
	}

	public async handle(payload: UserLimitPayloadType, type: UserLimitEventType): Promise<boolean> {
		try {
			switch (type) {
				case UserLimitEventType.USER_LIMIT_CREATED:
					this.log.info(`UserLimitCreated event ${payload}`)
					await this.handleUserLimitCreated(payload)
					return true
				case UserLimitEventType.USER_LIMIT_PROGRESS_CHANGED:
					this.log.info(`UserLimitProgressChanged event ${payload}`)
					await this.handleUserLimitProgressChanged(payload)
					return true
				case UserLimitEventType.USER_LIMIT_RESET:
					this.log.info(`UserLimitReset event ${payload}`)
					await this.handleUserLimitReset(payload)
					return true
				default:
					this.log.error(`Unknown event type: ${type}`)
					// We don't want to throw an error here, when we receive an unknown event type we just want to log it and return false
					return false
			}
		} catch (error) {
			this.log.error(`An error occurred: ${error}`)
			// Decide here what we want to do with the error, retry or send to SQS DLQ...
			await this.kinesisClient?.publishEvent(error)
			throw error
		}
	}

	private async handleUserLimitCreated(payload: UserLimitCreatedPayloadType) {
		if (!validateSchema<UserLimitCreatedPayloadType>(payload, UserLimitEventType.USER_LIMIT_CREATED)) {
			this.log.error('Invalid UserLimitCreated payload')
			throw new InvalidUserCreatedPayloadError('Invalid UserLimitCreated payload')
		}

		await this.userLimitRepository.saveUserLimit(payload)
	}

	private async handleUserLimitProgressChanged(payload: UserLimitProgressChangedPayloadType) {
		if (!validateSchema<UserLimitProgressChangedPayloadType>(payload, UserLimitEventType.USER_LIMIT_PROGRESS_CHANGED)) {
			this.log.error('Invalid UserLimitProgressChanged event')
			throw new InvalidUserProgressChangedPayloadError('Invalid UserLimitProgressChanged event')
		}

		await this.userLimitRepository.updateUserLimitProgress(payload)
	}

	private async handleUserLimitReset(payload: UserLimitResetPayloadType) {
		if (!validateSchema<UserLimitResetPayloadType>(payload, UserLimitEventType.USER_LIMIT_RESET)) {
			this.log.error('Invalid UserLimitReset payload')
			throw new InvalidUserResetPayloadError('Invalid UserLimitReset payload')
		}

		await this.userLimitRepository.resetUserLimit(payload)
	}
}

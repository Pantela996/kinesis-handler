import { PutItemCommand, GetItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { UserLimitCreatedPayloadType, UserLimitProgressChangedPayloadType, UserLimitResetPayloadType } from '../types/payloads'
import { UserLimit } from '../types/user-limit'
import { UserLimitRepositoryInterface } from './user-limit-repository-interface'
import { Log } from '../services/logger'

class UserLimitDynamoDBRepository implements UserLimitRepositoryInterface {
	private client: DynamoDBClient
	private log: Log

	constructor(eventId?: string) {
		this.client = new DynamoDBClient()
		this.log = new Log(this.constructor.name, eventId)
	}

	async saveUserLimit(record: UserLimitCreatedPayloadType) {
		const params = {
			TableName: 'userLimit',
			Item: marshall(record),
		}

		try {
			const result = await this.client.send(new PutItemCommand(params))
			return unmarshall(result.Attributes) as UserLimit
		} catch (error) {
			this.log.error(error)
			throw error
		}
	}

	async updateUserLimitProgress(payload: UserLimitProgressChangedPayloadType) {
		const params = {
			TableName: 'userLimit',
			Key: {
				userLimitId: { S: payload.userLimitId },
			},
			UpdateExpression: 'set progress = :p',
			ExpressionAttributeValues: {
				':p': { N: (Number(payload.previousProgress) + Number(payload.amount)).toString() },
			},
			Item: marshall(payload),
		}

		try {
			const result = await this.client.send(new PutItemCommand(params))
			return unmarshall(result.Attributes) as UserLimit
		} catch (error) {
			this.log.error(error)
			throw error
		}
	}

	async resetUserLimit(payload: UserLimitResetPayloadType) {
		const params = {
			TableName: 'userLimit',
			Key: {
				userLimitId: { S: payload.userLimitId },
			},
			ExpressionAttributeValues: {
				':resetAmount': { S: payload.resetAmount },
				':nextResetTime': { S: payload.nextResetTime.toString() },
			},
			ConditionExpression: 'progress = :resetAmount AND nextResetTime = :nextResetTime',
			Item: marshall(payload),
		}

		try {
			const result = await this.client.send(new PutItemCommand(params))
			return unmarshall(result.Attributes) as UserLimit
		} catch (error) {
			this.log.error(error.info)
			throw error
		}
	}

	async getUserLimit(key: string) {
		const params = {
			TableName: 'userLimit',
			Key: {
				userLimitId: { S: key },
			},
		}

		try {
			const result = await this.client.send(new GetItemCommand(params))
			return unmarshall(result.Item) as UserLimit
		} catch (error) {
			this.log.error(error)
			throw error
		}
	}
}

export default UserLimitDynamoDBRepository

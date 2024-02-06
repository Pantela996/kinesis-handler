import { KinesisStreamEvent, Context, KinesisStreamHandler, KinesisStreamRecordPayload, KinesisStreamRecord } from 'aws-lambda'
import { Buffer } from 'buffer'
import { Logger } from '@aws-lambda-powertools/logger'
import { UserLimitEventType, UserLimitKinesisEvent, assertEvent } from './types/events'
import { config } from 'dotenv'
import { UserLimitEventHandlerService } from './services/event-handlers/user-limit-event-handler-service'
import { AWSKinesisClient } from './clients/aws-kinesis-client'
import { handle } from './domain'
import { UserLimitInMemoryDBRepository } from './repository/user-limit-inmemorydb-repository'
import UserLimitDynamoDBRepository from './repository/user-limit-dynamodb-repository'

config({
	path: './config/.env',
})

const logger = new Logger({
	logLevel: 'INFO',
	serviceName: 'kinesis-stream-handler',
})

type ExtendedKinesisStreamRecord = KinesisStreamRecord & { type: UserLimitEventType }

export const handler: KinesisStreamHandler = async (event: KinesisStreamEvent, _context: Context): Promise<void> => {
	for (const record of event.Records as ExtendedKinesisStreamRecord[]) {
		try {
			const recordData = getRecordData(record.kinesis)

			logger.addPersistentLogAttributes({ eventId: recordData.eventId })

			if (!assertEvent(recordData)) {
				logger.error(`Invalid record data: ${recordData}`)
				throw new Error('Invalid record data')
			}

			logger.info(`Processed Kinesis Event - EventID: ${recordData.eventId}`)

			const kinesisClient = new AWSKinesisClient('user-limit-events', recordData.eventId)
			const userLimitRepository = process.env.DB === 'inMemory' ? new UserLimitInMemoryDBRepository(recordData.eventId) : new UserLimitDynamoDBRepository(recordData.eventId)
			const recordHandlerService = new UserLimitEventHandlerService(userLimitRepository, kinesisClient, recordData.eventId)

			await handle(recordHandlerService, {
				data: recordData.data,
				type: recordData.type,
			})
		} catch (err) {
			logger.error(`An error occurred ${err}`)
			// Decide here what we want to do with the error, retry or send to SQS DLQ...
		}

		process.env.NODE_ENV !== 'test' ? console.log('------------------') : null
	}

	logger.info(`Successfully processed ${event.Records.length} records.`)
}

function getRecordData(payload: KinesisStreamRecordPayload): UserLimitKinesisEvent {
	try {
		const data = Buffer.from(payload.data, 'base64').toString('utf-8')
		return JSON.parse(data)
	} catch (error) {
		logger.error(`An error occurred ${error}`)
		throw error
	}
}

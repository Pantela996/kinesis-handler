import { Kinesis, PutRecordInput } from '@aws-sdk/client-kinesis'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { Log } from '../services/logger'

export class AWSKinesisClient {
	private kinesis: Kinesis
	private log: Log
	private streamName = 'user-limit-events'

	constructor(streamName: string, eventId?: string) {
		this.kinesis = new Kinesis({
			endpoint: 'http://host.docker.internal:4567',
			credentials: {
				accessKeyId: 'your-access-key-id',
				secretAccessKey: 'your-secret-access-key',
			},
			requestHandler: new NodeHttpHandler(),
			region: 'eu-west-2',
		})
		this.log = new Log(this.constructor.name, eventId)
		this.streamName = streamName
	}

	async publishEvent(eventData: any): Promise<void> {
		const params: PutRecordInput = {
			StreamName: this.streamName,
			Data: new TextEncoder().encode(JSON.stringify(eventData)),
			PartitionKey: '1',
		}

		try {
			await this.kinesis.putRecord(params)
			this.log.info('Event published successfully')
		} catch (error) {
			this.log.error(`Failed to publish event: ${error}`)
		}
	}
}

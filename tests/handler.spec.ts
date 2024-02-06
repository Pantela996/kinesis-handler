import { handler } from '../src/index'
import events from '../events.json'
import { handle } from '../src/domain'

jest.mock('../src/domain')

describe('handler', () => {
	beforeAll(() => {
		process.env.DB = 'inMemory';
	})

	it('should process all records', async () => {
		const UserLimitKinesisEvents = []
		events.forEach(event => {
			UserLimitKinesisEvents.push({
				kinesis: {
					data: Buffer.from(JSON.stringify(event)).toString('base64'),
				},
			})
		})

		await handler({ Records: UserLimitKinesisEvents }, null, null)

		expect(handle).toHaveBeenCalledTimes(events.length)
	})
})

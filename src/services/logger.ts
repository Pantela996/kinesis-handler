import { Logger } from '@aws-lambda-powertools/logger'

export class Log {
	private logger: Logger

	constructor(serviceName: string, eventId: string) {
		this.logger = new Logger({ serviceName })
		this.logger.addPersistentLogAttributes({ eventId })
	}

	info(message: string) {
		if (process.env.NODE_ENV === 'test') {
			return this.logger.debug(message)
		}
		this.logger.info(message)
	}

	error(message: string) {
		this.logger.error(message)
	}

	warn(message: string) {
		this.logger.warn(message)
	}
}

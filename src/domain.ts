import { UserLimitEventHandlerService } from './services/event-handlers/user-limit-event-handler-service'
import { UserLimitEventType } from './types/events'
import { UserLimitPayloadType } from './types/payloads'

export const handle = async (
	userLimitEventHandlerService: UserLimitEventHandlerService,
	payload: {
		data: UserLimitPayloadType
		type: UserLimitEventType
	}
) => {
	return userLimitEventHandlerService.handle(payload.data, payload.type)
}

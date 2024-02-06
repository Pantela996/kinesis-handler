import { z } from 'zod'
import { LimitPeriod, LimitStatus, LimitType } from './user-limit'
import { UserLimitEventType } from './events'
import { InvalidEventTypeError } from './errors'

const commonSchema = z.object({
	brandId: z.string(),
	currencyCode: z.string(),
	userId: z.string(),
	userLimitId: z.string(),
})

const UserLimitCreatedPayloadSchema = commonSchema.extend({
	activeFrom: z.number(),
	activeUntil: z.number().optional(),
	createdAt: z.number().optional(),
	nextResetTime: z.number().optional(),
	period: z.nativeEnum(LimitPeriod),
	status: z.nativeEnum(LimitStatus),
	type: z.nativeEnum(LimitType),
	value: z.string(),
	previousLimitValue: z.string().optional(),
	progress: z.string().optional(),
})

export type UserLimitCreatedPayloadType = z.infer<typeof UserLimitCreatedPayloadSchema>

const UserLimitProgressChangedPayloadSchema = commonSchema.extend({
	amount: z.string(),
	nextResetTime: z.number(),
	previousProgress: z.string(),
	remainingAmount: z.string().optional(),
})

export type UserLimitProgressChangedPayloadType = z.infer<typeof UserLimitProgressChangedPayloadSchema>

const UserLimitResetPayloadSchema = commonSchema.extend({
	nextResetTime: z.number(),
	period: z.nativeEnum(LimitPeriod),
	resetAmount: z.string(),
	resetPercentage: z.string(),
	type: z.nativeEnum(LimitType),
	unusedAmount: z.string(),
})

export type UserLimitResetPayloadType = z.infer<typeof UserLimitResetPayloadSchema>

export function validateSchema<T>(data: T, type: UserLimitEventType): data is T {
	try {
		let schema: typeof commonSchema

		switch (type) {
			case UserLimitEventType.USER_LIMIT_CREATED:
				schema = UserLimitCreatedPayloadSchema
				break
			case UserLimitEventType.USER_LIMIT_PROGRESS_CHANGED:
				schema = UserLimitProgressChangedPayloadSchema
				break
			case UserLimitEventType.USER_LIMIT_RESET:
				schema = UserLimitResetPayloadSchema
				break
			default:
				throw new InvalidEventTypeError('Invalid event type')
		}

		schema.parse(data)
		return true
	} catch (error) {
		throw new Error(`Validation failed: ${JSON.stringify(error.formErrors.fieldErrors)}`)
	}
}

export type UserLimitPayloadType = UserLimitCreatedPayloadType | UserLimitProgressChangedPayloadType | UserLimitResetPayloadType

import { UserLimitCreatedPayloadType, UserLimitProgressChangedPayloadType, UserLimitResetPayloadType } from '../types/payloads'
import { UserLimit } from '../types/user-limit'

export interface UserLimitRepositoryInterface {
	saveUserLimit(payload: UserLimitCreatedPayloadType): Promise<UserLimit>
	updateUserLimitProgress(payload: UserLimitProgressChangedPayloadType): Promise<UserLimit>
	resetUserLimit(payload: UserLimitResetPayloadType): Promise<UserLimit>
	getUserLimit(key: string): Promise<UserLimit>
}

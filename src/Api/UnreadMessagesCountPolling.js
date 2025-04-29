import PollingService from "./Polling";

export default class UnreadMessagesCountPollingService extends PollingService {
	async pollFunction() {
		await this.api.getUnreadMessagesCount();
	}
}

import PollingService from "./Polling";

export default class UnreadMessagesCountPollingService extends PollingService {
	// TODO: @gerben; make tests
	async pollFunction() {
		await this.api.getUnreadMessagesCount();
	}
}

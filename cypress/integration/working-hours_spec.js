import {areWeOnline} from "../../src/UI/Scripts/WorkingHours";

const weekdays = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

/**
 * Creates an array with the formatted start and end time.
 * Format [08.00, 17.00] ([startTime, endTime])
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @return {number[]}
 */
function createFormattedWeekday(startDate, endDate) {
	let startTimeFormatted = `${startDate.getHours()}.${startDate.getMinutes()}`;
	let endTimeFormatted = `${endDate.getHours()}.${endDate.getUTCMinutes()}`;
	if(startDate.getMinutes() < 10)
		startTimeFormatted = `${startDate.getHours()}.0${startDate.getMinutes()}`;

	if(endDate.getMinutes() < 10)
		endTimeFormatted = `${endDate.getHours()}.0${endDate.getMinutes()}`;


	return [
		parseFloat(startTimeFormatted), parseFloat(endTimeFormatted),
	];
}

/**
 * Returns the time x minutes into the future
 * @param minutes
 * @return {Date}
 */
function getTimeInFuture(minutes) {
	const date = new Date();
	date.setMinutes(date.getMinutes() + minutes);

	return date;
}

/**
 * Returns the time x minutes into the past
 * @param minutes
 * @return {Date}
 */
function getTimeInPast(minutes) {
	const date = new Date();
	date.setMinutes(date.getMinutes() - minutes);

	return date;
}

describe("Working hours script", () => {
	describe("areWeOnline()", () => {
		it("should return true if office hours are not set", () => {
			expect(areWeOnline()).to.be.equal(true);
		});
		describe("format [\"DayOfTheWeek\", startTime, endTime]", () => {
			it("should return false while outside office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInPast(10);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						weekdays[startDate.getDay()],
						startTimeFormatted,
						endTimeFormatted,
					],
				])).to.be.equal(false);
			});
			it("should return true while inside office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInFuture(10);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						weekdays[startDate.getDay()],
						startTimeFormatted,
						endTimeFormatted,
					],
				])).to.be.equal(true);
			});
			it("should return true while inside office hours 00:00 - 23:59", () => {
				const startDate = new Date();

				expect(areWeOnline([
					[
						weekdays[startDate.getDay()],
						"0.00",
						"23.59",
					],
				])).to.be.equal(true);
			});
		});
		describe("format [\"DayOfTheWeek\", startTime, endTime, openOrClosed]", () => {
			it("should return false while outside OPEN office hours", () => {
				const startDate = getTimeInFuture(10);
				const endDate = getTimeInFuture(60);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						weekdays[startDate.getDay()],
						startTimeFormatted,
						endTimeFormatted,
						true,
					],
				])).to.be.equal(false);
			});
			it("should return true while inside OPEN office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInFuture(60);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						weekdays[startDate.getDay()],
						startTimeFormatted,
						endTimeFormatted,
						true,
					],
				])).to.be.equal(true);
			});
			it("should return false while inside CLOSED office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInFuture(60);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						weekdays[startDate.getDay()],
						startTimeFormatted,
						endTimeFormatted,
						false,
					],
				])).to.be.equal(false);
			});
			it("should return true while outside CLOSED office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInPast(10);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						weekdays[startDate.getDay()],
						startTimeFormatted,
						endTimeFormatted,
						false,
					],
				])).to.be.equal(true);
			});
		});
		describe("format [startTimeTimestamp, endTimeTimestamp]", () => {
			it("should return false while outside office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInPast(10);

				expect(areWeOnline([
					[
						startDate.getTime() / 1000,
						endDate.getTime() / 1000,
					],
				])).to.be.equal(false);
			});
			it("should return true while inside office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInFuture(60);

				expect(areWeOnline([
					[
						startDate.getTime() / 1000,
						endDate.getTime() / 1000,
					],
				])).to.be.equal(true);
			});
			describe("format 2x [startTimeTimestamp, endTimeTimestamp]", () => {
				it("should return false while outside office hours", () => {
					const startDate1 = getTimeInPast(60);
					const endDate1 = getTimeInPast(10);
					const startDate2 = getTimeInFuture(10);
					const endDate2 = getTimeInFuture(60);

					expect(areWeOnline([
						[
							startDate1.getTime() / 1000,
							endDate1.getTime() / 1000,
						],
						[
							startDate2.getTime() / 1000,
							endDate2.getTime() / 1000,
						],
					])).to.be.equal(false);
				});
				it("should return true while inside office hours", () => {
					const startDate1 = getTimeInPast(60);
					const endDate1 = getTimeInPast(10);
					const startDate2 = getTimeInPast(10);
					const endDate2 = getTimeInFuture(60);

					expect(areWeOnline([
						[
							startDate1.getTime() / 1000,
							endDate1.getTime() / 1000,
						],
						[
							startDate2.getTime() / 1000,
							endDate2.getTime() / 1000,
						],
					])).to.be.equal(true);
				});
			});
		});
		describe("format [startTimeTimestamp, endTimeTimestamp, openOrClosed]", () => {
			it("should return false while outside OPEN office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInPast(10);

				expect(areWeOnline([
					[
						startDate.getTime() / 1000,
						endDate.getTime() / 1000,
						true,
					],
				])).to.be.equal(false);
			});
			it("should return true while inside OPEN office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInFuture(60);

				expect(areWeOnline([
					[
						startDate.getTime() / 1000,
						endDate.getTime() / 1000,
						true,
					],
				])).to.be.equal(true);
			});
			it("should return true while outside CLOSED office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInPast(10);

				expect(areWeOnline([
					[
						startDate.getTime() / 1000,
						endDate.getTime() / 1000,
						false,
					],
				])).to.be.equal(true);
			});
			it("should return false while inside CLOSED office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInFuture(60);

				expect(areWeOnline([
					[
						startDate.getTime() / 1000,
						endDate.getTime() / 1000,
						false,
					],
				])).to.be.equal(false);
			});
		});
		describe("both formats", () => {
			it("should return false while outside office hours", () => {
				const startDate1 = getTimeInPast(60);
				const endDate1 = getTimeInPast(10);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate1, endDate1);

				const startDate2 = getTimeInFuture(10);
				const endDate2 = getTimeInFuture(60);

				expect(areWeOnline([
					[
						weekdays[startDate1.getDay()],
						startTimeFormatted,
						endTimeFormatted,
					],
					[
						startDate2.getTime() / 1000,
						endDate2.getTime() / 1000,
					],
				])).to.be.equal(false);
			});
			it("should return true while inside office hours", () => {
				const startDate1 = getTimeInPast(60);
				const endDate1 = getTimeInPast(10);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate1, endDate1);

				const startDate2 = getTimeInPast(10);
				const endDate2 = getTimeInFuture(60);

				expect(areWeOnline([
					[
						weekdays[startDate1.getDay()],
						startTimeFormatted,
						endTimeFormatted,
					],
					[
						startDate2.getTime() / 1000,
						endDate2.getTime() / 1000,
					],
				])).to.be.equal(true);
			});
			it("should return false while outside office hours (timestamp format), but inside office hours (day format)", () => {
				const startDate1 = getTimeInPast(60);
				const endDate1 = getTimeInFuture(60);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate1, endDate1);

				const startDate2 = getTimeInPast(60);
				const endDate2 = getTimeInPast(10);

				expect(areWeOnline([
					[
						weekdays[startDate1.getDay()],
						startTimeFormatted,
						endTimeFormatted,
					],
					[
						startDate2.getTime() / 1000,
						endDate2.getTime() / 1000,
					],
				])).to.be.equal(false);
			});
		});
	});
});

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
 * Returns the time in the future
 * @param minutes
 * @param hours
 * @param days
 * @param months
 * @param years
 * @return {Date}
 */
function getTimeInFuture(minutes, hours = 0, days = 0, months = 0, years = 0) {
	const date = new Date();
	date.setMinutes(date.getMinutes() + minutes);
	date.setHours(date.getHours() + hours);
	date.setDate(date.getDate() + days);
	date.setMonth(date.getMonth() + months);
	date.setFullYear(date.getFullYear() + years);

	return date;
}

/**
 * Returns the time in the past
 * @param minutes
 * @param hours
 * @param days
 * @param months
 * @param years
 * @return {Date}
 */
function getTimeInPast(minutes, hours = 0, days = 0, months = 0, years = 0) {
	const date = new Date();
	date.setMinutes(date.getMinutes() - minutes);
	date.setHours(date.getHours() - hours);
	date.setDate(date.getDate() - days);
	date.setMonth(date.getMonth() - months);
	date.setFullYear(date.getFullYear() - years);

	return date;
}

/**
 * Returns the name of the day as a lowercase string
 * @param {Date} date
 * @returns {string}
 */
function getDayNameFromDate(date) {
	return date.toLocaleString("en-GB", {weekday: "long"}).toLowerCase();
}

/**
 * Returns the next day for a specific date object
 * @param date {Date}
 * @returns {string}
 */
function getNextDay(date) {
	return weekdays[date.getDay() === (weekdays.length - 1) ? 0 : date.getDay() + 1];
}

describe("Working hours script", () => {
	describe("areWeOnline()", () => {
		it("should return true if office hours are not set", () => {
			expect(areWeOnline()).to.be.equal(true);
		});
		describe("format [DayOfTheWeek, startTime, endTime]", () => {
			it("should return false while outside office hours", () => {
				const startDate = getTimeInPast(60);
				const endDate = getTimeInPast(10);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						getDayNameFromDate(startDate),
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
						getDayNameFromDate(startDate),
						startTimeFormatted,
						endTimeFormatted,
					],
				])).to.be.equal(true);
			});
			it("should return true while inside office hours 00:00 - 23:59", () => {
				const startDate = new Date();

				expect(areWeOnline([
					[
						getDayNameFromDate(startDate),
						"0.00",
						"23.59",
					],
				])).to.be.equal(true);
			});
			it("should return false when office hours are not numbers", () => {
				const startDate = new Date();

				expect(areWeOnline([
					[
						getDayNameFromDate(startDate),
						"a.aa",
						"b.bb",
					],
				])).to.be.equal(false);
			});
			describe("format 2x [DayOfTheWeek, startTime, endTime]", () => {
				it("should return false while outside office hours", () => {
					const startDate1 = getTimeInPast(60);
					const endDate1 = getTimeInPast(10);
					const [
						startTimeFormatted1, endTimeFormatted1,
					] = createFormattedWeekday(startDate1, endDate1);

					const startDate2 = getTimeInPast(60);
					const endDate2 = getTimeInPast(10);
					const [
						startTimeFormatted2, endTimeFormatted2,
					] = createFormattedWeekday(startDate2, endDate2);

					expect(areWeOnline([
						[
							getDayNameFromDate(startDate1),
							startTimeFormatted1,
							endTimeFormatted1,
						],
						[
							getNextDay(startDate2),
							startTimeFormatted2,
							endTimeFormatted2,
						],
					])).to.be.equal(false);
				});
				it("should return true while inside office hours", () => {
					const startDate1 = getTimeInPast(60);
					const endDate1 = getTimeInFuture(10);
					const [
						startTimeFormatted1, endTimeFormatted1,
					] = createFormattedWeekday(startDate1, endDate1);

					const startDate2 = getTimeInPast(60);
					const endDate2 = getTimeInFuture(10);
					const [
						startTimeFormatted2, endTimeFormatted2,
					] = createFormattedWeekday(startDate2, endDate2);

					expect(areWeOnline([
						[
							getDayNameFromDate(startDate1),
							startTimeFormatted1,
							endTimeFormatted1,
						],
						[
							getNextDay(startDate2),
							startTimeFormatted2,
							endTimeFormatted2,
						],
					])).to.be.equal(true);
				});
			});
		});
		describe("format [DayOfTheWeek, startTime, endTime, openOrClosed]", () => {
			it("should return false while outside OPEN office hours", () => {
				const startDate = getTimeInFuture(10);
				const endDate = getTimeInFuture(60);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate, endDate);

				expect(areWeOnline([
					[
						getDayNameFromDate(startDate),
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
						getDayNameFromDate(startDate),
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
						getDayNameFromDate(startDate),
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
						getDayNameFromDate(startDate),
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
						getDayNameFromDate(startDate1),
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
						getDayNameFromDate(startDate1),
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
						getDayNameFromDate(startDate1),
						startTimeFormatted,
						endTimeFormatted,
					],
					[
						startDate2.getTime() / 1000,
						endDate2.getTime() / 1000,
					],
				])).to.be.equal(false);
			});
			it("should return true while outside office hours (timestamp format), but inside office hours (day format) and timestamp format is exactly 1 month ago (so day numbers are the same)", () => {
				const startDate1 = getTimeInPast(60);
				const endDate1 = getTimeInFuture(60);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate1, endDate1);

				const startDate2 = getTimeInPast(0, 3, 0, 1);
				const endDate2 = getTimeInPast(0, 1, 0, 1);

				expect(areWeOnline([
					[
						getDayNameFromDate(startDate1),
						startTimeFormatted,
						endTimeFormatted,
					],
					[
						startDate2.getTime() / 1000,
						endDate2.getTime() / 1000,
					],
				])).to.be.equal(true);
			});
			it("should return true while outside office hours (timestamp format), but inside office hours (day format) and timestamp format is exactly 1 year ago (so day/month numbers are the same)", () => {
				const startDate1 = getTimeInPast(60);
				const endDate1 = getTimeInFuture(60);
				const [
					startTimeFormatted, endTimeFormatted,
				] = createFormattedWeekday(startDate1, endDate1);

				const startDate2 = getTimeInPast(0, 3, 0, 0, 1);
				const endDate2 = getTimeInPast(0, 1, 0, 0, 1);

				expect(areWeOnline([
					[
						getDayNameFromDate(startDate1),
						startTimeFormatted,
						endTimeFormatted,
					],
					[
						startDate2.getTime() / 1000,
						endDate2.getTime() / 1000,
					],
				])).to.be.equal(true);
			});
		});
	});
});

// Matches the current Day and Time to the weekdays setting
// If you are outside the specified time, FALSE is returned
// If you are inside the specified time, TRUE is returned
export function areWeOnline(workingHours) {
	if(!workingHours || workingHours.length === 0) { // If weekdays aren't set, we just say we are online
		return true;
	}

	const currentDate = new Date();
	const lengthForTimestampOnly = 2;
	const lengthForTimestampAndBool = 3;
	const lengthForDayAndTime = 3;
	const lengthForDayAndTimeAndBool = 4;
	const indexForTimestampBool = 2;
	const indexForDayAndTimeBool = 3;

	const interfaceWeekdayTimestamps = workingHours.filter((x) => {
		if(x.length === lengthForTimestampOnly) { // Find [timestamp, timestamp]
			return true;
		} else if(x.length === lengthForTimestampAndBool && typeof x[indexForTimestampBool] === "boolean") { // Find [timestamp, timestamp, openOrClosed]
			return true;
		}
		return false;
	});
	const interfaceWeekdayDays = workingHours.filter((x) => {
		if(x.length === lengthForDayAndTime) { // Find ["DayOfTheWeek", HH.MM, HH.MM]
			return true;
		} else if(x.length === lengthForDayAndTimeAndBool && typeof x[indexForDayAndTimeBool] === "boolean") { // Find ["DayOfTheWeek", HH.MM, HH.MM, openOrClosed]
			return true;
		}
		return false;
	});

	let isOnline = handleTimestamps(interfaceWeekdayTimestamps, currentDate);
	if(isOnline === null)
		isOnline = handleDays(interfaceWeekdayDays, currentDate);

	return isOnline;
}

/**
 * Checks if the current time is within one of the open/close hours.
 * Multiple ranges can be set for the same day.
 * Check the return rules for exact rules used in the check.
 *
 * @param {Array<Array<Number>>} timestamps Format `[[openHoursTimestamp, closeHoursTimestamp],[..., ...]]`
 * @param {Date} currentDate
 * @return {Boolean|null}
 * `TRUE` if current time is in between one of the start/end timestamps
 * `FALSE` if current time is greater than the end timestamp AND we are on the same day as the end timestamp
 * `NULL` if we haven't found any timestamp that matches the rules above
 */
function handleTimestamps(timestamps, currentDate) {
	const indexForTimestampBool = 2;
	const thousand = 1000;

	let isOnline = null; // Return `null` if we haven't found any valid timestamps
	for(let i = 0; i < timestamps.length; i++) {
		const timestampInfo = timestamps[i];
		const startDate = new Date(timestampInfo[0] * thousand);
		const endDate = new Date(timestampInfo[1] * thousand);
		const isOpen = timestampInfo[indexForTimestampBool] === undefined ? true : timestampInfo[indexForTimestampBool]; // Whether we are open (true) or closed (false) in this period

		if(currentDate.getTime() > endDate.getTime() && currentDate.getDate() === endDate.getDate()) { // Return true if current time is between start and end
			isOnline = !isOpen;
			continue; // If there is another timestamp after this one, we give it the possibility to set us back to `online`
		} else if(currentDate.getTime() >= startDate.getTime() && currentDate.getTime() <= endDate.getTime()) { // Return false if current time is after end, BUT only when current day is the same day as end
			isOnline = Boolean(isOpen);
			break; // We don't want another timestamp to set us back to `offline`
		}
	}

	return isOnline;
}

/**
 * Checks if the current time is within one of the open/close hours.
 *
 * @param {Array<Array<string>>} days Format `[["DayOfTheWeek", HH.MM, HH.MM]]`
 * @param {Date} currentDate
 * @return {Boolean|null}
 */
function handleDays(days, currentDate) {
	const ten = 10;

	const currentDay = currentDate.toLocaleString("en-GB", {weekday: "long"}).toLowerCase();
	let currentTimeFormatted = parseFloat(`${currentDate.getHours()}.${currentDate.getMinutes()}`);
	if(currentDate.getMinutes() < ten)
		currentTimeFormatted = parseFloat(`${currentDate.getHours()}.0${currentDate.getMinutes()}`);

	let isOnline = null;
	for(let i = 0; i < days.length; i++) {
		const dayInfo = days[i];

		let [
			day, startTime, endTime, isOpen,
		] = dayInfo;
		startTime = parseFloat(startTime);
		endTime = parseFloat(endTime);
		isOpen = isOpen === undefined ? true : isOpen; // Whether we are open (true) or closed (false) in this period

		if(day.toLowerCase() !== currentDay) { // Ignore days which are not today
			continue;
		}

		// Allow `startTime` and `endTime` to be `0` (like 0.00 midnight)
		// Fixes #163
		if(isNaN(startTime) || isNaN(endTime)) { // Missing start or end time
			isOnline = false;
		} else if(currentTimeFormatted < startTime || currentTimeFormatted > endTime) { // current time outside start/end time
			isOnline = !isOpen;
		} else { // Valid start and end time and current time is between both
			isOnline = Boolean(isOpen);
			break; // We don't want another timestamp to set us back to `offline`
		}
	}

	return isOnline;
}

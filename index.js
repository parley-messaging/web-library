/* eslint-disable no-alert,no-magic-numbers,compat/compat */

let showOptions = true;
const localStorageKey = "parleyDemoV2Settings";
let fromButtonClick = false;
let settingsUrl = "";

// Default config used to create a chat
const config = {roomNumber: "0W4qcE5aXoKq9OzvHxj2"};
window.parleySettingsDemo = config;

// Create event handlers
document.getElementById("startChatOptionsForm").addEventListener("click", createChat);
document.getElementById("startChatOptionsFormSubmitButton").addEventListener("click", () => {
	fromButtonClick = true;
});
document.getElementById("additionalInformationForm").addEventListener("click", setAdditionalInfo);
document.getElementById("toggleOptionsButton").addEventListener("click", toggleOptions);

function findGetParameter(parameterName) {
	let result = null;
	let tmp = [];
	location.search
		.substr(1)
		.split("&")
		.forEach((item) => {
			tmp = item.split("=");
			if(tmp[0] === parameterName)
				result = decodeURIComponent(tmp[1]);
		});
	return result;
}

function toggleOptions() {
	showOptions = !showOptions;

	if(showOptions) {
		document.getElementById("loginContainer").style.display = "block";
		document.getElementById("toggleOptions").classList.add("right");
		document.getElementById("toggleOptions").classList.remove("left");
		document.getElementById("toggleOptionsButton").innerHTML = "<";
	} else {
		document.getElementById("loginContainer").style.display = "none";
		document.getElementById("toggleOptions").classList.add("left");
		document.getElementById("toggleOptions").classList.remove("right");
		document.getElementById("toggleOptionsButton").innerHTML = ">";
	}
}

function createChat() {
	if(fromButtonClick === true) {
		// Reset all cookies if there were any
		window.localStorage.clear();

		// Remove old messenger
		window.removeParleyMessenger();
	}

	// Un hide all nodes with the `hide-untill-start` classname
	const nodes = document.querySelectorAll(".hide-untill-start");
	for(let i = 0; i < nodes.length; i++)
		nodes.item(i).classList.remove("hide-untill-start");


	// Get values from input fields
	config.roomNumber = document.getElementById("accountId").value;
	config.xIrisIdentification = document.getElementById("deviceId").value;
	config.apiDomain = document.getElementById("apiDomain").value;
	const backgroundUrl = document.getElementById("background").value;

	// Save settings url
	const urlSearchParams = new URLSearchParams();
	urlSearchParams.append("accountId", config.roomNumber);
	urlSearchParams.append("deviceId", config.xIrisIdentification);
	urlSearchParams.append("apiDomain", config.apiDomain);
	urlSearchParams.append("background", backgroundUrl);
	urlSearchParams.append("start", "true");
	settingsUrl = `${location.origin + location.pathname}?${urlSearchParams.toString()}`;
	window.history.pushState("", document.title, settingsUrl);

	// Save settings into cookie and load on page refresh
	localStorage.setItem(localStorageKey, JSON.stringify({
		accountId: config.roomNumber,
		deviceId: config.xIrisIdentification,
		apiDomain: config.apiDomain,
		background: backgroundUrl,
	}));

	// Create the chat with the default config and the input values
	window.parleySettings = config;
	window.startParleyMessenger();

	return false; // To cancel the form's submit
}

function loginChat() {
	document.getElementById("login").disabled = true;
	const authHeader = document.getElementById("authHeader").value;

	window.parleySettings.registerNewDevice(authHeader, () => {
		alert("You are now logged in!");

		document.getElementById("logout").disabled = false;
	}, () => {
		alert("Something went wrong while logging in, please refresh and try again.");
	});

	return false; // To cancel the form's submit
}

function logoutChat() {
	window.parleySettings.registerNewDevice("");
	window.parleySettings.hideParleyMessenger();
	setTimeout(() => {
	// Show invite notification so you can directly send a message
		window.parleySettings.showInviteNotification();
	}, 150);

	alert("You have been logged out!");

	document.getElementById("login").disabled = false;
	document.getElementById("logout").disabled = true;
}

function setAdditionalInfo() {
	try {
		const {value} = document.getElementById("userAdditionalInformation");

		const json = JSON.parse(value);
		document.getElementById("userAdditionalInformationError").innerHTML = "";
		document.getElementById("userAdditionalInformationError").classList.add("hidden");

		window.parleySettings.userAdditionalInformation = json;
		fromButtonClick = true; // This will make sure the createChat() deletes all storage items + the chat
		createChat(); // re-create the chat so it re-registers

		document.getElementById("userAdditionalInformationError").innerHTML = "User additional information has been send to the server!";
		document.getElementById("userAdditionalInformationError").style.color = "green";
		document.getElementById("userAdditionalInformationError").classList.remove("hidden");
	} catch (e) {
		document.getElementById("userAdditionalInformationError").innerHTML = e.message;
		document.getElementById("userAdditionalInformationError").style.color = "red";
		document.getElementById("userAdditionalInformationError").classList.remove("hidden");
	}

	return false; // Cancel form's submit
}

function init() {
	let demoSettings = JSON.parse(localStorage.getItem(localStorageKey));
	if(!demoSettings)
		demoSettings = {};

	// Check if we can set the form values from GET params
	const accountId = findGetParameter("accountId") ? findGetParameter("accountId") : demoSettings.accountId;
	document.getElementById("accountId").value = accountId ? accountId : document.getElementById("accountId").value;

	const deviceId = findGetParameter("deviceId") ? findGetParameter("deviceId") : demoSettings.deviceId;
	document.getElementById("deviceId").value = deviceId ? deviceId : document.getElementById("deviceId").value;

	const apiDomain = findGetParameter("apiDomain") ? findGetParameter("apiDomain") : demoSettings.apiDomain;
	document.getElementById("apiDomain").value = apiDomain ? apiDomain : document.getElementById("apiDomain").value;

	const background = findGetParameter("background") ? findGetParameter("background") : demoSettings.background;
	document.getElementById("background").value = background ? background : document.getElementById("background").value;

	if(findGetParameter("start") === "true" || demoSettings) {
		toggleOptions();
		createChat();
	}
}

// Workaround for issue; https://github.com/parcel-bundler/parcel/issues/3954
window.createChat = createChat;
window.toggleOptions = toggleOptions;
window.setAdditionalInfo = setAdditionalInfo;
window.logoutChat = logoutChat;
window.loginChat = loginChat;

init();

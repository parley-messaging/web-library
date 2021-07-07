// Set the name of the hidden property and the change event for visibility
// taken from https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API#example

let hidden;
let visibilityChange;
if(typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
	hidden = "hidden";
	visibilityChange = "visibilitychange";
} else if(typeof document.msHidden !== "undefined") {
	hidden = "msHidden";
	visibilityChange = "msvisibilitychange";
} else if(typeof document.webkitHidden !== "undefined") {
	hidden = "webkitHidden";
	visibilityChange = "webkitvisibilitychange";
}

export default Object.freeze({
	hidden,
	visibilityChange,
});

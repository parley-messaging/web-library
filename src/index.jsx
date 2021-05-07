import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

const axeInspectionTimoutMs = 1000,
	mountNode = document.getElementById("app"),
	name = "John Doe",
	app = <App name={name} />;

// eslint-disable-next-line no-undef
if(process.env.NODE_ENV === "production") {
	ReactDOM.render(app, mountNode);
} else {
	import("@axe-core/react").then((axe) => {
		// noinspection JSUnresolvedFunction
		axe.default(React, ReactDOM, axeInspectionTimoutMs);
		ReactDOM.render(app, mountNode);
	});
}

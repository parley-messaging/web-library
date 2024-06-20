import PropTypes from "prop-types";

export default {
	day: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	filename: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	mimeType: PropTypes.string.isRequired,
	month: PropTypes.string.isRequired,
	year: PropTypes.string.isRequired,
};

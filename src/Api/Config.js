class Config {
	constructor(apiDomain = "https://api.parley.nu") {
		this.apiDomain = apiDomain;
		this.apiUrl = `${apiDomain}/clientApi/v1.6`;
	}
}

export default Config;

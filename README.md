# Develop

## Initial configuration
To help develop this library you will need to set-up you environment. Follow the steps below to get started.

Due to some limitations we require you to install your project on your WSL host (if you are on windows).
You can find more info on how to enable WSL on windows 10 here: https://docs.microsoft.com/en-us/windows/wsl/install-win10

1. Make sure your (wsl) hosts file contains the following
	```
	127.0.0.1   chat-dev.parley.nu
	```
1. Copy chat-dev.parley.nu cert into `ssl/ssl.cert`
1. Copy chat-dev.parley.nu key into `ssl/ssl.key`
1. Set/Install the node version we use ([install nvm](https://github.com/nvm-sh/nvm#install--update-script) first if you do not have it)
	```shell
	nvm use
	nvm install-latest-npm
	```
1. When using PHPStorm as your IDE:
	1. Open settings page
		- `File -> Settings` (or `CTRL+ALT+S`)
	1. Navigate to `Languages & Frameworks` -> `Node.js and NPM`
	1. Make sure your `Node interpreter` and `Package manager` are pointing to the `nvm` version
		(ex `/home/user/.nvm/versions/node/v14.16.1/bin/node`)
		1. Click on the `...` button
		1. Click on the `+` button
		1. Click on `Add WSL` if you are using WSL, `Add local` otherwise
		1. From the `Node.js interpreter` dropdown, choose the one that is inside the `.nvm` fodler
		1. Click `OK` -> `OK` -> `Apply`
	1. Validate that the `Package manager` has also been updated to the `.nvm` path
1. Install dependencies
	```shell
	npm install
	```

## Start library example page
1. Run the npm start-up command
	```
	npm start
	```
 
## Building
When building we transform the code so it works on browsers.
If you want to use the code in a module you'll need to install it using NPM.

**TODO: Explain how to install using NPM**

Our UI and backend code is split into 2 sections:
- `src/ui`
- `src/api`

We have 2 build scripts:
- `npm run build:ui-browser`
- `npm run build:api-browser`

To build all the targets use the following command
```
npm run build
```
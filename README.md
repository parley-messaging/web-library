# Documentation
Moved to https://developers.parley.nu/docs/introduction-2  
(the pages are unlisted at the moment until the official release of version 2)

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
 
## Testing
### Cypress
#### Installation
1. Install the following: https://docs.cypress.io/guides/getting-started/installing-cypress#UbuntuDebian
1. Next install Cypress with NPM: https://docs.cypress.io/guides/getting-started/installing-cypress#npm-install
3. ~~WSL can't (yet) open GUI applications on its own, that's why we need additional setup: https://nickymeuleman.netlify.app/blog/gui-on-wsl2-cypress~~
   This is not necessary anymore due to `npm run cy:open` runs `bin/start_cypress.sh`. This also fixes the problem
   with `DISPLAY` env variable not being set when this `npm` action is run through PhpStorm.
4. (optional) For every browser you want to test you'll need to install it in your WSL environment  
   Here is how to install chrome
   ```bash
   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
   sudo apt -y install ./google-chrome-stable_current_amd64.deb
   rm google-chrome-stable_current_amd64.deb
   ```
5. Give execute access to `/bin/start_cypress.sh`
   ```bash
   chmod +x ./bin/start_cypress.sh
   ```
6. Copy/Paste/Rename `cypress.env.json.example` to `cypress.env.json` and fill in the variables
   - `authorizationHeader`: The authorization header used for tests where the client needs to log in. Can be acquired from https://admin.parley.nu/account/0cce5bfcdbf07978b269/settings/authorization
#### Start
```
npm run cy:open
```

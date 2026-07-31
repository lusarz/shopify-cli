import {themeEnvironmentInfoJSON} from './src/cli/services/info.js'

const environmentInfo = themeEnvironmentInfoJSON({cliVersion: '3.0.0'})

console.log(environmentInfo)

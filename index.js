module.exports = (api, options) => {
  const { info, chalk, execa } = require('@vue/cli-shared-utils')

  api.registerCommand('test:e2e', {
    description: 'run e2e tests with Cypress',
    usage: 'vue-cli-service test:e2e [options]',
    options: {
      '--headless': 'run in headless mode without GUI',
      '--mode': 'specify the mode the dev server should run in. (default: production)',
      '--url': 'run e2e tests against given url instead of auto-starting dev server',
      '-s, --spec': '(headless only) runs a specific spec file. defaults to "all"'
    },
    details:
      `All Cypress CLI options are also supported:\n` +
      chalk.yellow(`https://docs.cypress.io/guides/guides/command-line.html#cypress-run`)
  }, async (args, rawArgs) => {
    removeArg(rawArgs, 'mode')
    removeArg(rawArgs, 'url')
    removeArg(rawArgs, 'config')

    info(`Starting e2e tests...`)

    const { url, server } = args.url
      ? { url: args.url }
      : await api.service.run('serve')

    const configs = typeof args.config === 'string' ? args.config.split(',') : []
    const cyArgs = [
      args.headless ? 'run' : 'open', // open or run
      '--config', [`baseUrl=${url}`, ...configs].join(','),
      ...rawArgs
    ]
    // if(args.headless){
    //   const runOpts={
    //     config:{
    //       baseUrl:url,
    //       spec:args.spec
    //     }
    //   }
    //   const cypress = require('cypress')
    //   return cypress.run(runOpts).then(result => {
    //     if (result.totalFailed) {
    //       console.error('execute totalFailed:',result.totalFailed)
    //     }
    //     process.exit(0)
    //   })
    //     .catch(err => {
    //       console.error(err.message)
    //       process.exit(1)
    //     })
    // }



    const cypressBinPath = require.resolve('cypress/bin/cypress')
    const runner = execa(cypressBinPath, cyArgs, { stdio: 'inherit' })
    if (server) {
      runner.on('exit', () => server.close())
      runner.on('error', () => server.close())
    }
    if (process.env.VUE_CLI_TEST) {
      runner.on('exit', code => {
        process.exit(code)
      })
    }

    runner.then((ret)=>{
      console.log('---------------------',ret)
    })
    return runner
  })
}

module.exports.defaultModes = {
  'test:e2e': 'production'
}

function removeArg (rawArgs, argToRemove, offset = 1) {
  const matchRE = new RegExp(`^--${argToRemove}$`)
  const equalRE = new RegExp(`^--${argToRemove}=`)

  const i = rawArgs.findIndex(arg => matchRE.test(arg) || equalRE.test(arg))
  if (i > -1) {
    rawArgs.splice(i, offset + (equalRE.test(rawArgs[i]) ? 0 : 1))
  }
}

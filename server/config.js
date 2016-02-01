var bunyan = require('bunyan'); // logging
BunyanSlack = require('bunyan-slack'); // log send to slack

// config params 
var Config = {
  appName:          'FLCRM', 
  siteURL:          'http://localhost',
  nodePort:         3500,
  forceHTTPS:       false,
  SSLPassphrase:    'password',
  SSLKeyLocation:   'cert.key',
  SSLCertLocation:  'cert.crt',
  dbURL:            '',
  dbName:           '',
  dbPass:           '',
  adminEmail:       'please@helpme.vodka',
  prerenderToken:   '',
  sessionSecret:    'jL2cwpNgvEv9qVcHwtwzqeX2h9yPS7v5',
  geocodeAPIKey:    '',
  mandrillKey:      ''
}

// Bunyan specific configuration
Config.log = bunyan.createLogger({
  name: Config.appName,
  streams: [
    {
      stream: process.stdout,
      level: "info"
    },
    {
      path: Config.appName + '.log',
      level: "trace"
    }/*,
    {
      stream: new BunyanSlack({
          webhook_url: "",
          channel: "#FLCRM",
          username: "FLCRMLogger",
      }),
      level: "error"
    }*/
  ]
})
module.exports = Config;
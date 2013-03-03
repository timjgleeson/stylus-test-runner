

var Mocha = require('mocha')
var _     = require('lodash')

module.exports = stylusTestRunner



// customConfig:
// describe       <String> Title used by Mocha top-level describe function
// testDirPath    <String> the path where your styl tests are
// stylus         <Object> stylus config
// mocha          <Object> mocha config

function stylusTestRunner(customConfig) {

  var defaultConfig = {
    stylus      : {compress : true},
    testDirPath : './test',
    mocha       : {reporter : 'spec'}
  }

  //  global config will be used by runner
  //  for configing stylus compiler and test description / suite path

  root.config = _.merge({}, defaultConfig, customConfig)

  new Mocha(config.mocha)
  .addFile(__dirname + '/runner')
  .run()
}

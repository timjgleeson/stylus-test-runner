


//  Stylus Test Runner
//  ------------------

var fs       = require('fs')
var cleanCSS = require('clean-css')
var Stylus   = require('stylus')
var glob     = require('glob')
var _        = require('lodash')
var should   = require('should')


//
// UTILS
//

// string utils

function isEmpty(string) {
  return !string.length
}

function isEmptyFile(filePath) {
  return isEmpty(trimNewlines(fs.readFileSync(filePath, 'utf8')))
}

// whitespace mutation utils

function trimNewlines(string) { return string.replace(/^(\s*|\n*)|(\s*|\n*)$/g,'') }


// array utils

function arrayify(it) {
  return _.isArray(it) ? it : [it] ;
}


//
// TESTS
//

function extractTestFromString(string) {
  var assertion = string.match(/.*/)[0]
    , test = string.replace(/.*/,'')
    , stylusAndCss = test.split(/.*@expect.*/).map(trimNewlines)

  var CleanCSS = new cleanCSS()
    , expectedCss = CleanCSS.minify(stylusAndCss[1])

  return {
    assertion : assertion,
    givenStylus : stylusAndCss[0],
    expectedCss : expectedCss
  }
}

function extractTestsFromString(string) {

  //  Filter empty strings out, it seems that the
  //  @it line leaves an empty string entry behind in the array
  var approved = _.reject(string.split(/.*@it\s?/), isEmpty)
  return _.map(approved , extractTestFromString)
}

//
// DESCRIBE
//

function extractDescriptionFromString(string) {
  if ( string.match(/.*/)[0].indexOf('@it') > 0) {
    string = 'no description found \n' + string
  }

  var title = string.match(/.*/)[0]
    , assertions = string.replace(/.*/,'')

  return {
    title: title,
    assertions : assertions
  }
}

function extractDescriptionsFromString(string) {
  approved = _.reject(string.split(/.*@describe\s?/), isEmpty)

  return _.map(approved, extractDescriptionFromString)
}

function getDesciprtionsFromFiles(filePath) {
  var fileContents = trimNewlines(fs.readFileSync(filePath, 'utf8'))
  return extractDescriptionsFromString(fileContents)
}


//
// EACH
//

function forEachFile(config, callback) {

  var path = process.argv[2] || glob.sync(config.testDirPath + '/**/*.styl')
    , testFiles = _.reject(path, isEmptyFile)
    , mapDescriptionsFromFile = _.map(testFiles, getDesciprtionsFromFiles)
    , flatten = _.flatten( mapDescriptionsFromFile )


  _.each( flatten, callback )
}

function forEachAssertion(assertions, config, callback) {
  var mapAssertionFromAssertions = extractTestsFromString( trimNewlines(assertions) )

  var flatten = _.flatten( mapAssertionFromAssertions )

  _.each( flatten, callback )
}



//
// STYLUS
//

// fix stylus
function stylus(string, config) {
  // First through the whole config at stylus, it should ignore stuff it cannot handle
  // like use/import/include etc?

  var thisStylus = new Stylus(string, config)

  // reset paths
  // optimisation
  thisStylus.options.paths = []

  // Enumerate over the config options that the stylus API only makes available by methods
  _.each(['use', 'import', 'include'], function(option){
    if (config[option])  _.each(arrayify(config[option]), thisStylus[option], thisStylus)
  })

  return thisStylus;
}


function renderStylus(stylusCode, config, callback) {
  var CleanCSS = new cleanCSS()

  stylus(stylusCode, config)
    .render(function(err, cssFromStylus) {
      if (err) throw err
      callback(CleanCSS.minify(cssFromStylus))
    })
}




// main runner function
function runner(config) {

  forEachFile(config, function(description) {

    // sets up describe
    describe(description.title, function() {

      forEachAssertion(description.assertions, config, function(test){
        // run through each description
        // get test from @it and @expect
        // add to array
        // pass each array item through the it callback function


        it(test.assertion, function() {
          renderStylus(test.givenStylus, config.stylus, function(actualCss) {
            actualCss.should.equal(test.expectedCss);
          })
        })

      })
    })
  })
}

runner(config)

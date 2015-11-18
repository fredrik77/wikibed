// 1. define the module and the other module dependencies (if any)
angular.module('wikiBed', [])

// 2. set a constant
    .constant('MODULE_VERSION', '0.0.1b')

// 3. maybe set some defaults
    //.value('defaults', {
      //  url: 'http://v-ghost.port0.org:8081/dbfswiki/api.php?action=parse&page=FMP/Middle_Office/Post-trade_Compliance&format=xml'
    //})

// 4. define a module component
    .factory('wikiBedFactory', function( $http, $q, $sce) {
        var wikiBedFactory = {};
        var wikiConnect = [];
        var deferred = $q.defer();
        var returnData = [];
        wikiBedFactory.init = function (options){
            wikiConnect.url = options.url || 'wiki' // Send the url to the wiki, for example 'http://thisismysite/wiki/' if site apicall is on 'http://thisismysite/wiki/api.php'
            wikiConnect.apiurl = options.apiurl || wikiConnect.url+'/api.php' // Stuff back
            wikiConnect.format = options.format || 'json' ; // Please note that changing format from json will force raw=true
            if ( wikiConnect.format != 'json' ) {
                wikiConnect.raw = true;
            } else {
                wikiConnect.raw = options.raw || false; // Set to true and you will get the raw feed from wikipedia back, please note that you get the whole data object back.
            }
            wikiConnect.splitToc = options.splitToc || true; //Split the article by TOC and return under data.byToc
            wikiConnect.stripToc = options.stripToc || true; //Weather or not to remove the TOC reference, normally the heading of that section
            wikiConnect.rewriteUrl = options.rewriteUrl || true; //Rewrite url for images and resources (not internal links though)
            wikiConnect.rewriteRoot = options.rewriteRoot || '/wiki/' //How the actual wiki reefers to its internal files
            wikiConnect.rewriteTarget = options.rewriteTarget || '/wikiproxy/'   // If set, any links for images for example /wiki/images goes to /wikiproxy/images
            wikiConnect.rewriteIntLink = options.rewriteIntLink || true // Rewrite internal links other than resources
            wikiConnect.rewriteIntTarget = options.rewriteIntTarget || '/wiki/article/' // In our example, we have a route in express called wiki. Remember that this route will need to be able to handle wiki calls such as wiki/index.php/FMP/Front_Office/Liquidity_Management
            wikiConnect.rewriteIntRoot = options.rewriteIntRoot || '/wiki/index.php/' //How Wikipedia normally states its internal articles
        }
        wikiBedFactory.getArticle = function( article ){
            //returnData.url = wikiConnect.api + "?action=" + wikiConnect.action + "&page=" + article + "&format=" + wikiConnect.format; // Might come in handy
            // Lets start by retrieving the data from the wikipedia
            $http({
                    url: wikiConnect.apiurl,
                    method: "GET",
                    params: {'action': 'parse', 'format': wikiConnect.format, 'page': article}
                }).then(function (data){
                    if ( data.data.error ) {
                        console.log("Got an unknown error from API when attempting to get:");
                        console.log(wikiConnect.apiurl);
                        console.log("{'action': "+ 'parse' + ", 'format': " + wikiConnect.format + ", 'page': "+  article +"}");
                        deferred.reject(data.data.error);
                        return;
                    }
                    if (wikiConnect.raw) {
                        deferred.resolve(data.data)
                        return;
                    }
                    parse=data.data.parse
                    parse.url=article;
                    var star = "*";
                    parse.http=$sce.trustAsHtml(parse.text[star]);

                    for (var i in parse) {
                        console.log("ID: " + i + " DATA: " + parse[i]);
                    }
                    if (wikiConnect.splitToc) {
                        console.log ("I will split the TOC ");
                        parse.splitToc = [];
                        var tmpStr = parse.text[star].toString();

                        for (var sectionId in parse.sections) {
                            parse.splitToc[sectionId] = [];
                            console.log("Sections ID: " + sectionId + " DATA: " + parse.sections[sectionId]);

                            for (var i in parse.sections[sectionId]){
                                console.log("Sections "+ [sectionId] +" ID: " + i + " DATA: " + parse.sections[sectionId][i]);

                            }
                            var nextsection = parseInt(sectionId) + 1;

                            if (parse.sections[nextsection]['byteoffset']){
                                parse.splitToc[sectionId].text = tmpStr.slice(parse.sections[sectionId]['byteoffset'],parse.sections[nextsection]['byteoffset'])
                                console.log("New Section:");
                                console.log(parse.splitToc[sectionId].text);
                            } else {
                                parse.splitToc[sectionId].text = tmpStr.slice(parse.sections[sectionId]['byteoffset'])
                                console.log("New Section:");
                                console.log(parse.splitToc[sectionId].text);
                            }

                        }
                    }

                    //console.log ("Got some data " + data)
                    deferred.resolve(parse);
                }
            )
            return deferred.promise;


                //.success(function(data){
                  //      return data;
                  //  })
        }

        return wikiBedFactory;
    })

// 5. define another module component
    .directive('directiveName', function() {/* stuff here */})

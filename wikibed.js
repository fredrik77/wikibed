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
        wikiBedFactory.init = function (url){
            wikiConnect.apiurl = url; // Send the api url to the wiki, for example 'http://thisismysite/wiki/api.php'
            wikiConnect.format = 'json';
            wikiConnect.action = 'parse';
        }
        wikiBedFactory.getArticle = function( article ){
            //returnData.url = wikiConnect.api + "?action=" + wikiConnect.action + "&page=" + article + "&format=" + wikiConnect.format; // Might come in handy
            // Lets start by retrieving the data from the wikipedia
            $http({
                    url: wikiConnect.apiurl,
                    method: "GET",
                    params: {'action': wikiConnect.action, 'format': wikiConnect.format, 'page': article}
                }).then(function (data){
                    parse=data.data.parse
                    parse.url=article;
                    var star = "*";
                    parse.http=$sce.trustAsHtml(parse.text[star]);

                    for (var i in parse) {
                        console.log("ID: " + i + " DATA: " + parse[i]);
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
;// and so on

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
            wikiConnect.smartStrip = options.smartStrip || true; //If this is set, the code will try to remove some wiki specific stuff, for example editing tags after headings
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
                        var tmpStr = parse.text[star].toString(); //We will use this block as a temporary storage
                        parse.splitToc = [];  // We will return each sections as a parse.splitToc.[number], with a nummber of structures underneith
                        noSections= parseInt(parse.sections.length) //How many sections fo we have
                        console.log ("Number of sections: " + noSections);
                        for ( var sectionId = 0; sectionId<noSections; sectionId++){
                            parse.splitToc[sectionId] = [];
                            console.log("We created the section: " + sectionId+"\n and this is the data we have");
                            var nameToc = parse.sections[sectionId].line
                            var idToc = parse.sections[sectionId].anchor
                            var endOffset;
                            var startPat = '<span class="mw-headline" id="'+ idToc + '">'+nameToc+'</span>'
                            console.log("We will be looking for " + startPat);
                            var startOffset= tmpStr.search(startPat);
                            console.log("Founnd at pos " + startOffset);
                            var endStartOffset = startOffset + startPat.length;
                            //Lets see if we can catch a <H?> thing before as well
                            var regHtest = new RegExp("<[h,H][1-6]>");
                            console.log(startOffset-4)
                            var Htest = tmpStr.slice(startOffset-4, startOffset);
                            var HendPat = "</span></"+tmpStr.slice(startOffset-3, startOffset); //This should contain the header size
                            console.log("Will cut at " + HendPat);
                            if(startOffset-4){
                                startOffset = startOffset-4;
                                console.log("moving start offset to " + startOffset);

                            }
                            parse.splitToc[sectionId].startOffset = startOffset
                            console.log ("Start set to " +parse.splitToc[sectionId].startOffset )
                            


                            //We now know where the previous section ends, so lest set it
                            if(sectionId == 0 ){
                                console.log("This is the fisrt section")
                            } else {
                                var preSection=sectionId-1 
                                parse.splitToc[preSection].endOffset = startOffset;
                                console.log("Setting previous end for "+ preSection +" to " + parse.splitToc[preSection].endOffset);
                            }

                            //If this is the last one, we remove this part as well
                            if(sectionId+1 == noSections){
                                parse.splitToc[sectionId].endOffset = tmpStr.length;
                                console.log("This is the last section, end sett to " + parse.splitToc[sectionId].endOffset);
                            } 
                            
                            if (wikiConnect.stripToc || wikiConnect.smartStrip ){
                                var tmpCuStr = tmpStr.slice(startOffset, tmpStr.length);
                                var startEndTocOffset = tmpCuStr.search(HendPat);
                                console.log("I am edign at " + startEndTocOffset);
                                var endTocOffset = startEndTocOffset + HendPat.length;
                                console.log("And the Toc ends at" + endTocOffset);
                                if (wikiConnect.stripToc){
                                    console.log("Will strip");
                                    parse.splitToc[sectionId].startOffset = parse.splitToc[sectionId].startOffset+endTocOffset;
                                } else if (wikiConnect.smartStrip) {

                                    
                                }
                            }
                            //We will now identify the full Toc block

                           

                        }
                        for ( var sectionId = 0; sectionId<noSections; sectionId++){
                             parse.splitToc[sectionId].text=tmpStr.slice(parse.splitToc[sectionId].startOffset, parse.splitToc[sectionId].endOffset );
                            console.log("Think the section is: " + parse.splitToc[sectionId].text.length);


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
;// and so on

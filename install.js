/* 

	MedImage Resizing Add-on Installation Script


	Input on the command-line (urlencoded get query params):
	
	height: [pixel number or "auto", where 'auto' matches the aspect ratio of the original and is based off the width]
	width: [pixel number or "auto", where 'auto' matches the aspect ratio of the original and is based off the height]
	quality: [0 - 100 as a percentage quality]
	incomingStringToReplace: [this is the string in the incoming filename to replace e.g. '.jpg']
	newFileRenamed: the new filename has the 'incomingStringToReplace' string replaced to this
													and is created e.g. '-small.jpg']
	prepend: [true|false]  - defaults to false, so it inserts at the end of the event list. true would insert at the beginning
						of the event list. This affects the order of things in the case of the 'photoWritten' event, which
						can be chained together with other image processing tasks.
	firstRun: [true|false]  - from a full install, this should be set to 'true' to enable adding menu elements etc.
								However, we don't want to add those menu elements twice, so the 2nd time we can leave this off.

*/ 

var async = require("async");
var queryString = require('querystring');
var fs = require('fs');
var fsExtra = require('fs-extra');
const cheerio = require('cheerio');
var exec = require('child_process').exec;

var verbose = false;

var thisAddOnConfigFile = __dirname + '/config/patch.json';
var medImageAddonConfig = __dirname + "/../config.json";

var pm2Parent = 'medimage-server';		//Include a string if this is run on linux that represents the MedImage server to restart


//Utility functions
function removeLastInstance(badtext, str) {
    var charpos = str.lastIndexOf(badtext);
    if (charpos<0) return str;
    ptone = str.substring(0,charpos);
    pttwo = str.substring(charpos+(badtext.length));
    return (ptone+pttwo);
}	

function strFunctionInserter(func) {
	var strver = func.toString();
	strver = strver.replace("function () {","");		//Get rid of first function
	strver = removeLastInstance("}", strver);
	return JSON.stringify(strver);
}	


var dateArchived = new Date();
//var dateArchived = "2019-x-y";  //TODO get live date

//Add-on content
var pagesToInsert = [
		{
			"from": __dirname + "/../../bin/server.js",
			"to": __dirname + "/../../bin/archived-server-" + dateArchived.toISOString() + ".js",
			"replace": true
		},
		{
			"from": __dirname + "/server.js",
			"to": __dirname + "/../../bin/server.js",
			"replace": true
		}		
	];
	
	
	

//This function's contents will be placed into the HTML as-is
var jQueryDyn = function() {
	jQuery(document).ready(function(){
		jQuery('#resize-tab').click(function() {
			//Get the current settings HTML snippet via an ajax request

			uri = "/addon/resize-view-settings/";
			jQuery('#resize').html("<img style='margin:8px;' src='../images/ajax-loader.gif' width='28' height='28'>");
			jQuery.ajax({
				url: uri,
				success: function(data) {
					jQuery('#resize').html(data);
				}
			 }); 

		});

	});
}	
	
var htmlToInsert = [		
		
	];
	/* 
		Or a remove example
		{
			"file": __dirname + "/../../public/components/header.html",
			"selector": "#settings",
			"remove": true
		},
	
	*/

var thisAppEventPhotoWritten = [
                       		 	];
var thisAppEventURLRequest = [
                       		 ];
                       		 
var outgoingOptions = {};


function readConfig(confFile, cb) {
	//Reads and updates config with a newdir in the output photos - this will overwrite all other entries there
	//Returns cb(err) where err = null, or a string with the error


	//Write to a json file with the current drive.  This can be removed later manually by user, or added to
	fs.readFile(confFile, function read(err, data) {
		if (err) {
				cb(null, "Sorry, cannot read config file! " + err);
		} else {
			try {
				var content = JSON.parse(data);
				cb(content, null);
			} catch (e) {
				console.log("Error reading json file:" + JSON.stringify(e));
				cb({});		//Use a blank object file instead
			}

			
		};
	});

}


function writeConfig(confFile, content, cb) {
	//Write the file nicely formatted again
	fs.writeFile(confFile, JSON.stringify(content, null, 6), function(err) {
		if(err) {
			console.log("Error writing config file: " + err);
			cb(err);
			
		} else {
		
			console.log("The config file was saved! " + confFile);

		
			cb(null);
		}
	});
}


function inArrayAlready(objCheck, inThisArray) 
{
	//Checks the objCheck is not already in the array - saves us from doubling up. Note - if the status
	//is true vs false, it will still include both options.
	//Returns true if in the array, and false if not.
	var strOfObj = JSON.stringify(objCheck);
	
	for(var cnt = 0; cnt< inThisArray.length; cnt++) {
		if(strOfObj === JSON.stringify(inThisArray[cnt])) {
			return true;
		}
	}
	//Fall through - is not in array
	return false;

}


function addToMedImageServerConfig(configContents, insertObjArray, eventName, prepend)
{
	//In an already loaded config, insert the objects specified in the 'insertObjArray', into the event array called 'eventName'
	// (e.g. 'photoWritten' or 'urlRequest')
	//It will either insert it at the end (prepend = false) or at the beginning (prepend = true).
	//
	//Will return the modified config file, which should then be written to disk again.
	if(!prepend) {
		var prepend = false;		//default to push at the end
	}

	if(!configContents.events) {
		configContents.events = [];
	}
	
	if(!configContents.events[eventName]) {
		configContents.events[eventName] = [];	
	}
	
	if(prepend == true) {
		//Go through the array of objects backwards
		for(var cnt = (insertObjArray.length - 1); cnt >= 0; cnt--) {
			if(! inArrayAlready(insertObjArray[cnt], configContents.events[eventName])) {
				configContents.events[eventName].unshift(insertObjArray[cnt]);	//insert at the start of the chain, but backwards so
			}														//it will keep the same order
		}
	} else {
		//Go through the array of objects forwards
		for(var cnt = 0; cnt< insertObjArray.length; cnt++) {
			if(! inArrayAlready(insertObjArray[cnt], configContents.events[eventName])) {
				configContents.events[eventName].push(insertObjArray[cnt]);	//insert at the end of the chain
			}
		}
	}
	
	return configContents;
}


function restartParentServer(cb, pm2Parent)
{
	//Restart the parent MedImage service
	var platform = process.platform;
	var isWin = /^win/.test(platform);
	if(isWin) {
		var run = 'net stop MedImage';
		if(verbose == true) console.log("Running: " + run);
		exec(run, function(error, stdout, stderr){
			if(error) {
				console.log("Error stopping MedImage:" + error);
				cb();
			
			} else {
				console.log(stdout);
			
				var run = 'net start MedImage';
				exec(run, function(error, stdout, stderr){
					if(error) {
						console.log("Error starting MedImage:" + error);
						cb();
					} else {
						console.log(stdout);
						cb();
					}
				});
			}
		});
	} else {
	   //Probably linux
	   if((pm2Parent) && (pm2Parent != '')) {
		   var run = 'pm2 restart ' + pm2Parent;
			console.log("Trying to restart the MedImage Server with the command: " + run);
			exec(run, function(error, stdout, stderr){
				
				console.log("Output from command: " + stdout);
				
				cb();
			});
		} else {
			console.log("Sorry, we don't know how to restart the MedImage Server: " + run);
			cb();
		}
	}

}


function changeLocalConfig(configContents, opts)
{
	/* A typical local add-on config file:
		 {
			"incomingStringToReplace": ".jpg",
			"currentFileRenamed": null,
			"newFileRenamed": "-small.jpg",
			"width": 1200,
			"height": "auto",
			"quality": 90
		}
		*/
	//Put in some defaults if the object doesn't exist, but otherwise use the new data
	
	if(!configContents.incomingStringToReplace) {
		configContents.incomingStringToReplace = ".jpg";
	}
	if(opts.incomingStringToReplace) {
		configContents.incomingStringToReplace = opts.incomingStringToReplace;
	}
	
	if(!configContents.newFileRenamed) {
		configContents.newFileRenamed = "-small.jpg";
	}
	if(opts.newFileRenamed) {
		configContents.newFileRenamed = opts.newFileRenamed;
	}
	
	if(!configContents.width) {
		configContents.width = 1200;
	}
	if(opts.width) {
		if(opts.width == "auto") {
			configContents.width = opts.width;
		} else {
			configContents.width = parseInt(opts.width);
		}
	}
	
	if(!configContents.height) {
		configContents.height = "auto";
	}
	if(opts.height) {
		if(opts.height == "auto") {
			configContents.height = opts.height;
		} else {
			configContents.height = parseInt(opts.height);
		}
	}
	
	if(!configContents.quality) {
		configContents.quality = 90;
	}
	if(opts.quality) {
		configContents.quality = parseInt(opts.quality);
	}

	return configContents;
}






//Read in the command-line params
if(process.argv[2]) {

	//Incoming get requests are in normal "var=value&var2=value" format urlencoded
	var opts = queryString.parse(decodeURIComponent(process.argv[2]));
	
	if(process.argv[2] == 'first') {
		//Shortcut for command line users rather than having to enter firstRun%3Dtrue
		opts.firstRun = "true";
	}
	
	//Read in the local app's config file

	async.waterfall([
		function(callback) {
			//Read the local add-on's config
			readConfig(thisAddOnConfigFile, function(childConfigContents, err) {
				if(!childConfigContents) {
					var childConfigContents = {};
				}
				
				if(err) {
					//OK check if the file even exists - if it doesn't continue on to create one
					fs.lstat( thisAddOnConfigFile, function (staterr, inodeStatus) {
						  if (staterr) {

							// file does not exist-
							if (staterr.code === 'ENOENT' ) {
							  console.log("Error loading the add-on's own config file. Will try creating one:" + err); 
							  
							  //Add in the data
							  childConfigContents = changeLocalConfig(childConfigContents, opts);
							  callback(null, childConfigContents);		//So continue
							  
							} else {

								// miscellaneous error (e.g. permissions)
								console.log("Error loading the add-on's own config file:" + err); 
								callback(staterr, null);
							}
						  } else {
						  	//All good with the file, so we don't want to overwrite it. Stop here.
						  	console.log("Error loading the add-on's own config file:" + err); 
							callback(err, null);
						  
						  }
					});

						
					
				} else {
					
				
					//Modify the addon config for the master server
					childConfigContents = changeLocalConfig(childConfigContents, opts);
				
					callback(null, childConfigContents);				
				}
				
			});
		},
		function(childConfigContents, callback) {
			//Write back the add-on's config file
			outgoingOptions = childConfigContents;		//Get a global backup for when we exit this script
			
			
			writeConfig(thisAddOnConfigFile, childConfigContents, function(err) {
				if(err) {
					console.log("Error saving the add-on config file:" + err);
					callback(err); 
		
				} else {
					//Success
					callback(null);
				}			
			});
		},
		function(callback) {
			//Read the medImage AddonConfig
			readConfig(medImageAddonConfig, function(parentConfigContents, err) {
				if(err) {
				
					//OK check if the file even exists - if it doesn't continue on to create one
					fs.lstat( medImageAddonConfig, function (staterr, inodeStatus) {
						  if (staterr) {

							// file does not exist-
							if (staterr.code === 'ENOENT' ) {
							  console.log("Error loading the master add-on config file. Will try creating one:" + staterr); 
							  
							  var parentConfigContents = {
								"events": {
									"photoWritten": [
									],
									"urlRequest": [
									]
								}
							  };
							  
							  
							  //Add in the data
							  parentConfigContents = addToMedImageServerConfig(parentConfigContents, thisAppEventPhotoWritten, "photoWritten", prepend);
							  parentConfigContents = addToMedImageServerConfig(parentConfigContents, thisAppEventURLRequest, "urlRequest", prepend);
							  
							  callback(null, parentConfigContents);		//So continue
							  
							} else {

								// miscellaneous error (e.g. permissions)
								console.log("Error loading the master add-on config file:" + err); 
								callback(staterr, null);
							}
						  } else {
						  	//All good with the file, so we don't want to overwrite it. Stop here.
						  	console.log("Error loading the master add-on config file:" + err); 
							callback(err, null);
						  
						  }
					});
				
				
				} else {
					if((opts.prepend)&&(opts.prepend === "true")) {
						var prepend = true;
					} else {
						var prepend = false;
					}
		
					//Modify the addon config for the master server
					parentConfigContents = addToMedImageServerConfig(parentConfigContents, thisAppEventPhotoWritten, "photoWritten", prepend);
					parentConfigContents = addToMedImageServerConfig(parentConfigContents, thisAppEventURLRequest, "urlRequest", prepend);
							  
					callback(null, parentConfigContents);				
				}
				
			});
			
		},
		function(parentConfigContents, callback) {
			writeConfig(medImageAddonConfig, parentConfigContents, function(err) {
				if(err) {
					console.log("Error saving the add-on config file:" + err);
					callback(err); 
		
				} else {
					//Success
					callback(null);
				}			
			});
		},
		function(callback) {
			//Copy across any pages that need inserting
			if(opts.firstRun === "true") {
				//But only do this on the first run
			
				async.eachOf(pagesToInsert,
						// 2nd param is the function that each item is passed to
						function(pageIns, cnt, cb){
							fsExtra.copy(pageIns.from, pageIns.to, { "overwrite": pageIns.replace }, function(err) {
								if(err) {
									cb(err);
								} else {
									cb(null);
								}
							});
						},	//End of async eachOf single item
						function(err){
							// All tasks are done now
							if(err) {
							   console.log('ERR:' + err);
							   callback(err);
							 } else {
							   console.log('Completed all page insertion!');
							   callback(null);
							 }
						   }
					); //End of async eachOf all items
			} else {
				callback(null);
				
			}
		},
		function(callback) {
			//And add any menus or any other html pages that need to be adjusted
			if(opts.firstRun === "true") {
				//We only want to do this on the first run from a full install
			
				
				async.eachOf(htmlToInsert,
					// 2nd param is the function that each item is passed to
					function(htmlIns, cnt, cb){
						
				
						var htmlSource = fs.readFileSync(htmlIns.file, "utf8");
				
						const $ = cheerio.load(htmlSource);
				
					
						if(htmlToInsert[cnt].append) {
							console.log("Check exists id: " + htmlIns.newId);
							var exists = $("#" + htmlIns.newId).length;
							if(!exists) {
								//Only insert if not already there
								console.log("Doesn't exist");
								$(htmlIns.selector).append(htmlIns.append);
							} else { 
								console.log("Already exists");
							}
						}
				
						if(htmlIns.remove) {
							$(htmlIns.selector).remove();
						}

						if(verbose == true) console.log("New HTML:" + $.html());
						fs.writeFileSync(htmlIns.file, $.html());
						cb(null);
					
					},	//End of async eachOf single item
					  function(err){
						// All tasks are done now
						if(err) {
						   console.log('ERR:' + err);
						   callback(err);
						 } else {
						   console.log('Completed all code insertion!');
						 }
					   }
				); //End of async eachOf all items
											
				
				
				
				
			} else {	//Not the first run
				callback(null);
			}
		}
		
	], function (err, result) {
		// result now equals 'done'
		if(err) {
			console.log("The installation was not complete.");
			process.exit(1);
		} else {
			
		  	
		   // Restart the server independently.
		   restartParentServer(function(){ 
		   			console.log("The installation was completed successfully! The MedImage Server was modified and restarted.");
					process.exit(0);
		   }, pm2Parent);
			
			//But if the server doesn't restart, exit the process and suggest a restart of the server to the user manually
			setTimeout(function() {
				console.log("The installation was completed, but we couldn't restart the MedImage Server. On Windows, please restart the 'MedImage' service in Windows Services. On linux/Mac please enter 'pm2 restart medimage-server' on a terminal line.");
				process.exit(0);
			
			}, 15000);		//Wait 15 seconds until report to the user	
		}
	});

			


} else { 
	console.log("Usage: node install.js first\n\n");
}
	



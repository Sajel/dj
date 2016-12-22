var Promise = require('bluebird');
var csvtojson = require("csvtojson").Converter;
var xlsxtojson = require("./wdc-xlsx2json");
var fs = require('fs');
var xmltojson = require('xml2js');
var iconv = require('iconv-lite');
var request = require("request");
var logger = require("./wdc-log").global;

// Supported encodings
// All node.js native encodings: utf8, ucs2 / utf16-le, ascii, binary, base64, hex.
// Additional unicode encodings: utf16, utf16-be, utf-7, utf-7-imap.
// All widespread singlebyte encodings: Windows 125x family, ISO-8859 family, IBM/DOS codepages, Macintosh family, KOI8 family, all others supported by iconv library. Aliases like 'latin1', 'us-ascii' also supported.
// All widespread multibyte encodings: CP932, CP936, CP949, CP950, GB2313, GBK, GB18030, Big5, Shift_JIS, EUC-JP.



var fileFormatter = {

	csv : function(filename,options,encoding){
		var converter = new csvtojson(options);
		var transform = function(resolve){
			encoding = encoding || "utf8";
			logger.debug("Read "+ filename)
			fs.readFile(filename,  function(err, data ) {
				if(err) logger.error("CSV READER ERROR: " + err)
				data = iconv.decode(new Buffer(data), encoding);
				converter.fromString(data,function(err,result){
					if(err) logger.error("CSV CONVERTER ERROR: "+ err)
					resolve(result)
				});	
			});
			
		}
		return new Promise(function(resolve){
	        transform(resolve);
	    }); 
	},

	xlsx: function(filename,options,encoding){
		var transform = function(resolve){
			var workbook = xlsxtojson.convert(xlsxtojson.parseFile(filename));
			resolve(workbook)
		}
		return new Promise(function(resolve){
	        transform(resolve);
	    });
	},

	xml: function(filename,options,encoding){
		var transform = function(resolve){
			var parser = new xmltojson.Parser();
			fs.readFile(filename, function(err, data) {
			    parser.parseString(data, function (err, result) {
			    	resolve(result)
			    });
			});
		}
		return new Promise(function(resolve){
	        transform(resolve);
	    });
	},

	json: function(filename,options,encoding){
		var transform = function(resolve){
			
			fs.readFile(filename, function(err, data) {
			    var result = JSON.parse(data);
			    resolve(result)
			});
		}
		return new Promise(function(resolve){
	        transform(resolve);
	    });
	}
}


var requestFormatter = {

	csv : function(url,options,encoding){
		var converter = new csvtojson(options);
		var transform = function(resolve){
			encoding = encoding || "utf8";
			request(url, function (error, response, body) {	
				data = iconv.decode(new Buffer(body), encoding);
				converter.fromString(data,function(err,result){
					resolve(result)
				});	
			});
			
		}
		return new Promise(function(resolve){
	        transform(resolve);
	    }); 
	},

	// xlsx: function(filename,options,encoding){
	// 	var transform = function(resolve){
	// 		var workbook = xlsxtojson.convert(xlsxtojson.parseFile(filename));
	// 		resolve(workbook)
	// 	}
	// 	return new Promise(function(resolve){
	//         transform(resolve);
	//     });
	// },

	xml: function(url,options,encoding){
		var transform = function(resolve){
			var parser = new xmltojson.Parser();
			request(url, function (error, response, body) {
				parser.parseString(body, function (err, result) {
			    	resolve(result)
			    });
			});
		}
		return new Promise(function(resolve){
	        transform(resolve);
	    });
	},

	json: function(url,options,encoding){
		var transform = function(resolve){
			request(url, function (error, response, body) {
			  console.log(error)
			  console.log(response.statusCode);
			  if (!error && response.statusCode == 200) {
			  	console.log(response);
			    console.log(body); 
			    var result = JSON.parse(body);
			    resolve(result)
			  }
			})
			
		}
		return new Promise(function(resolve){
	        transform(resolve);
	    });
	}
}



var Parser = function(options){
	this._data = undefined;
	this.options = options;

	if(this.options.filename){
		this._reader = fileFormatter[options.reader.type]
			//(options.filename,options.reader.options,options.reader.encoding);
		return
	}
	
	if(this.options.url){
		this._downloader = requestFormatter[options.reader.type]
		//(options.url,options.reader.options,options.reader.encoding);
		return
	}

} 

Parser.prototype = {
	execute: function(cb, args){
		var thos = this;
		var _execute = function(resolve){
			if(thos._data) {
				resolve(cb(thos._data, args))
				return;
			}	

			if(!thos.loadPromise && thos._reader){
				thos.loadPromise = thos._reader(thos.options.filename,
												thos.options.reader.options,
												thos.options.reader.encoding);
			}
			if(!thos.loadPromise && thos._downloader){
				thos.loadPromise = thos._downloader(
													thos.options.url,
													thos.options.reader.options,
													thos.options.reader.encoding);
			}

			thos.loadPromise.then(function(data){
				thos.src = data;
				thos.loadPromise = undefined;
				resolve(cb(thos.src, args))
			})
			
		}
		return new Promise(function(resolve){ _execute(resolve)})
	},

	validate: function(){
		if(this.options.validate) return this.execute(this.options.validate, arguments);
	},

	metadata: function(){
		if(this.options.metadata) return this.execute(this.options.metadata, arguments);
	},

	data: function(){
		if(this.options.data) return this.execute(this.options.data, arguments);
	},

	dictionary: function(){
		if(this.options.dictionary) return this.execute(this.options.dictionary,arguments);
	},

	i18n: function(){
		if(this.options.i18n) return this.execute(this.options.i18n, arguments);
	},
}

module.exports = Parser;
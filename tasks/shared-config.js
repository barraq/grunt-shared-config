/*
 * grunt-shared-config
 *
 * Use this task to create multiple config files for JS/JS-AMD, SCSS/SASS/LESS/stylus from one JSON/YAML.
 *
 * Copyright (c) 2013 Mathias Paumgarten
 * Licensed under the MIT license.
 */

"use strict";

var mout = require( "mout" );

module.exports = function( grunt ) {

	grunt.registerMultiTask( "shared_config", "Your task description goes here.", function() {

		// ===========
		// -- UTILS --
		// ===========

		function normalizeOutArray( value ) {
			return typeof value === "string" ? [ value ] : value;
		}

		function normalizeFormat( value ) {
			return mout.array.contains( varFormats, value ) ? value : varFormats[ 0 ];
		}

		function normalizeMask( mask ) {
			if ( mask == null ) return null;

			if ( mout.lang.isString( mask ) && fileExists( mask ) ) return readFile( mask );
			else if ( mout.lang.isObject( mask ) ) return mask;
			else if ( mout.lang.isArray ( mask ) ) {

				return mask.reduce( function( previous, current ) {
					return mout.object.deepMixIn( previous, normalizeMask( current ) );
				}, {} );

			}

			return {};
		}

		function format( value, type ) {
			value = value.replace( /-/g, " " );

			switch ( type ) {
				case "underscore":
					return mout.string.underscore( value );
				case "uppercase":
					return value.toUpperCase().replace( / /g, "_" );
				case "dash":
					return mout.string.hyphenate( value );
				default:
					return mout.string.camelCase( value );
			}
		}

		function fileExists( filePath ) {
			if ( !grunt.file.exists( filePath ) ) {
				grunt.log.warn( "Source file (" + filePath + ") not found." );
				return false;
			}
			return true;
		}

		function readFile( filePath ) {
			var fileType = filePath.split( "." ).pop().toLowerCase();

			return ( ( fileType === "yml" || fileType === "yaml" ) ? grunt.file.readYAML : grunt.file.readJSON )( filePath );
		}

		function isStringNumber( value ) {
			var units = [ "em", "px", "s", "in", "mm", "cm", "pt", "pc", "%" ];

			return units.reduce( function( previous, current ) {
				return previous || mout.string.endsWith( value, current );
			}, false );
		}

		function isCSSExpression( value ) {
			var exprs = [ /^[A-Za-z_\-]+\(.*\)$/ ];

			return exprs.reduce( function( previous, current ) {
				return previous || ( new RegExp(current) ).test( value );
			}, false );
		}

		function isCSSColor ( value ) {
			var colors = ['blueviolet', 'darkslateblue', 'brown', 'violet', 'darkseagreen', 'wheat', 'lightpink',
				'darkcyan', 'cornsilk', 'yellowgreen', 'lightblue', 'rosybrown', 'limegreen', 'darkgrey', 'lightyellow',
				'greenyellow', 'lightsalmon', 'thistle', 'burlywood', 'blue', 'honeydew', 'maroon', 'lightgreen',
				'royalblue', 'lightsteelblue', 'palegreen', 'forestgreen', 'deepskyblue', 'mediumvioletred',
				'lightcoral', 'white', 'gray', 'firebrick', 'magenta', 'olive', 'tomato', 'cyan', 'indianred',
				'lightgoldenrodyellow', 'khaki', 'yellow', 'antiquewhite', 'seagreen', 'mediumorchid', 'gainsboro',
				'lightslategrey', 'plum', 'darkolivegreen', 'teal', 'moccasin', 'lemonchiffon', 'oldlace', 'cadetblue',
				'slategrey', 'aquamarine', 'blanchedalmond', 'orangered', 'cornflowerblue', 'darkorange', 'orange',
				'darkgreen', 'saddlebrown', 'indigo', 'pink', 'dimgray', 'black', 'whitesmoke', 'snow', 'mediumpurple',
				'fuchsia', 'turquoise', 'midnightblue', 'lightseagreen', 'green', 'purple', 'seashell', 'olivedrab',
				'paleturquoise', 'orchid', 'bisque', 'dimgrey', 'mediumaquamarine', 'peachpuff', 'gold',
				'lightslategray', 'darkred', 'mistyrose', 'goldenrod', 'navajowhite', 'ivory', 'salmon', 'steelblue',
				'red', 'azure', 'navy', 'lightcyan', 'hotpink', 'mediumspringgreen', 'coral', 'mediumblue',
				'darkkhaki', 'skyblue', 'mintcream', 'lime', 'floralwhite', 'ghostwhite', 'rebeccapurple', 'lavender',
				'darkmagenta', 'darksalmon', 'lightgrey', 'chocolate', 'powderblue', 'tan', 'darkslategrey',
				'darkorchid', 'slategray', 'aliceblue', 'crimson', 'darkslategray', 'lightskyblue', 'springgreen',
				'darkviolet', 'deeppink', 'beige', 'lawngreen', 'slateblue', 'mediumturquoise', 'sandybrown',
				'mediumslateblue', 'chartreuse', 'palegoldenrod', 'aqua', 'dodgerblue', 'silver', 'linen', 'sienna',
				'lavenderblush', 'grey', 'darkturquoise', 'lightgray', 'darkgray', 'mediumseagreen', 'papayawhip',
				'darkblue', 'peru', 'darkgoldenrod', 'palevioletred', 'transparent'];

			return colors.reduce( function( previous, current ) {
				return previous || mout.string.lowerCase( value ) === current;
			});
		}

		function getStyleSafeValue( value ) {
			if ( value !== null && !isStringNumber( value ) && !isCSSExpression( value ) && !isCSSColor( value ) && value[ 0 ] !== "#" && typeof value !== "boolean" ) {
				value = "\"" + value + "\"";
			}
			return value;
		}


		// ==============
		// -- SETTINGS --
		// ==============

		// default options
		var options = this.options( {
			amd: false,
			jsFormat: "uppercase",
			cssFormat: "dash",
			name: "config",
			useSassMaps: false,
			indention: "\t",
			mask: undefined,
			maskAllowUnknownLevels: 0
		} );

		// possible variable formats
		var varFormats = [ "underscore", "uppercase", "dash", "camelcase" ];

		// available file extensions
		var fileExtensions = {
			js: [ "js" ],
			css: [ "scss", "sass", "less", "styl" ]
		};


		// variable patterns
		var outputPattern = {
			scss:     "${{key}}: {{value}};\n",
			sass:     "${{key}}: {{value}}\n",
			less:     "@{{key}}: {{value}};\n",
			sassmaps: "{{key}}: {{value}},",
			styl:     "{{key}} = {{value}}\n",
			amd:      "define( function() {\n\n" + options.indention + "return {{{vars}}" + options.indention + "}\n\n} );\n",
			js:       "var {{name}} = {{vars}};\n"
		};

		// Normalize user input
		options.dest = normalizeOutArray( options.dest );
		options.jsFormat = normalizeFormat( options.jsFormat );
		options.cssFormat = normalizeFormat( options.cssFormat );


		// ================
		// -- GENERATORS --
		// ================

		// Generate Style files
		function generateStyle( data, type ) {
			var content = "";
			var pattern = outputPattern[ type ];

			function resolveNested( data, parentKey ) {
				var name, key;
				for ( key in data ) {
					name = parentKey ? format( parentKey + "-" + key, options.cssFormat ) : format( key, options.cssFormat );

					if ( mout.lang.isObject( data[ key ] ) ) {

						resolveNested( data[ key ], name );

					} else {

						var value = getStyleSafeValue( data[ key ] );

						content += pattern.replace( "{{key}}", name ).replace( "{{value}}", value );
					}
				}
			}

			resolveNested( data );

			return content;
		}


		// Generate JavaScript files
		function generateJS( data, type ) {
			var preparedData = prepareValues( data );
			var content = JSON.stringify( preparedData, null, options.indention );

			return outputPattern.js.replace( "{{name}}", options.name ).replace( "{{vars}}", content );
		}

		function generateAMD( data ) {
			var preparedData = prepareValues( data );
			var content = JSON.stringify( preparedData, null, options.indention );
			var pattern = mout.lang.deepClone( outputPattern.amd );

			content = content.substr( 1, content.length - 2 );
			content = indent( content, options.indention );

			return pattern.replace( "{{vars}}", content );
		}

		function generateSassMaps( data ) {
			var pattern = outputPattern.sassmaps;

			function generateSassMapsRecursive( data ) {
				var key;
				var currentItem = "";
				var first = true;
				var sassMapStr;
				var currentValue;

				for ( key in data ) {

					if ( mout.lang.isObject( data[ key ] ) ) {
						currentValue = generateSassMapsRecursive( data[ key ] );
					} else {
						currentValue = getStyleSafeValue( data[ key ] );
					}

					currentItem = pattern.replace( "{{key}}", key ).replace( "{{value}}", currentValue );

					if ( first ) {
						sassMapStr = indent("\n" + currentItem, options.indention);
						first = false;
					} else {
						sassMapStr = sassMapStr + indent("\n" + currentItem, options.indention);
					}

					sassMapStr = sassMapStr.replace( ",\n" + options.indention + ")", "\n" + options.indention + ")" );
				}

				// the slice removes the last comma
				return "(" + sassMapStr.slice( 0, -1 ) + "\n)";
			}

			return "$" + options.name + ": " + generateSassMapsRecursive( data ).replace( /,\)/g , ")" ) + ";";

		}

		function prepareValues( data ) {
			var newData = {};

			function updateValues( object, newData ) {
				for ( var key in object ) {
					var value = object[ key ];

					if ( mout.lang.isObject( value ) ) {

						var newKey = format( key, options.jsFormat );

						newData[ newKey ] = {};
						updateValues( value, newData[ newKey ] );

						continue;

					} else if ( mout.string.endsWith( value, "%" ) ) {

						value = parseInt( value, 10 ) / 100;

					} else if ( isStringNumber( value ) ) {

						value = parseInt( value, 10 );

					}

					newData[ format( key, options.jsFormat ) ] = value;
				}
			}

			updateValues( data, newData );

			return newData;
		}

		function indent( content, indention ) {
			content = content.replace( /\n/g, "\n" + indention );

			while ( mout.string.endsWith( content, options.indention ) ) {
				content = content.substr( 0, content.length - 1 );
			}

			return content;
		}

		function getLevelsFromObject( src, numberOfLevels ) {
			var result = {};

			if ( numberOfLevels === 0 ) return result;

			if ( typeof src !== "object" ) return src;


			for ( var key in src ) {

				if ( numberOfLevels === 1 ) {

					// only add it to result if it's not an object
					// we don't want empty objects in the result
					if ( typeof src[ key ] !== "object" ) {

						result[ key ] = src[ key ];

					}

				} else {

					result[ key ] = getLevelsFromObject( src[ key ], numberOfLevels - 1 );

				}
			}

			return result;
		}

		function maskObject( src, mask, allowLevel, round ) {
			var result = {};

			// check for every key in src, if it should end up in the result
			for ( var key in src ) {

				// if this property is in the mask too, check that
				if ( mask.hasOwnProperty( key ) ) {

					// if this mask is an object, send it through maskObject again
					if ( typeof mask[ key ] === "object" ) {

						// we allow to include unknown objects only on the root level
						// on every other level, you can just use "true"
						result[ key ] = maskObject( src[ key ], mask[ key ], allowLevel, round + 1 );

					} else {

						// true, include everything in result
						if ( mask[ key ] === true ) {

							result[ key ] = src[ key ];

						} else {

							// if the mask value starts with 'allowLevel-' we get the number after '-' and allow as many levels
							if ( typeof mask[ key ] === "string" && mask[ key ].split( "-" )[ 0 ] === "allowLevel" ) {

								var numberOfLevels = parseInt( mask[ key ].split( "-" )[ 1 ], 10 );

								if ( isNaN( numberOfLevels ) ) {

									grunt.log.error( "invalid mask value: " + mask[ key ] );

								} else {

									result[ key ] = getLevelsFromObject( src[ key ], numberOfLevels );

								}

							} else if ( mask[ key ] !== false ) {

								grunt.log.error( "invalid mask value: " + mask[ key ] );

							}
						}
					}
				// otherwise we only include it, if other first level object should end up in the result
				} else if ( allowLevel > round ) {

					result[ key ] = src[ key ];

				}
			}

			return result;
		}


		// ===================
		// -- SHARED CONFIG --
		// ===================

		this.files.forEach( function( file ) {

			var srcConfig = {};
			var destinationFiles = normalizeOutArray( file.dest );
			var mask = normalizeMask( options.mask );

			file.src.filter( fileExists ).forEach( function( filePath ) {

				mout.object.deepMixIn( srcConfig, readFile( filePath ) );

			} );

			if ( mask !== null ) {

				srcConfig = maskObject( srcConfig, mask, options.maskAllowUnknownLevels, 0 );

			}

			if ( Object.keys( srcConfig ).length === 0 ) {
				grunt.log.warn( "Empty src results in no output" );
				return false;
			}

			destinationFiles.map( function( filePath ) {

				var fileType = filePath.split( "." ).pop().toLowerCase();
				var output, generator;

				if ( fileType === "scss" && options.useSassMaps ) {

					generator = generateSassMaps;

				} else if ( mout.array.contains( fileExtensions.css, fileType ) ) {

					generator = generateStyle;

				} else if ( mout.array.contains( fileExtensions.js, fileType ) ) {

					generator = options.amd ? generateAMD : generateJS;

				} else {
					grunt.log.warn( "Unknown filetype (" + fileType + ")." );
					return false;
				}

				output = generator.apply( null, [ srcConfig, fileType ] );
				grunt.file.write( filePath, output );

				grunt.log.ok( "File: " + filePath + " created." );
			} );

		} );

	} );

};

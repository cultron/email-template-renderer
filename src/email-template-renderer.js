var fs = require('fs'),
	path = require('path'),
	juice = require('juice2'),
	async = require('async'),
    extMap = {
        jade: {
            ext: 'jade',
            regex: /\.jade$/,
            compile: function(contents, filePath) {
                var options = {
                    pretty: true,
                    compileDebug: true,
                    filename: filePath
                };

                return require('jade').compile(contents, options);
            }
        },
        ejs: {
            ext: 'ejs',
            regex: /\.ejs$/,
            compile: function(contents, filePath) {
	            var options = {
		            pretty: true,
		            compileDebug: true,
		            filename: filePath
	            };

                return require('ejs').compile(contents, options);
            }
        },
        html: {
            ext: 'html',
            regex: /\.html$/,
            compile: function(contents, filePath) {
                return function(locals) {
                    return contents;
                };
            }
        }
    };

function EmailTemplateRenderer(templatesDir, type) {
    if (!templatesDir) {
        throw new Error('A template directory is required');
    }
    if (typeof(type) === 'string') {
        this.type = extMap[type];
    } else if (!type) {
        this.type = extMap.html;
    } else {
        this.type = type;
    }

	this.templatesDir = templatesDir || null;
	this.templates = {};
	this.initialized = false;
}

EmailTemplateRenderer.prototype.init = function(callback) {
	if (this.initialized) {
		callback();
		return;
	}

	var self = this;

	function getDirectories(next) {
		fs.readdir(self.templatesDir, next);
	}

	function compileTemplates(dirs, next) {
		function compileTemplate(name, next) {
			var dirPath = path.join(self.templatesDir, name);

			fs.readdir(dirPath, function(err, files) {
				if (err) {
					next(err);
					return;
				}

                var typeData = self.type;

				function processFile(file, next) {
					if (!typeData.regex.test(file)) {
						next();
						return;
					}

					var contentType = path.basename(file, '.' + typeData.ext),
						filePath = path.join(dirPath, file);

					var options = {
						encoding: 'utf8'
					};
					fs.readFile(filePath, options, function(err, contents) {
						if (err) {
							next(err);
							return;
						}

						if (!self.templates[name]) {
							self.templates[name] = [];
						}

                        try {
                            self.templates[name].push({
                                path: filePath,
                                tmpl: typeData.compile(contents, filePath),
                                type: contentType
                            });

                            next();
                        } catch (e) {
                            next(e);
                        }
					});
				}

				async.each(files, processFile, next);
			});
		}

		function isValidDirectory(name, next) {
			var dirPath = path.join(self.templatesDir, name);
			fs.stat(dirPath, function(err, stat) {
				if (err) {
					next(false);
					return;
				}

				next(stat.isDirectory() && name.charAt(0) !== '.');
			});
		}

		async.filter(dirs, isValidDirectory, function(results) {
			async.eachSeries(results, compileTemplate, function(err) {
				self.initialized = true;
				next(err);
			});
		});
	}

	async.waterfall([ getDirectories, compileTemplates ], callback);
};

EmailTemplateRenderer.prototype.render = function(template, locals, callback) {
	var self = this;
	this.init(function(err) {
		if (err) {
			callback(err);
			return;
		}

		var templateData = self.templates[template];
		if (!templateData) {
			callback(new Error('Unknown template: ' + template));
			return;
		}

		var result = {};

		function render(data, next) {
			var html = data.tmpl(locals);
			if (data.type === 'text') {
				result[data.type] = html;
				next();
				return;
			}

			var options = {
				url: 'file://' + data.path
			};

			juice.juiceContent(html, options, function(err, html) {
				result[data.type] = html;
				next(err);
			});
		}

		async.each(templateData, render, function(err) {
			callback(err, result);
		});
	});
};

module.exports = EmailTemplateRenderer;

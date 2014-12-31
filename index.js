var fs = require('fs'),
	path = require('path'),
	juice = require('juice2'),
	async = require('async');

function EmailTemplateRenderer(templatesDir) {
	if (!templatesDir) {
		throw new Error('A template directory is required');
	}

	this.templatesDir = templatesDir;
	this.templates = {};
	this.initialized = false;

	this.typeMap = {};

	this
		.registerType('jade', /\.jade$/, true, function(contents, filePath) {
			var options = {
				pretty: true,
				compileDebug: true,
				filename: filePath
			};

			return require('jade').compile(contents, options);
		})
		.registerType('ejs', /\.ejs$/, true, function(contents, filePath) {
			var options = {
				pretty: true,
				compileDebug: true,
				filename: filePath
			};

			return require('ejs').compile(contents, options);
		})
		.registerType('nunjucks', /\.html$/, true, function(contents, filePath) {
			var nunjucks = require('nunjucks'),
				basePath = path.dirname(filePath);

			var LocalPathLoader = nunjucks.Loader.extend({
				getSource: function(name) {
					var fileName = path.resolve(path.join(basePath, name));
					var contents = fs.readFileSync(fileName, { encoding: 'utf8' });
					return {
						src: contents,
						path: fileName
					};
				}
			});

			var env = new nunjucks.Environment(new LocalPathLoader());
			var tmpl = require('nunjucks').compile(contents, env, filePath);
			return function(locals) {
				return tmpl.render(locals);
			};
		})
		.registerType('txt', /\.txt$/, false, function(contents) {
			return function() {
				return contents;
			};
		});
}

EmailTemplateRenderer.prototype.registerType = function(name, regex, isJuicy, compile) {
	this.typeMap[name] = {
		juicy: !!isJuicy,
		compile: compile,
		regex: regex
	};

	return this;
};

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

				function processFile(file, next) {
					var typeDataKey = Object.keys(self.typeMap)
						.filter(function(name) {
							return self.typeMap[name].regex.test(file);
						})[0];

					if (!typeDataKey) {
						next();
						return;
					}

					var typeData = self.typeMap[typeDataKey],
						templateName = path.basename(file, path.extname(file)),
						filePath = path.join(dirPath, file),
						options = {
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
								name: templateName,
								juicy: !!typeData.juicy
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
			var key = data.name;
			try {
				var content = data.tmpl(locals);
			} catch (e) {
				next(e);
				return;
			}

			if (!data.juicy) {
				result[key] = content;
				next();
				return;
			}

			var options = {
				url: 'file://' + data.path
			};

			juice.juiceContent(content, options, function(err, html) {
				result[key] = html;
				next(err);
			});
		}

		async.each(templateData, render, function(err) {
			callback(err, result);
		});
	});
};

module.exports = EmailTemplateRenderer;

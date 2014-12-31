var should = require('should'),
	Renderer = require('../'),
	path = require('path');

describe('Renderer', function() {
	var dataDir = __dirname + '/data';

	it('should require a template directory', function() {
		function create() {
			new Renderer();
		}

		(create).should.throwError('A template directory is required');
	});

	it('should render jade template', function(done) {
		var dir = dataDir + '/jade';

		var renderer = new Renderer(dir),
			locals = { hello: 'world' };

		renderer.render('test1', locals, function(err, result) {
			try {
				should.not.exist(err);
				result.should.have.property('index');
				var expected = '\n\
<html>\n\
  <head>\n\
    \n\
  </head>\n\
  <body>\n\
    <p style="color: red;">Hello world</p>\n\
  </body>\n\
</html>\n';

				result.index.should.equal(expected);

				renderer.should.have.property('templates');
				renderer.templates.should.have.property('test1');
				renderer.templates.should.have.property('test2');
			} catch (e) {
				err = e;
			}

			done(err);
		});
	});

	it('should render ejs template', function(done) {
		var dir = dataDir + '/ejs';

		var renderer = new Renderer(dir),
			locals = { hello: 'world' };

		renderer.render('test1', locals, function(err, result) {
			try {
				should.not.exist(err);
				result.should.have.property('index');
				var expected = '<html>\n\
	<body>\n\
		<p>Hello world</p>\n\
	</body>\n\
</html>\n\n';

				result.index.should.equal(expected);

				renderer.should.have.property('templates');
				renderer.templates.should.have.property('test1');
				renderer.templates.should.have.property('test2');
			} catch (e) {
				err = e;
			}

			done(err);
		});
	});

	it('should render multiple template languages in same directory', function(done) {
		var dir = dataDir + '/mixed';

		var renderer = new Renderer(dir),
			locals = { hello: 'world' };

		renderer.render('foo', locals, function(err, result) {
			try {
				should.not.exist(err);
				result.should.have.property('ejs');
				result.should.have.property('text');
				result.ejs.should.equal('<html><body>Hello world\n</body></html>');
				result.text.should.equal('Hello world!');
			} catch (e) {
				err = e;
			}

			done(err);
		});
	});

	it('should render nunjucks template', function(done) {
		var dir = dataDir + '/nunjucks';

		var renderer = new Renderer(dir),
			locals = { hello: 'world' };

		renderer.render('ninja', locals, function(err, result) {
			try {
				should.not.exist(err);
				result.should.have.property('hello');
				result.hello.should.equal('<html><body>hello world\n\n\nhello world\n\n</body></html>');
			} catch (e) {
				err = e;
			}

			done(err);
		});
	});
});
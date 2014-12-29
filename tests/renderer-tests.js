var should = require('should'),
	Renderer = require('../src/email-template-renderer'),
	path = require('path');

describe('Renderer', function() {
	var dataDir = __dirname + '/data';

	it('should require a template directory', function() {
		function create() {
			new Renderer();
		}

		(create).should.throwError('A template directory is required');
	});

	it('should default to html if no type is given', function() {
		var renderer = new Renderer('foo');

		renderer.should.have.property('type');
		renderer.type.should.have.property('ext', 'html');
	});

	it('should use custom type', function() {
		var renderer = new Renderer('foo', {
			hello: 'world'
		});

		renderer.should.have.property('type');
		renderer.type.should.have.property('hello', 'world');
	});

	it('should render jade template', function(done) {
		var dir = dataDir + '/jade';

		var renderer = new Renderer(dir, 'jade'),
			locals = { hello: 'world' };

		renderer.render('test1', locals, function(err, result) {
			try {
				should.not.exist(err);
				result.should.have.property('index');
				var expected = '\n\
<html>\n\
  <body>\n\
    <p>Hello world</p>\n\
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

		var renderer = new Renderer(dir, 'ejs'),
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
});
import Server from './server.mjs';

const server = new Server({
	pagesPath: './static/pages',
	staticPath: './static',
});
server.run();

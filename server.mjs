import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';

const PORT = 8000;

const MIME_TYPES = {
	default: 'application/octet-stream',
	html: 'text/html; charset=UTF-8',
	pdf: 'application/pdf',
	js: 'application/javascript',
	css: 'text/css',
	png: 'image/png',
	jpg: 'image/jpg',
	gif: 'image/gif',
	ico: 'image/x-icon',
	svg: 'image/svg+xml',
};

const STATIC_PATH = path.join(process.cwd(), './static');
const PAGES_PATH = path.join(process.cwd(), './pages');

const toBool = [() => true, () => false];

const render = (template, params) => {
	let view = template;
	for(const key in params) {
		view = view.replaceAll(`{{{${key}}}}`, params[key]);
	}
	return view;
};

const prepareFile = async (url) => {
	const paths = [STATIC_PATH, url];
	if (url.endsWith('/')) paths.push('index.html');
	const filePath = path.join(...paths);
	const pathTraversal = !filePath.startsWith(STATIC_PATH);
	const exists = await fs.promises.access(filePath).then(...toBool);
	const found = !pathTraversal && exists;
	const streamPath = found ? filePath : STATIC_PATH + '/404.html';
	const ext = path.extname(streamPath).substring(1).toLowerCase();
	const stream = fs.createReadStream(streamPath);
	return { found, ext, stream };
};

const handlePageRequest = async (req, res) => {
	let url = req.url;
	if(url.match(/[a-zA-Z]$/g)) {
		url += '.html'
	}
	const paths = [PAGES_PATH, url];
	if(url.endsWith('/')) {
		paths.push('index.html');
	}
	const filePath = path.join(...paths);
	const pathTraversal = !filePath.startsWith(PAGES_PATH);
	const exists = await fs.promises.access(filePath).then(...toBool);
	const found = !pathTraversal && exists;
	if(!found) {
		return false;
	}

	const indexTmpl = fs.readFileSync(
		'static/index.html').toString();
	const page = fs.readFileSync(filePath).toString();
	const view = render(indexTmpl, {
		page: page,
	});

	if(view) {
		res.writeHead(200, {
			'Content-Type': 'text/html; charset=UTF-8'
		});
		res.end(view);
		return true;
	} else {
		return false;
	}
};

http.createServer(async (req, res) => {
	const isPageRequest = await handlePageRequest(req, res);
	if(isPageRequest) {
		return;
	}
	const file = await prepareFile(req.url);
	const statusCode = file.found ? 200 : 404;
	const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
	res.writeHead(statusCode, { 'Content-Type': mimeType });
	file.stream.pipe(res);
	console.log(`${req.method} ${req.url} ${statusCode}`);
}).listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);

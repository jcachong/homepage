import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { marked } from './node_modules/marked/lib/marked.esm.js';

const PORT = 8000;

const MIME_TYPES = {
	html: 'text/html; charset=UTF-8',
	pdf: 'application/pdf',
	js: 'application/javascript',
	css: 'text/css',
	jpg: 'image/jpg',
	ttf: 'application/x-font-ttf',
	otf: 'application/x-font-opentype',
};

const STATIC_PATH = path.join(process.cwd(), './static');
const PAGES_PATH = path.join(process.cwd(), './static/pages');

const toBool = [() => true, () => false];

export default class Server {

	construct() {
	}

	run() {
		http.createServer(async (req, res) => {
			const isPageRequest = await this.handlePageRequest(req, res);
			if(isPageRequest) {
				return;
			}
			const isMarkdownPageRequest = await this.handleMarkdownPageRequest(req, res);
			if(isMarkdownPageRequest) {
				return;
			}
			const file = await this.prepareFile(req.url);
			const statusCode = file.found ? 200 : 404;
			res.writeHead(statusCode, {
				'Content-Type': file.mimeType,
			});
			file.stream.pipe(res);
			console.log(`${req.method} ${req.url} ${statusCode}`);
		}).listen(PORT);
		console.log(`Server running at http://127.0.0.1:${PORT}/`);
	}

	render(template, params) {
		let view = template;
		for(const key in params) {
			view = view.replaceAll(`{{{${key}}}}`, params[key]);
		}
		return view;
	}

	async getFilePath(url, prefix = STATIC_PATH) {
		const paths = [prefix, url];
		if (url.endsWith('/')) paths.push('index.html');
		const filePath = path.join(...paths);
		const pathTraversal = !filePath.startsWith(STATIC_PATH);
		const exists = await fs.promises.access(filePath).then(...toBool);
		const found = !pathTraversal && exists;
		return found ? filePath : null;
	}

	async prepareFile(url) {
		let filePath = await this.getFilePath(url);
		let found = filePath !== null;
		let streamPath = found ? filePath : STATIC_PATH + '/404.html';
		const extension = path.extname(streamPath).substring(1).toLowerCase();
		let mimeType = MIME_TYPES[extension];
		if(!mimeType) {
			// Only serve known filetypes.
			streamPath = STATIC_PATH + '/404.html';
			found = false;
			mimeType = MIME_TYPES['html'];
		}
		const stream = fs.createReadStream(streamPath);
		return { found, mimeType, stream };
	}

	async handlePageRequest(req, res) {
		let url = req.url;
		if(url.match(/[a-zA-Z]$/g)) {
			url += '.html'
		} else if(url === '/') {
			url = 'home.html'
		}
		let filePath = await this.getFilePath(url, PAGES_PATH);
		let isMarkdown = false;
		if(filePath === null && url.match(/\.html$/)) {
			url = url.replace(/\.html$/, '.md');
			filePath = await this.getFilePath(url, PAGES_PATH);
			isMarkdown = true;
		}

		if(filePath === null) {
			return false;
		}

		const indexTmpl = fs.readFileSync(
			'static/index.html').toString();
		const page = fs.readFileSync(filePath).toString();
		const view = this.render(indexTmpl, {
			page: isMarkdown ? marked(page) : page,
		});

		return this.writeHTMLResponse(res, view);
	}

	async handleMarkdownPageRequest(req, res) {
		let url = req.url;
		if(!url.match(/\.html$/)) {
			return false;
		}
		url = url.replace(/\.html$/, '.md');
		const filePath = await this.getFilePath(url);
		if(filePath === null) {
			return false;
		}
		console.log(`Handling Markdown request for ${filePath}`);
		const md = fs.readFileSync(filePath).toString();
		const html = marked(md);
		return this.writeHTMLResponse(res, html);
	}

	writeHTMLResponse(res, content) {
		res.writeHead(200, {
			'Content-Type': 'text/html; charset=UTF-8'
		});
		res.end(content);
		return true;
	}

}

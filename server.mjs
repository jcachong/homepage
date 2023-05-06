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

const toBool = [() => true, () => false];
const cwd = process.cwd();

export default class Server {

	constructor(options) {
		this.pagesPath = this.buildPath(options.pagesPath);
		this.staticPath = this.buildPath(options.staticPath);

		this.processFns = [
			'processFullPageRequest',
			'processContentRequest',
			'processStaticRequest',
		];
	}

	buildPath(relativePath) {
		return path.join(cwd, relativePath);
	}

	run() {
		http.createServer(async (req, res) => {
			for(let i = 0; i < this.processFns.length; i++) {
				const processFn = this.processFns[i];
				if(await this[processFn](req, res)) {
					return;
				}
			}
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

	async getFilePath(url, prefix = this.staticPath) {
		const paths = [prefix, url];
		const filePath = path.join(...paths);
		const pathTraversal = !filePath.startsWith(this.staticPath);
		const exists = await fs.promises.access(filePath).then(...toBool);
		const found = !pathTraversal && exists;
		return found ? filePath : null;
	}

	async prepareFile(url) {
		let filePath = await this.getFilePath(url);
		let found = filePath !== null;
		let streamPath = found ? filePath : this.staticPath + '/404.html';
		const extension = path.extname(streamPath).substring(1).toLowerCase();
		let mimeType = MIME_TYPES[extension];
		if(!mimeType) {
			// Only serve known filetypes.
			streamPath = this.staticPath + '/404.html';
			found = false;
			mimeType = MIME_TYPES['html'];
		}
		const stream = fs.createReadStream(streamPath);
		return { found, mimeType, stream };
	}

	async getMarkdownFilePath(url, basePath = this.staticPath) {
		url = this.convertToMarkdownURL(url);
		if(url === false) {
			return null;
		}
		return await this.getFilePath(url, basePath);
	}

	convertToMarkdownURL(url) {
		if(!url.match(/\.html$/)) {
			return false;
		}
		return url.replace(/\.html$/, '.md');
	}

	async processFullPageRequest(req, res) {
		let url = req.url;
		if(url.match(/[a-zA-Z]$/g)) {
			url += '.html'
		} else if(url === '/') {
			url = 'home.html'
		}
		let filePath = await this.getFilePath(url, this.pagesPath);
		let isMarkdown = false;

		if(filePath === null) {
			filePath = await this.getMarkdownFilePath(url, this.pagesPath);
			isMarkdown = (filePath !== null);
		}

		if(filePath === null) {
			return false;
		}

		const indexTmpl = (await fs.promises.readFile(
			'static/index.html')).toString();
		const page = (await fs.promises.readFile(filePath)).toString();
		const view = this.render(indexTmpl, {
			page: isMarkdown ? marked(page) : page,
		});

		return this.sendHTMLResponse(res, view);
	}

	async processContentRequest(req, res) {
		const filePath = await this.getMarkdownFilePath(req.url);
		if(filePath === null) {
			return false;
		}
		console.log(`Handling Markdown request for ${filePath}`);
		const md = (await fs.promises.readFile(filePath)).toString();
		const html = marked(md);
		return this.sendHTMLResponse(res, html);
	}

	async processStaticRequest(req, res) {
		const file = await this.prepareFile(req.url);
		const statusCode = file.found ? 200 : 404;
		this.sendResponse(res, statusCode, file.mimeType);
		file.stream.pipe(res);
		console.log(`${req.method} ${req.url} ${statusCode}`);
	}

	sendHTMLResponse(res, content) {
		this.sendResponse(res, 200, 'text/html; charset=UTF-8');
		res.end(content);
		return true;
	}

	sendResponse(res, statusCode, contentType) {
		res.writeHead(statusCode, {
			'Content-Type': contentType,
		});
	}

}

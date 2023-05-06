import * as fs from 'node:fs';
import * as path from 'node:path';

const staticPath = path.join(process.cwd(), './static');

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

export default class Handler {

	constructor(req, res) {
		this.req = req;
		this.res = res;
	}

	static async getInstance(req, res) {
		// To be overridden.
		return false;
	}

	async process(req, res) {
		// No-op; to be overridden.
	}

	render(template, params) {
		let view = template;
		for(const key in params) {
			view = view.replaceAll(`{{{${key}}}}`, params[key]);
		}
		return view;
	}

	static async getFilePath(url, prefix = staticPath) {
		const paths = [prefix, url];
		const filePath = path.join(...paths);
		const pathTraversal = !filePath.startsWith(staticPath);
		const exists = await fs.promises.access(filePath).then(...toBool);
		const found = !pathTraversal && exists;
		return found ? filePath : null;
	}

	static async prepareFile(url) {
		let filePath = await Handler.getFilePath(url);
		let found = filePath !== null;
		let streamPath = found ? filePath : staticPath + '/404.html';
		const extension = path.extname(streamPath).substring(1).toLowerCase();
		let mimeType = MIME_TYPES[extension];
		if(!mimeType) {
			// Only serve known filetypes.
			streamPath = staticPath + '/404.html';
			found = false;
			mimeType = MIME_TYPES['html'];
		}
		const stream = fs.createReadStream(streamPath);
		return { found, mimeType, stream };
	}

	static async getMarkdownFilePath(url, basePath = staticPath) {
		url = Handler.convertToMarkdownURL(url);
		if(url === false) {
			return null;
		}
		return await Handler.getFilePath(url, basePath);
	}

	static convertToMarkdownURL(url) {
		if(!url.match(/\.html$/)) {
			return false;
		}
		return url.replace(/\.html$/, '.md');
	}

	static getFullPageURL(req) {
		let url = req.url;
		if(url === '/') {
			url = 'home.html';
		} else if(url.match(/[a-zA-Z]$/g)) {
			url += '.html';
		}
		return url;
	}

	async readFile(filePath = this.filePath) {
		const result = await fs.promises.readFile(filePath);
		return result.toString();
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

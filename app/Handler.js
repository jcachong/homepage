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
	xml: 'application/xml',
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

		// index.html is a template which should not be sent directly to the client.
		// Don't allow client to load index.html directly.
		const isIndexHtml = url.endsWith('index.html');
		if (isIndexHtml) {
			return null;
		}

		const hasPathTraversal = !filePath.startsWith(staticPath);
		if (hasPathTraversal) {
			return null;
		}

		const doesFileExist = await fs.promises.access(filePath).then(...toBool);
		if (!doesFileExist) {
			return null;
		}

		return filePath;
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
		if(url.match(/\.html$/)) {
			return url.replace(/\.html$/, '.md');
		} else if(url.match(/\/[a-z-]+$/)) {
			return `${url}.md`;
		} else {
			return false;
		}
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

	sendHTMLResponse(content) {
		this.sendHeaders(200, 'text/html; charset=UTF-8');
		this.sendBody(content);
		return true;
	}

	sendBody(content) {
		this.res.end(content);
	}

	sendHeaders(statusCode, contentType) {
		const headers = {
			'Content-Type': contentType,
		};
		switch(contentType) {
			case 'application/javascript':
			case 'text/css':
			case 'image/jpg':
			case 'application/x-font-ttf':
			case 'application/x-font-opentype':
				headers['Cache-Control'] = 'public, max-age=31536000';
				break;
			default:
				headers['X-Content-Type-Options'] = 'nosniff';
				break;
		}

		this.res.writeHead(statusCode, headers);
	}

}

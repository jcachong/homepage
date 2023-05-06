import * as path from 'node:path';
import { marked } from '../node_modules/marked/lib/marked.esm.js';
import Handler from './Handler.js';

const pagesPath = path.join(process.cwd(), './static/pages');

export default class IndexHandler extends Handler {

	static async getInstance(req, res) {
		const url = Handler.getFullPageURL(req);
		let filePath = await Handler.getFilePath(url, pagesPath);
		let isMarkdown = false;

		if(filePath === null) {
			filePath = await Handler.getMarkdownFilePath(url, pagesPath);
			isMarkdown = (filePath !== null);
		}

		if(filePath === null) {
			return null;
		}

		const requestHandler = new IndexHandler(req, res);
		requestHandler.filePath = filePath;
		requestHandler.isMarkdown = isMarkdown;
		return requestHandler;
	}

	async process() {
		const indexTmpl = await this.readFile('static/index.html');
		const page = await this.readFile();
		const view = this.render(indexTmpl, {
			page: this.isMarkdown ? marked(page) : page,
		});

		return this.sendHTMLResponse(this.res, view);
	}

}

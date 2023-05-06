import * as fs from 'node:fs';
import { marked } from './node_modules/marked/lib/marked.esm.js';
import Handler from './Handler.js';

export default class ContentHandler extends Handler {

	static async getInstance(req, res) {
		const filePath = await Handler.getMarkdownFilePath(req.url);
		if(filePath === null) {
			return null;
		}

		const requestHandler = new ContentHandler(req, res);
		requestHandler.filePath = filePath;
		return requestHandler;
	}

	async process() {
		console.log(`Handling Markdown request for ${this.filePath}`);
		const md = (await fs.promises.readFile(this.filePath)).toString();
		const html = marked(md);
		return this.sendHTMLResponse(this.res, html);
	}

}

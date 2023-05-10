import Handler from './Handler.js';

export default class StaticHandler extends Handler {

	static async getInstance(req, res) {
		return new StaticHandler(req, res);
	}

	async process() {
		const file = await Handler.prepareFile(this.req.url);
		const statusCode = file.found ? 200 : 404;
		this.sendHeaders(statusCode, file.mimeType);
		file.stream.pipe(this.res);
		console.log(`${this.req.method} ${this.req.url} ${statusCode}`);
	}

}

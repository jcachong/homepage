import * as http from 'node:http';
import IndexHandler from './IndexHandler.js';
import ContentHandler from './ContentHandler.js';
import StaticHandler from './StaticHandler.js';

export default class Server {

	constructor(port) {
		this.port = port;
		this.handlers = [
			IndexHandler,
			ContentHandler,
			StaticHandler,
		];
	}

	run() {
		http.createServer(async (req, res) => {
			for(let i = 0; i < this.handlers.length; i++) {
				const handler = await (this.handlers[i]).getInstance(req, res)
				if(handler !== null) {
					return await handler.process();
				}
			}
		}).listen(this.port);

		console.log(`Server running at http://127.0.0.1:${this.port}/`);
	}

}

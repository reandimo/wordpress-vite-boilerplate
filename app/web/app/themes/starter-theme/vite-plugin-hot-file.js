import { writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

export default function hotFile() {
	const hotFilePath = resolve(process.cwd(), 'public/hot');
	
	return {
		name: 'vite-plugin-hot-file',
		configureServer() {
			writeFileSync(hotFilePath, 'http://localhost:5173');
		},
		closeBundle() {
			try {
				unlinkSync(hotFilePath);
			} catch (e) {
				// File may not exist
			}
		},
	};
}

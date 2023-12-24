import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const destination = path.join(__dirname, '../', 'temp');

const multerConfig = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, destination);
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
});

export const uploadTmp = multer({ storage: multerConfig });

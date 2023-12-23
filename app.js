import express from 'express';

import logger from 'morgan';

import cors from 'cors';

import dotenv from 'dotenv';

import usersRouter from './routes/userRouter.js';

// SWAGGER

import swaggerui from 'swagger-ui-express';

import swaggerJSDoc from 'swagger-jsdoc';

const options = {
	definition: {
		openapi: '5.0.0',
		info: {
			title: 'PicsWorldProject API',
			version: '1.0.0',
			description: 'Documentation for PicsWorldProject',
		},
		servers: [
			{
				url: 'http://localhost:3001',
			},
		],
	},
	apis: ['./routes/*.js'],
};

const specs = swaggerJSDoc(options);

const app = express();

app.use('/api-docs', swaggerui.serve, swaggerui.setup(specs));

// SWAGGER

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/users', usersRouter);

app.use((req, res) => {
	res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
	const { statusCode = 500, message = 'Server error' } = err;
	res.status(statusCode).json({ message });
});

// app.get('/', (request, response) => {
// 	response.send(0);
// });

// app.get('/water', (request, response) => {});

// app.post('/user', (request, response) => {});

export default app;

// app.listen(3001, () => console.log('Server running on 3001 PORT'));

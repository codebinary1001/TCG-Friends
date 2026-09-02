import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../src/server/api';

dotenv.config();

const app = express();

app.use(express.json({ limit: '15mb' }));

// Mount the API router
app.use('/api', apiRouter);

export default app;

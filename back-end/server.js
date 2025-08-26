import express from 'express';
import chatRouter from './routes/chat.js';
import chunkRouter from './routes/chunks.js';
import folderRouter from './routes/folders.js';
import brandRouter from './routes/brand.js';
import artRouter from "./routes/art.js";
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT || 3003;
const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use('/chat', chatRouter);
app.use('/memory', chunkRouter);
app.use('/folders', folderRouter);
app.use("/brand", brandRouter);
app.use("/art", artRouter);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
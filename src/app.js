import express from 'express';
import raffleRoutes from './routes/raffleRoutes.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*'  
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'raffles' });
});

// Montar rutas
app.use('/api/raffles', raffleRoutes);

export default app;

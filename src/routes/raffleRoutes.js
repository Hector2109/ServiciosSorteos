import express from 'express';
import { auth } from '../middleware/auth.js';
import { createRaffle, reserveTicket } from '../controllers/raffleController.js';

const router = express.Router();

router.post('/create-raffle' , createRaffle);

router.post(
    '/:raffleId/tickets',
    auth,                 
    reserveTicket
);

export default router;
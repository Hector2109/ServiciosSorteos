import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
    createRaffle, 
    reserveTicket,
    getActiveRaffles,
    getRaffleById
} from '../controllers/raffleController.js';

const router = express.Router();

// Obtener todos los sorteos activos
router.get('/', getActiveRaffles);

// Obtener un sorteo específico por ID
router.get('/:raffleId', getRaffleById);

// Crear un nuevo sorteo
router.post('/', createRaffle); 

// Reservar boletos para un sorteo
router.post(
    '/:raffleId/tickets', 
    auth, 
    reserveTicket
);

export default router;
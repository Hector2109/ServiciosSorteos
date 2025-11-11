import express from 'express';
import { auth } from '../middleware/auth.js';
import { isSorteador } from '../middleware/auth.js';
import { 
    createRaffle, 
    reserveTicket,
    getActiveRaffles,
    getRaffleById,
    getTicketsByRaffleId,
    getEndedRaffles,
    getInnactiveRaffles
} from '../controllers/raffleController.js';

const router = express.Router();

// Obtener todos los sorteos activos
router.get('/', getActiveRaffles);

// Obtener un sorteo específico por ID
router.get('/:raffleId', getRaffleById);

// Obtendrá todos los boletos para un sorteo específico
router.get('/:raffleId/tickets', getTicketsByRaffleId);

// Crear un nuevo sorteo
router.post('/', createRaffle, auth, isSorteador); 

// Obtener sorteos inactivos
router.get('/admin/inactive', auth, isSorteador, getInnactiveRaffles);

// Obtener sorteos finalizados
router.get('/admin/ended', auth, isSorteador, getEndedRaffles);

// Ruta para cambiar el estado
router.put('/admin/state/:raffleId', auth, isSorteador, updateRaffleState); 

// Reservar boletos para un sorteo
router.post(
    '/:raffleId/tickets', 
    auth, 
    reserveTicket
);

export default router;
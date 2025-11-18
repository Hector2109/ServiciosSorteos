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
    getInnactiveRaffles,
    updateRaffleState,
    getRafflesByParticipant
} from '../controllers/raffleController.js';

const router = express.Router();

// Obtener todos los sorteos activos
router.get('/', getActiveRaffles);

// Obtner sorteos de un partcipante en específico
router.get('/my-raffles', getRafflesByParticipant, auth);

// Crear un nuevo sorteo
router.post('/', createRaffle, auth, isSorteador); 

// Obtener sorteos inactivos
router.get('/admin/inactive', getInnactiveRaffles, auth, isSorteador);

// Obtener sorteos finalizados
router.get('/admin/ended', getEndedRaffles, auth, isSorteador);

// Obtener un sorteo específico por ID
router.get('/:raffleId', getRaffleById);

// Obtendrá todos los boletos para un sorteo específico
router.get('/:raffleId/tickets', getTicketsByRaffleId);

// Ruta para cambiar el estado
router.put('/admin/state/:raffleId', updateRaffleState, auth, isSorteador);

// Reservar boletos para un sorteo
router.post(
    '/:raffleId/tickets', 
    auth, 
    reserveTicket
);


export default router;
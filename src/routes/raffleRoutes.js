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
    updateRaffle,
    getRafflesByParticipant,
    getTicketsForRaffleByUser,
    getApartedTicketsForRaffleByUser,
    payApartedTicketsForRaffleByUserOnline,
    registerTransferPaymentForTickets,
    getRafflesSummary,
    getPaymentsForRaffle,
    getPaymentsDetails
} from '../controllers/raffleController.js';

const router = express.Router();

// Obtener el resumen de un sorteo
router.get('/summary/:raffleId', getRafflesSummary, auth, isSorteador);

// Obtener los pagos realizados para un sorteo específico
router.get('/payments/:raffleId', auth, getPaymentsForRaffle);

// Obtener los detalles de los pagos para un sorteo específico
router.get('/payments/details/:paymentId', auth, getPaymentsDetails);

// Obtener sorteos de un participante en específico
router.get('/my-raffles', auth, getRafflesByParticipant);

// Obtener boletos apartados y comprados para un sorteo específico por un usuario
router.get('/tickets/:raffleId/user', auth, getTicketsForRaffleByUser);

// Obtener boletos apartados para un sorteo específico por un usuario
router.get('/tickets/aparted/:raffleId/user', auth, getApartedTicketsForRaffleByUser);

// Pagar boletos apartados para un sorteo específico por un usuario
router.put('/tickets/pay/:raffleId', auth, payApartedTicketsForRaffleByUserOnline);

// Registrar transacción de pago para boletos apartados
router.put('/tickets/pay/:raffleId/transaction', auth, registerTransferPaymentForTickets);

// Obtendrá todos los boletos para un sorteo específico
router.get('/:raffleId/tickets', getTicketsByRaffleId);



// Obtener sorteos inactivos
router.get('/admin/inactive', getInnactiveRaffles, auth, isSorteador);

// Obtener sorteos finalizados
router.get('/admin/ended', getEndedRaffles, auth, isSorteador);

// Ruta para cambiar el estado
router.put('/admin/state/:raffleId', updateRaffleState, auth, isSorteador);

//Ruta para actualizar un sorteo
router.put('/admin/update/:raffleId', auth, updateRaffle, isSorteador);




// Obtener todos los sorteos activos
router.get('/', getActiveRaffles);

// Crear un nuevo sorteo
router.post('/', createRaffle, auth, isSorteador); 

// Reservar boletos para un sorteo
router.post(
    '/:raffleId/tickets', 
    auth, 
    reserveTicket
);

// Obtener un sorteo específico por ID
router.get('/:raffleId', getRaffleById);

export default router;
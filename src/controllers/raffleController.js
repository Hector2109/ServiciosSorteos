import Raffle from "../models/raffle.js";
import Ticket from "../models/ticket.js";


// Controlador para crear un nuevo sorteo
export const createRaffle = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      premio,
      cantidadMaximaBoletos,
      fechaInicialVentaBoletos,
      fechaFinalVentaBoletos,
      fechaRealizacion,
      limiteBoletosPorUsuario,
      precioBoleto,
      urlImagen,
    } = req.body;

    const newRaffle = await Raffle.create({
      nombre,
      descripcion,
      premio,
      cantidadMaximaBoletos,
      fechaInicialVentaBoletos,
      fechaFinalVentaBoletos,
      fechaRealizacion,
      limiteBoletosPorUsuario,
      precioBoleto,
      urlImagen,
    });

    res
      .status(201)
      .json({ message: "Sorteo creado exitosamente", raffle: newRaffle });
  } catch (error) {
    console.error("Error al crear el sorteo:", error);
    res.status(500).json({ error: "Error al crear el sorteo" });
  }
};

// Controlador para crear un boleto asociado a un sorteo
export const reserveTicket = async (req, res) => {
    const { raffleId } = req.params;
    const { numerosBoletos } = req.body; // Array de números de boletos
    const userId = req.userId; // Suponiendo que el ID del usuario está en req.user

    if (!numerosBoletos || !Array.isArray(numerosBoletos) || numerosBoletos.length === 0) {
        return res.status(400).json({ error: "Números de boletos inválidos" });
    }

    try {
        const raffle = await Raffle.findByPk(raffleId);
        if (!raffle) {
            return res.status(404).json({ error: "Sorteo no encontrado" });
        }

        const limiteBoletosPorUsuario = raffle.limiteBoletosPorUsuario;

        const existingTicketsCount = await Ticket.count({
            where: { raffleId, userId }
        });

        const newTicketsCount = numerosBoletos.length;
        const totalTicketsAfterReserve = existingTicketsCount + newTicketsCount;

        if (totalTicketsAfterReserve > limiteBoletosPorUsuario) {
            return res.status(400).json({ error: `Límite de ${limiteBoletosPorUsuario} boletos por usuario excedido` });
        }

        const reservedTickets = await Ticket.findAll({
            where: {
                raffleId,
                numeroBoleto: numerosBoletos
            },
            attributes: ['numeroBoleto', 'estado']
        });

        const alreadyReservedNumbers = reservedTickets.map(ticket => ticket.numeroBoleto);

        const ticketsToCreate = numerosBoletos.filter(num => !alreadyReservedNumbers.includes(num));
        const failedToReserve = numerosBoletos.filter(num => alreadyReservedNumbers.includes(num));

        if (ticketsToCreate.length === 0) {
            return res.status(400).json({ error: "Todos los números de boletos ya están reservados", failedToReserve });
        }

        const ticketData = ticketsToCreate.map(num => ({
            raffleId,
            userId,
            numeroBoleto: num,
            estado: 'APARTADO'
        }));

        const createdTickets = await Ticket.bulkCreate(ticketData);

        res.status(201).json({
            message: "Boletos reservados exitosamente",
            reservedTickets: createdTickets,
            failedToReserve
        });
    } catch (error) {
        console.error("Error al reservar boletos:", error);
        res.status(500).json({ error: "Error al reservar boletos" });
    }

};

// Controlador para obtener todos los sorteos activos (información resumida)
export const getActiveRaffles = async (req, res) => {
  try {
    const raffles = await Raffle.findAll({
      where: { estado: 'activo' },
      attributes: ['id', 'nombre', 'premio', 'precioBoleto', 'urlImagen']
    });
    res.status(200).json(raffles);
  } catch (error) {
    console.error("Error al obtener los sorteos activos:", error);
    res.status(500).json({ error: "Error al obtener los sorteos" });
  }
};

// Controlador para obtener un sorteo por su ID (información completa)
export const getRaffleById = async (req, res) => {
  try {
    const { raffleId } = req.params;
    const raffle = await Raffle.findByPk(raffleId);

    if (!raffle) {
      return res.status(404).json({ error: "Sorteo no encontrado" });
    }

    res.status(200).json(raffle);
  } catch (error) {
    console.error("Error al obtener el sorteo:", error);
    res.status(500).json({ error: "Error al obtener el sorteo" });
  }
};
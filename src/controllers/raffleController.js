import Raffle from "../models/raffle.js";
import Ticket from "../models/ticket.js";
import Payment from "../models/payment.js";
import User from "../models/userLite.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

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

  if (
    !numerosBoletos ||
    !Array.isArray(numerosBoletos) ||
    numerosBoletos.length === 0
  ) {
    return res.status(400).json({ error: "Números de boletos inválidos" });
  }

  try {
    const raffle = await Raffle.findByPk(raffleId);
    if (!raffle) {
      return res.status(404).json({ error: "Sorteo no encontrado" });
    }

    const limiteBoletosPorUsuario = raffle.limiteBoletosPorUsuario;

    const existingTicketsCount = await Ticket.count({
      where: { raffleId, userId },
    });

    const newTicketsCount = numerosBoletos.length;
    const totalTicketsAfterReserve = existingTicketsCount + newTicketsCount;

    if (totalTicketsAfterReserve > limiteBoletosPorUsuario) {
      return res.status(400).json({
        error: `Límite de ${limiteBoletosPorUsuario} boletos por usuario excedido`,
      });
    }

    const reservedTickets = await Ticket.findAll({
      where: {
        raffleId,
        numeroBoleto: numerosBoletos,
      },
      attributes: ["numeroBoleto", "estado"],
    });

    const alreadyReservedNumbers = reservedTickets.map(
      (ticket) => ticket.numeroBoleto
    );

    const ticketsToCreate = numerosBoletos.filter(
      (num) => !alreadyReservedNumbers.includes(num)
    );
    const failedToReserve = numerosBoletos.filter((num) =>
      alreadyReservedNumbers.includes(num)
    );

    if (ticketsToCreate.length === 0) {
      return res.status(400).json({
        error: "Todos los números de boletos ya están reservados",
        failedToReserve,
      });
    }

    const ticketData = ticketsToCreate.map((num) => ({
      raffleId,
      userId,
      numeroBoleto: num,
      estado: "APARTADO",
    }));

    const createdTickets = await Ticket.bulkCreate(ticketData);

    res.status(201).json({
      message: "Boletos reservados exitosamente",
      reservedTickets: createdTickets,
      failedToReserve,
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
      where: { estado: "activo" },
      attributes: [
        "id",
        "nombre",
        "premio",
        "precioBoleto",
        "urlImagen",
        "estado",
      ],
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

// Controlador para obtener el resumen de un sorteo específico
export const getRafflesSummary = async (req, res) => {
  try {
    const { raffleId } = req.params;
    const raffle = await Raffle.findByPk(raffleId);

    if (!raffle) {
      return res.status(404).json({ error: "Sorteo no encontrado" });
    }

    // --- Lógica para obtener los boletos (Tickets) ---
    const tickets = await Ticket.findAll({
      where: {
        raffleId: raffleId,
      },
      order: [["numeroBoleto", "ASC"]],
    });

    // --- Cálculo de Estadísticas (Añadido para completar el summary) ---

    const boletosComprados = tickets.filter(
      (ticket) => ticket.estado === "COMPRADO"
    ).length;
    const boletosApartados = tickets.filter(
      (ticket) => ticket.estado === "APARTADO"
    ).length;

    const boletosEnVenta = boletosComprados + boletosApartados;
    const totalBoletosDisponibles =
      raffle.cantidadMaximaBoletos - boletosEnVenta;

    const montoRecaudado = boletosComprados * raffle.precioBoleto;
    const montoPorRecaudar = boletosApartados * raffle.precioBoleto;

    res.status(200).json({
      raffle: raffle.toJSON(),
      estadisticas: {
        boletosComprados,
        boletosApartados,
        totalBoletosDisponibles: Math.max(0, totalBoletosDisponibles),
        montoRecaudado,
        montoPorRecaudar,
      },
    });
  } catch (error) {
    console.error("Error al obtener el resumen del sorteo:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener el resumen del sorteo",
    });
  }
};

// Controlador para obtener todos los boletos de un sorteo específico
export const getTicketsByRaffleId = async (req, res) => {
  try {
    const { raffleId } = req.params;
    const raffle = await Raffle.findByPk(raffleId);

    if (!raffle) {
      return res.status(404).json({ error: "Sorteo no encontrado" });
    }

    const tickets = await Ticket.findAll({
      where: {
        raffleId: raffleId,
      },
      order: [["numeroBoleto", "ASC"]],
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error al obtener los boletos del sorteo:", error);
    res.status(500).json({ error: "Error interno al obtener los boletos" });
  }
};

// Controlador para obtener todos los sorteos inactivos (información para vista principal administrador)
export const getInnactiveRaffles = async (req, res) => {
  try {
    const raffles = await Raffle.findAll({
      where: { estado: "inactivo" },
      attributes: [
        "id",
        "nombre",
        "premio",
        "precioBoleto",
        "urlImagen",
        "estado",
      ],
    });
    res.status(200).json(raffles);
  } catch (error) {
    console.error("Error al obtener los sorteos inactivos:", error);
    res.status(500).json({ error: "Error al obtener los sorteos" });
  }
};

// Controlador para obtener todos los sorteos finalizados (información para vista principal administrador)
export const getEndedRaffles = async (req, res) => {
  try {
    const raffles = await Raffle.findAll({
      where: { estado: "finalizado" },
      attributes: [
        "id",
        "nombre",
        "premio",
        "precioBoleto",
        "urlImagen",
        "estado",
      ],
    });
    res.status(200).json(raffles);
  } catch (error) {
    console.error("Error al obtener los sorteos finalizados:", error);
    res.status(500).json({ error: "Error al obtener los sorteos" });
  }
};

export const updateRaffleState = async (req, res) => {
  const { raffleId } = req.params;
  const { newState } = req.body;
  if (!["activo", "inactivo", "finalizado"].includes(newState)) {
    return res.status(400).json({ error: "Estado inválido" });
  }
  try {
    const updatedRaffle = await setStateRaffle(raffleId, newState);

    res.status(200).json({
      message: "Estado del sorteo actualizado",
      raffle: updatedRaffle,
    });
  } catch (error) {
    console.error("Error al actualizar el estado del sorteo:", error);
    res
      .status(error.message.includes("Sorteo no encontrado") ? 404 : 500)
      .json({
        error: error.message || "Error al actualizar el estado del sorteo",
      });
  }
};

export const updateRaffle = async (req, res) => {
  const { raffleId } = req.params;
  const dataToUpdate = req.body;

  // Limpiar los datos para la DB, eliminando solo campos que no se enviaron
  const cleanData = {};
  for (const key in dataToUpdate) {
    const value = dataToUpdate[key];

    // Ignorar si el valor es null, undefined, o una cadena vacía
    if (value !== null && value !== undefined && value !== "") {
      cleanData[key] = value;
    }
  }

  // Verificar si hay datos válidos para actualizar
  if (Object.keys(cleanData).length === 0) {
    return res.status(400).json({
      error: "No se proporcionaron datos válidos para actualizar el sorteo.",
    });
  }

  try {
    // Obtener el sorteo actual para realizar las validaciones de fecha
    const idToFind = parseInt(raffleId, 10);
    if (isNaN(idToFind)) {
      return res.status(400).json({ error: "ID de sorteo inválido." });
    }

    const existingRaffle = await Raffle.findByPk(idToFind);

    if (!existingRaffle) {
      return res.status(404).json({ error: "Sorteo no encontrado" });
    }

    // REALIZAR LAS VALIDACIONES DE LÓGICA DE NEGOCIO (Fechas, límites, etc.)

    //Verificar que el estado sea valido si existe en los datos a actualizar
    const newState = cleanData.estado;
    if (
      newState !== undefined &&
      !["activo", "inactivo", "finalizado"].includes(newState)
    ) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const creationDate = existingRaffle.fechaCreacion;

    // Validamos que limiteBoletosPorUsuario sea un número positivo
    if (
      cleanData.limiteBoletosPorUsuario !== undefined &&
      (typeof cleanData.limiteBoletosPorUsuario !== "number" ||
        cleanData.limiteBoletosPorUsuario < 1)
    ) {
      return res.status(400).json({
        error:
          "El límite de boletos por usuario debe ser un número positivo (mayor o igual a 1).",
      });
    }

    // Preparar fechas para validación: Usar valor nuevo si existe, sino el valor actual
    const newFechaInicial = cleanData.fechaInicialVentaBoletos
      ? new Date(cleanData.fechaInicialVentaBoletos)
      : existingRaffle.fechaInicialVentaBoletos;
    const newFechaFinal = cleanData.fechaFinalVentaBoletos
      ? new Date(cleanData.fechaFinalVentaBoletos)
      : existingRaffle.fechaFinalVentaBoletos;
    const newFechaRealizacion = cleanData.fechaRealizacion
      ? new Date(cleanData.fechaRealizacion)
      : existingRaffle.fechaRealizacion;

    // Validar fechaInicialVentaBoletos
    if (cleanData.fechaInicialVentaBoletos) {
      if (newFechaInicial >= newFechaFinal) {
        return res.status(400).json({
          error:
            "La fecha inicial de venta debe ser estrictamente anterior a la fecha final de venta.",
        });
      }
      if (newFechaInicial < creationDate) {
        return res.status(400).json({
          error:
            "La fecha inicial de venta no puede ser anterior a la fecha de creación.",
        });
      }
    }
    // Validar fechaFinalVentaBoletos
    if (cleanData.fechaFinalVentaBoletos) {
      if (newFechaFinal >= newFechaRealizacion) {
        return res.status(400).json({
          error:
            "La fecha final de venta debe ser estrictamente anterior a la fecha de realización.",
        });
      }
    }

    // Continúa con la actualización de los demás campos
    const updatedRaffle = await updateRaffleData(raffleId, cleanData);

    // Respuesta exitosa
    res.status(200).json({
      message: "Sorteo actualizado exitosamente",
      raffle: updatedRaffle,
    });
  } catch (error) {
    // Manejo de errores de la función de servicio o de la BD
    console.error("Error al actualizar el sorteo:", error);
    res.status(500).json({
      error: error.message || "Error interno al actualizar el sorteo",
    });
  }
};

export const updateRaffleData = async (raffleId, cleanData) => {
  try {
    const idToFind = parseInt(raffleId, 10);

    if (isNaN(idToFind)) {
      throw new Error("ID de sorteo inválido.");
    }

    // Ejecutar la actualización en la base de datos
    await Raffle.update(cleanData, {
      where: { id: idToFind },
    });
    const updatedRaffle = await Raffle.findByPk(idToFind);

    if (!updatedRaffle) {
      return null;
    }

    return updatedRaffle;
  } catch (error) {
    console.error("Error al actualizar los datos del sorteo:", error);
    throw error;
  }
};


export const setStateRaffle = async (raffleId, newState) => {
  try {
    const idToFind = parseInt(raffleId, 10);

    // Verificamos que el ID es un número válido
    if (isNaN(idToFind)) {
      throw new Error("ID de sorteo inválido.");
    }

    const raffle = await Raffle.findByPk(idToFind);
    if (!raffle) {
      throw new Error("Sorteo no encontrado");
    }
    raffle.estado = newState;
    await raffle.save();
    return raffle;
  } catch (error) {
    console.error("Error al actualizar el estado del sorteo:", error);
    throw error;
  }
};

// Controlador para obtener los sorteos en los que ha participado un usuario específico
export const getRafflesByParticipant = async (req, res) => {
  const userId = req.userId; // Obtenido del token

  try {
    const raffles = await Raffle.findAll({
      attributes: [
        "id",
        "nombre",
        "premio",
        "precioBoleto",
        "urlImagen",
        "estado",
      ],
      include: [
        {
          model: Ticket,
          as: "tickets",
          required: true,
          where: { userId },
          attributes: [],
        },
      ],
      distinct: true,
    });

    res.status(200).json(raffles);
  } catch (error) {
    console.error("Error al obtener los sorteos del participante:", error);
    res
      .status(500)
      .json({ error: "Error al obtener los sorteos del participante" });
  }
};


// Controlador para obtener los boletos de un usuario específico en un sorteo específico
export const getTicketsForRaffleByUser = async (req, res) => {
  const userId = req.userId;
  const { raffleId } = req.params;

  try {
    const tickets = await Ticket.findAll({
      where: { userId, raffleId },
      order: [["numeroBoleto", "ASC"]],
    });
    res.status(200).json(tickets);
  } catch (error) {
    console.error(
      "Error al obtener los boletos del usuario para el sorteo:",
      error
    );
    res.status(500).json({
      error: "Error al obtener los boletos del usuario para el sorteo",
    });
  }
};


// Controlador para obtener los boletos apartados de un usuario específico en un sorteo específico
export const getApartedTicketsForRaffleByUser = async (req, res) => {
  const userId = req.userId;
  const { raffleId } = req.params;

  try {
    const tickets = await Ticket.findAll({
      where: {
        userId,
        raffleId,
        estado: "APARTADO",

        // Filtrar boletos
        [Op.or]: [
          { paymentId: null }, // Sin pago
          { "$payment.estado$": { [Op.not]: "COMPLETADO" } }, // Pago no aprobado
        ],
      },
      include: [
        {
          model: Payment,
          as: "payment",
          required: false,
          attributes: ["id", "tipo", "estado"],
        },
      ],
      order: [["numeroBoleto", "ASC"]],
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error(
      "Error al obtener los boletos apartados del usuario para el sorteo:",
      error
    );
    res.status(500).json({
      error:
        "Error al obtener los boletos apartados del usuario para el sorteo",
    });
  }
};


export const payApartedTicketsForRaffleByUserOnline = async (req, res) => {
  const userId = req.userId;
  const { raffleId } = req.params;
  const { tickets, claveRastreo, monto } = req.body;

  if (!Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({ error: "Debes especificar los tickets." });
  }

  if (!claveRastreo) {
    return res.status(400).json({
      error: "La clave de rastreo es obligatoria para pagos en línea.",
    });
  }

  if (!monto) {
    return res
      .status(400)
      .json({ error: "Debes especificar el monto total del pago." });
  }

  const t = await sequelize.transaction();

  try {
    const apartados = await Ticket.findAll({
      where: {
        userId,
        raffleId,
        numeroBoleto: tickets,
        estado: "APARTADO",
      },
      transaction: t,
    });

    if (apartados.length !== tickets.length) {
      await t.rollback();
      return res.status(404).json({
        error:
          "Algunos tickets no están apartados, no existen o ya fueron comprados.",
      });
    }

    // Crear pago en línea
    const payment = await Payment.create(
      {
        tipo: "LINEA",
        claveRastreo,
        monto,
        estado: "COMPLETADO",
      },
      { transaction: t }
    );

    await Ticket.update(
      {
        estado: "COMPRADO",
        paymentId: payment.id,
      },
      {
        where: {
          userId,
          raffleId,
          numeroBoleto: tickets,
          estado: "APARTADO",
        },
        transaction: t,
      }
    );

    const updatedTickets = await Ticket.findAll({
      where: {
        userId,
        raffleId,
        numeroBoleto: tickets,
      },
      order: [["numeroBoleto", "ASC"]],
      include: [{ model: Payment, as: "payment" }],
      transaction: t,
    });

    await t.commit();

    res.status(200).json({
      message: "Pago en línea registrado correctamente",
      payment,
      tickets: updatedTickets,
    });
  } catch (error) {
    console.error("Error al procesar pago en línea:", error);
    await t.rollback();
    res.status(500).json({ error: "Error al procesar el pago en línea" });
  }
};


export const registerTransferPaymentForTickets = async (req, res) => {
  const userId = req.userId;
  const { raffleId } = req.params;
  const { tickets, voucher, monto } = req.body;

  if (!Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({ error: "Debes especificar los tickets." });
  }

  if (!voucher) {
    return res.status(400).json({
      error: "El voucher es obligatorio para pagos por transferencia.",
    });
  }

  if (!monto) {
    return res
      .status(400)
      .json({ error: "Debes especificar el monto total del pago." });
  }

  const t = await sequelize.transaction();
  try {
    const apartados = await Ticket.findAll({
      where: {
        userId,
        raffleId,
        numeroBoleto: tickets,
        estado: "APARTADO",
      },
      transaction: t,
    });

    if (apartados.length !== tickets.length) {
      await t.rollback();
      return res.status(404).json({
        error:
          "Algunos tickets no están apartados, no existen o ya fueron comprados.",
      });
    }
    // Crear pago por transferencia
    const payment = await Payment.create(
      {
        tipo: "TRANSFERENCIA",
        voucher,
        monto,
        estado: "PENDIENTE",
      },
      { transaction: t }
    );
    await Ticket.update(
      {
        paymentId: payment.id,
      },
      {
        where: {
          userId,
          raffleId,
          numeroBoleto: tickets,
          estado: "APARTADO",
        },
        transaction: t,
      }
    );
    const updatedTickets = await Ticket.findAll({
      where: {
        userId,
        raffleId,
        numeroBoleto: tickets,
      },
      order: [["numeroBoleto", "ASC"]],
      include: [{ model: Payment, as: "payment" }],
      transaction: t,
    });
    await t.commit();
    res.status(200).json({
      message: "Pago por transferencia registrado correctamente",
      payment,
      tickets: updatedTickets,
    });
  } catch (error) {
    console.error("Error al registrar pago por transferencia:", error);
    await t.rollback();
    res
      .status(500)
      .json({ error: "Error al registrar el pago por transferencia" });
  }
};


export const getPaymentsForRaffle = async (req, res) => {
  const userId = req.userId;
  const { raffleId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "Usuario inválido." });
  }
  if (!raffleId) {
    return res.status(400).json({ error: "Sorteo inválido." });
  }

  try {
    const payments = await Payment.findAll({
      distinct: true,
      attributes: ["id", "tipo", "estado", "createdAt"],
      include: [
        {
          model: Ticket,
          as: "tickets",
          required: true,
          where: { raffleId },
          attributes: ["id"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["nombre"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ error: "Error al obtener pagos." });
  }
};


export const getPaymentsDetails = async (req, res) => {
  const userId = req.userId;
  const { paymentId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "Usuario inválido." });
  }
  if (!paymentId) {
    return res.status(400).json({ error: "Pago inválido." });
  }
  try {
    const payment = await Payment.findOne({
      where: { id: paymentId },
      include: [
        {
          model: Ticket,
          as: "tickets",
          attributes: ["id", "numeroBoleto", "raffleId", "userId", "estado"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["nombre"],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ error: "Pago no encontrado." });
    }

    // Obtener sorteo una sola vez
    const raffleId = payment.tickets[0]?.raffleId;
    const raffle = await Raffle.findByPk(raffleId, {
      attributes: ["nombre", "precioBoleto"],
    });

    // Respuesta final sin duplicación
    return res.json({
      ...payment.toJSON(),
      raffle,
    });
  } catch (error) {
    console.error("Error al obtener detalles del pago:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener detalles del pago." });
  }
};


// // Obtener boletos apartados de un sorteo (Vista del Sorteador)
// export const getReservedTicketsForRaffle = async (req, res) => {
//   const { raffleId } = req.params;

//   try {
//     const reservedTickets = await Ticket.findAll({
//       where: {
//         raffleId,
//         estado: 'APARTADO'
//       },
//       include: [
//         {
//           model: User,
//           as: 'user',
//           attributes: ['nombre']
//         },
//         {
//           model: Payment,
//           as: 'payment',
//           required: false,
//           attributes: ['id', 'estado', 'tipo', 'monto']
//         }
//       ],
//       order: [['numeroBoleto', 'ASC']]
//     });

//     res.status(200).json(reservedTickets);
//   } catch (error) {
//     console.error("Error al obtener boletos apartados:", error);
//     res.status(500).json({ error: "Error interno al obtener los boletos apartados" });
//   }
// };

// 1. Obtener boletos apartados de un sorteo (FILTRADOS)
export const getReservedTicketsForRaffle = async (req, res) => {
  const { raffleId } = req.params;

  try {
    const reservedTickets = await Ticket.findAll({
      where: {
        raffleId,
        estado: 'APARTADO',
        
        [Op.or]: [
          { paymentId: null }, 
          { '$payment.estado$': { [Op.ne]: 'PENDIENTE' } }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['nombre']
        },
        {
          model: Payment,
          as: 'payment',
          required: false, // Necesario false para que el OR funcione con los nulos
          attributes: ['id', 'estado', 'tipo', 'monto']
        }
      ],
      order: [['numeroBoleto', 'ASC']]
    });

    res.status(200).json(reservedTickets);
  } catch (error) {
    console.error("Error al obtener boletos apartados:", error);
    res.status(500).json({ error: "Error interno al obtener los boletos apartados" });
  }
};


//Liberar boletos apartados
export const releaseReservedTickets = async (req, res) => {
  const { raffleId } = req.params;
  const { numerosBoletos } = req.body;

  if (!numerosBoletos || !Array.isArray(numerosBoletos) || numerosBoletos.length === 0) {
    return res.status(400).json({ error: "Debes enviar una lista de números de boletos a liberar." });
  }

  const t = await sequelize.transaction();

  try {

    //Borrar boletos con estado apartado, destroy para eliminar el boleto de todo
    const deletedCount = await Ticket.destroy({
      where: {
        raffleId,
        numeroBoleto: {
          [Op.in]: numerosBoletos
        },
        estado: 'APARTADO' 
      },
      transaction: t
    });

    if (deletedCount === 0) {
      await t.rollback();
      return res.status(404).json({ message: "No se encontraron boletos apartados con esos números para liberar." });
    }

    await t.commit();

    res.status(200).json({
      message: "Boletos liberados exitosamente.",
      cantidadLiberada: deletedCount,
      numerosLiberados: numerosBoletos
    });

  } catch (error) {
    await t.rollback();
    console.error("Error al liberar boletos:", error);
    res.status(500).json({ error: "Error al liberar los boletos." });
  }
};


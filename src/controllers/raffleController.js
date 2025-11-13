import Raffle from "../models/raffle.js";
import Ticket from "../models/ticket.js";

import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Controlador para crear un nuevo sorteo
export const createRaffle = [
  // 1. Middleware de Multer para capturar un solo archivo llamado 'urlImagen'.
  upload.single('urlImagen'),

  // 2. Nuestra lógica principal del controlador.
  async (req, res) => {
    try {
      // Verificamos si Multer nos entregó un archivo. Si no, es un error.
      if (!req.file) {
        return res.status(400).json({ error: "No se proporcionó ninguna imagen para el sorteo." });
      }

      // 3. Preparamos la imagen para enviarla a la API de ImgBB.
      const formData = new FormData();
      formData.append('image', req.file.buffer.toString('base64'));

      // 4. Hacemos la llamada a la API de ImgBB.
      const imgBbResponse = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        formData,
        { 
          headers: formData.getHeaders()
        }
      );

      // 5. De la respuesta de ImgBB, extraemos la URL de la imagen ya subida.
      const imageUrl = imgBbResponse.data.data.display_url;

      // 6. Extraemos los demás datos del sorteo, que ahora vienen en req.body.
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
      } = req.body;

      // 7. Creamos el sorteo en nuestra base de datos, guardando la URL de ImgBB.
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
        urlImagen: imageUrl, 
      });

      res.status(201).json({ message: "Sorteo creado exitosamente", raffle: newRaffle });
    } catch (error) {
      console.error("Error al crear el sorteo:", error.response ? error.response.data : error.message);
      res.status(500).json({ error: "Error interno al crear el sorteo" });
    }
  }
];

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

    res
      .status(200)
      .json({
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

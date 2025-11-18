import Raffle from "./raffle.js";
import Ticket from "./ticket.js";

// Definir asociaciones
Raffle.hasMany(Ticket, { foreignKey: 'raffleId', as: 'tickets' });
Ticket.belongsTo(Raffle, { foreignKey: 'raffleId', as: 'raffle' });
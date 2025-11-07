import Raffle from "./raffle";
import Ticket from "./ticket";

// Definir asociaciones
Raffle.hasMany(Ticket, { foreignKey: 'raffleId', as: 'tickets' });
Ticket.belongsTo(Raffle, { foreignKey: 'raffleId', as: 'raffle' });
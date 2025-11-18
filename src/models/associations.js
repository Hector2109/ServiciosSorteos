import Raffle from "./raffle.js";
import Ticket from "./ticket.js";
import Payment from "./payment.js";

// Definir asociaciones
Raffle.hasMany(Ticket, { foreignKey: 'raffleId', as: 'tickets' });
Ticket.belongsTo(Raffle, { foreignKey: 'raffleId', as: 'raffle' });

Ticket.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
Payment.hasMany(Ticket, { foreignKey: 'paymentId', as: 'tickets' });

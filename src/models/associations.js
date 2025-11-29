import Raffle from "./raffle.js";
import Ticket from "./ticket.js";
import Payment from "./payment.js";
import User from "./userLite.js";

// Definir asociaciones
Raffle.hasMany(Ticket, { foreignKey: 'raffleId', as: 'tickets' });
Ticket.belongsTo(Raffle, { foreignKey: 'raffleId', as: 'raffle' });

Ticket.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
Payment.hasMany(Ticket, { foreignKey: 'paymentId', as: 'tickets' });

Ticket.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
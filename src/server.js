import app from './app.js';
import sequelize from './config/db.js';
import Raffle from './models/raffle.js'; 
import Ticket from './models/ticket.js'; 
import Payment from './models/payment.js';
import './models/associations.js';


const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a PostgreSQL');
    return sequelize.sync({ alter: true }); // Crea o actualiza tablas para Sorteo y Boleto
  })
  .then(() => {
    console.log('Modelos sincronizados con la BD');
    app.listen(PORT, () => {
      console.log(`Servidor de Sorteos corriendo en el puerto ${PORT}`);
    });
  })
  .catch(err => console.error('Error de conexión en el Microservicio de Sorteos:', err));
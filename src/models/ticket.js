import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ticket = sequelize.define('Ticket', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // Llave foránea al sorteo
    raffleId: { type: DataTypes.INTEGER, allowNull: false },
    // Llave foránea al usuario
    userId: { type: DataTypes.INTEGER, allowNull: false },
    numeroBoleto: { type: DataTypes.STRING, allowNull: false, unique: false },
    estado: { type: DataTypes.ENUM('APARTADO', 'COMPRADO'), allowNull: false, defaultValue: 'APARTADO' }
});

export default ticket;
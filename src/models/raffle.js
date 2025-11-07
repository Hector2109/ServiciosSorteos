import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const Raffle = sequelize.define('Raffle', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    premio: { type: DataTypes.STRING, allowNull: false },
    estado: { type: DataTypes.ENUM('activo', 'inactivo', 'finalizado'), allowNull: false, defaultValue: 'activo' },
    cantidadMaximaBoletos: { type: DataTypes.INTEGER, allowNull: false },
    fechaCracion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fechaInicialVentaBoletos: { type: DataTypes.DATE, allowNull: false },
    fechaFinalVentaBoletos: { type: DataTypes.DATE, allowNull: false },
    fechaRealizacion: { type: DataTypes.DATE, allowNull: false },
    limiteBoletosPorUsuario: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    precioBoleto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    urlImagen: { type: DataTypes.STRING, allowNull: false },
});

export default Raffle;
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo: { type: DataTypes.ENUM("TRANSFERENCIA", "LINEA"), allowNull: false },
    voucher: { type: DataTypes.STRING, allowNull: true }, // SOLO PARA TRANSFERENCIA
    estado: {
      type: DataTypes.ENUM("PENDIENTE", "COMPLETADO", "FALLIDO"),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },
    claveRastreo: { type: DataTypes.STRING, allowNull: true }, // SOLO PARA PAGO EN LINEA
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    // Validar para asegurar que los campos se usen correctamente según el tipo de pago
    validate: {
      validarSegunTipo() {
        if (this.tipo === "TRANSFERENCIA") {
          if (!this.voucher) {
            throw new Error(
              "El voucher es obligatorio para pagos por transferencia."
            );
          }

          if (this.claveRastreo) {
            throw new Error(
              "La clave de rastreo no debe proporcionarse para pagos por transferencia."
            );
          }
        }
        if (this.tipo === "LINEA") {
          if (!this.claveRastreo) {
            throw new Error(
              "La clave de rastreo es obligatoria para pagos en línea."
            );
          }
          if (this.voucher) {
            throw new Error(
              "El voucher no debe proporcionarse para pagos en línea."
            );
          }
        }
      },
    },
  }
);

export default Payment;

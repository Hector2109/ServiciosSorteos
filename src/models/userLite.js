import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING
    }
  },
  {
    tableName: "Users",
    timestamps: false,
    freezeTableName: true
  }
);

export default User;

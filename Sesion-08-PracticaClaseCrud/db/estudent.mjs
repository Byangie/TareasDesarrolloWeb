// src/models/Estudiante.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export const Curso = sequelize.define('curso', {
  codigo: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombreUnico: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'El nombre del curso es obligatorio' } },
  },
  creditos: { type: DataTypes.STRING, 
    allowNull: false },
}, {
  tableName: 'cursos',
});
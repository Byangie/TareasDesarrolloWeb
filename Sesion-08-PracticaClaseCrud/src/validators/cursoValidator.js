import { body, validationResult } from 'express-validator';

export const validarEstudiante = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').trim().isEmail().withMessage('El email no es válido'),
  body('carrera').trim().notEmpty().withMessage('La carrera es obligatoria'),
];

export function revisarErrores(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
}
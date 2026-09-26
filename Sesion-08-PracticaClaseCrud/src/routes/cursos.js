import { Router } from 'express';
import { asyncHandler } from '../middlewares/errores.js';
import { cursoValidator, revisarErrores } from '../validators/cursoValidator.js';

export function cursosRoutes(repo) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    res.json(await repo.listar());
  }));

  router.get('/:codigo', asyncHandler(async (req, res) => {
    const curso = await repo.obtener(req.params.id);
    if (!curso) return res.status(404).json({ error: 'No encontrado' });
    res.json(curso);
  }));

  router.post('/', cursoValidator, revisarErrores,
    asyncHandler(async (req, res) => {
      const curso = await repo.crear(req.body);
      res.status(201).json(curso);
    }));

    router.put('/:codigo', cursoValidator, revisarErrores,
    asyncHandler(async (req, res) => {
        const actualizado = await repo.actualizar(req.params.id, req.body);
        if (!actualizado) return res.status(404).json({ error: 'No encontrado' });
        res.json(actualizado);
    }));

    router.delete('/:id', asyncHandler(async (req, res) => {
    const eliminado = await repo.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
    }));

  return router;

}
 

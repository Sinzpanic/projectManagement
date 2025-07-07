import express from 'express';
import rolesController from '../controllers/roles.controller.js';

const router = express.Router();

// Crear un nuevo rol
router.post('/', rolesController.createRole);

// Obtener roles de un servidor
router.get('/server/:serverId', rolesController.getRolesByServer);

// Obtener un rol específico por ID
router.get('/:id', rolesController.getRoleById);

// Actualizar un rol
router.put('/:id', rolesController.updateRole);

// Eliminar un rol
router.delete('/:id', rolesController.deleteRole);

// Validar nombre de rol único
router.get('/validate/name', rolesController.validateRoleName);

export default router;
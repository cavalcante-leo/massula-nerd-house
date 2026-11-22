const express = require('express');

const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validarIdsDaRota } = require('../middlewares/validarIds');

const superMiddleware = require('../middlewares/verificarSuperAdmin');

validarIdsDaRota(router);

// Rotas restritas ao super admin
router.post('/registrar', authMiddleware, superMiddleware, usuarioController.registrar );
router.get('/listar', authMiddleware, superMiddleware, usuarioController.listar );
router.put('/atualizar/:id', authMiddleware, usuarioController.atualizar );
router.put('/desativar/:id', authMiddleware, superMiddleware, usuarioController.desativar );
router.put('/reativar/:id', authMiddleware, superMiddleware, usuarioController.reativar );
router.get('/listar/:id', authMiddleware, usuarioController.obterPorID );

module.exports = router;
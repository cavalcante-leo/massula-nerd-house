const express = require('express');

const router = express.Router();
const nivelJogoController = require('../controllers/nivelJogo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const superMiddleware = require('../middlewares/verificarSuperAdmin');

// Rotas restritas ao super admin
router.post('/registrar', authMiddleware, superMiddleware, nivelJogoController.registrar);
router.put('/atualizar/:id', authMiddleware, superMiddleware, nivelJogoController.atualizar);
router.put('/desativar/:id', authMiddleware, superMiddleware, nivelJogoController.desativar);
router.put('/reativar/:id', authMiddleware, superMiddleware, nivelJogoController.reativar);

// Rotas acessíveis a qualquer usuário autenticado
router.get('/jogo/:id_jogo', authMiddleware, nivelJogoController.listarPorJogo);
router.get('/:id', authMiddleware, nivelJogoController.obterPorID);

module.exports = router;

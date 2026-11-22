const express = require('express');

const router = express.Router();
const presencasController = require('../controllers/presencas.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validarIdsDaRota } = require('../middlewares/validarIds');

validarIdsDaRota(router);

router.post('/registrar/:id_jogador', authMiddleware, presencasController.registrarPresenca);
router.get('/listar', authMiddleware, presencasController.listarPresencas);

module.exports = router;

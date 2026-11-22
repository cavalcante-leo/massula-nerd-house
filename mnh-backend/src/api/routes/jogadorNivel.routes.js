const express = require('express');

const router = express.Router();
const jogadorNivelController = require('../controllers/jogadorNivel.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validarIdsDaRota } = require('../middlewares/validarIds');

validarIdsDaRota(router);

router.get(
  '/jogador/:id_jogador/jogo/:id_jogo',
  authMiddleware,
  jogadorNivelController.obterNivel,
);
router.get(
  '/jogador/:id_jogador',
  authMiddleware,
  jogadorNivelController.listarNiveisPorJogador,
);
router.get(
  '/jogo/:id_jogo',
  authMiddleware,
  jogadorNivelController.listarNiveisPorJogo,
);
router.put(
  '/jogador/:id_jogador/jogo/:id_jogo',
  authMiddleware,
  jogadorNivelController.definirNivel,
);

module.exports = router;

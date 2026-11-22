const express = require('express');

const router = express.Router();
const rankingController = require('../controllers/ranking.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, rankingController.rankingGeral);

module.exports = router;

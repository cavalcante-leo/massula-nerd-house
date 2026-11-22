const nivelJogoService = require('../services/nivelJogo.service');
const { Jogo } = require('../models');
const { responderErro } = require('../../helpers/erros');

const validarNivel = (nivel) => Number.isInteger(Number(nivel)) && Number(nivel) >= 1;

const validarModelo = (modelo) => {
  if (modelo === undefined || modelo === null) return true;
  return typeof modelo === 'string' && modelo.length <= 255;
};

// CREATE
exports.registrar = async (req, res) => {
  try {
    const { id_jogo, nivel, modelo } = req.body;
    const criado_por = req.usuario.id;

    if (!id_jogo) {
      return res.status(400).json({ erro: 'id_jogo é obrigatório.' });
    }
    if (!validarNivel(nivel)) {
      return res.status(400).json({ erro: 'Nível deve ser um inteiro >= 1.' });
    }
    if (!validarModelo(modelo)) {
      return res.status(400).json({ erro: 'Modelo deve ter no máximo 255 caracteres.' });
    }

    const jogo = await Jogo.findByPk(id_jogo);
    if (!jogo) {
      return res.status(404).json({ erro: 'Jogo não encontrado.' });
    }

    const existente = await nivelJogoService.encontrarPorJogoENivel(id_jogo, Number(nivel));
    if (existente) {
      return res.status(409).json({ erro: 'Já existe um nível com esse número para este jogo.' });
    }

    const nivelJogo = await nivelJogoService.criarNivel({
      id_jogo,
      nivel: Number(nivel),
      modelo,
      criado_por,
    });

    return res.status(201).json({
      id: nivelJogo.id,
      id_jogo: nivelJogo.id_jogo,
      nivel: nivelJogo.nivel,
      modelo: nivelJogo.modelo,
      ativo: nivelJogo.ativo,
      criado_por: nivelJogo.criado_por,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ erro: 'Já existe um nível com esse número para este jogo.' });
    }
    return responderErro(res, err, 'Erro ao registrar nível.');
  }
};

// GET por jogo
exports.listarPorJogo = async (req, res) => {
  try {
    const { id_jogo } = req.params;
    const jogo = await Jogo.findByPk(id_jogo);
    if (!jogo) {
      return res.status(404).json({ erro: 'Jogo não encontrado.' });
    }

    const filtros = {};
    if (req.query.ativo === 'true' || req.query.ativo === '1') filtros.ativo = true;
    else if (req.query.ativo === 'false' || req.query.ativo === '0') filtros.ativo = false;

    const niveis = await nivelJogoService.encontrarNiveisPorJogo(id_jogo, filtros);
    return res.status(200).json(niveis);
  } catch (err) {
    return responderErro(res, err, 'Erro ao listar níveis.');
  }
};

// GET by ID
exports.obterPorID = async (req, res) => {
  try {
    const { id } = req.params;
    const nivel = await nivelJogoService.encontrarNivel(id);
    if (!nivel) {
      return res.status(404).json({ erro: 'Nível não encontrado.' });
    }
    return res.status(200).json(nivel);
  } catch (err) {
    return responderErro(res, err, 'Erro ao buscar nível.');
  }
};

// UPDATE
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nivel, modelo, ativo } = req.body;
    const atualizado_por = req.usuario.id;

    const existente = await nivelJogoService.encontrarNivel(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Nível não encontrado.' });
    }

    if (nivel !== undefined && !validarNivel(nivel)) {
      return res.status(400).json({ erro: 'Nível deve ser um inteiro >= 1.' });
    }
    if (!validarModelo(modelo)) {
      return res.status(400).json({ erro: 'Modelo deve ter no máximo 255 caracteres.' });
    }

    if (nivel !== undefined && Number(nivel) !== existente.nivel) {
      const duplicado = await nivelJogoService.encontrarPorJogoENivel(
        existente.id_jogo,
        Number(nivel),
        existente.id
      );
      if (duplicado) {
        return res.status(409).json({ erro: 'Já existe um nível com esse número para este jogo.' });
      }
    }

    const atualizado = await nivelJogoService.atualizarNivel(
      id,
      {
        nivel: nivel !== undefined ? Number(nivel) : undefined,
        modelo,
        ativo,
      },
      atualizado_por
    );

    return res.status(200).json({
      sucesso: 'Nível atualizado com sucesso.',
      nivel: {
        id: atualizado.id,
        id_jogo: atualizado.id_jogo,
        nivel: atualizado.nivel,
        modelo: atualizado.modelo,
        ativo: atualizado.ativo,
      },
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ erro: 'Já existe um nível com esse número para este jogo.' });
    }
    return responderErro(res, err, 'Erro ao atualizar nível.');
  }
};

// SOFT DELETE
exports.desativar = async (req, res) => {
  try {
    const { id } = req.params;
    const nivel = await nivelJogoService.encontrarNivel(id);

    if (!nivel) {
      return res.status(404).json({ erro: 'Nível não encontrado.' });
    }
    if (!nivel.ativo) {
      return res.status(409).json({ erro: 'Nível já está desativado.' });
    }

    const vinculados = await nivelJogoService.contarJogadoresVinculados(id);
    if (vinculados > 0) {
      return res.status(409).json({
        erro: `Nível possui ${vinculados} jogador(es) vinculado(s). Mova-os para outro nível antes de desativar.`,
      });
    }

    await nivelJogoService.atualizarNivel(id, { ativo: false }, req.usuario.id);
    return res.status(200).json({ sucesso: 'Nível desativado com sucesso.' });
  } catch (err) {
    return responderErro(res, err, 'Erro ao desativar nível.');
  }
};

// REATIVAR
exports.reativar = async (req, res) => {
  try {
    const { id } = req.params;
    const nivel = await nivelJogoService.encontrarNivel(id);

    if (!nivel) {
      return res.status(404).json({ erro: 'Nível não encontrado.' });
    }
    if (nivel.ativo) {
      return res.status(409).json({ erro: 'Nível já está ativo.' });
    }

    await nivelJogoService.atualizarNivel(id, { ativo: true }, req.usuario.id);
    return res.status(200).json({ sucesso: 'Nível reativado com sucesso.' });
  } catch (err) {
    return responderErro(res, err, 'Erro ao reativar nível.');
  }
};

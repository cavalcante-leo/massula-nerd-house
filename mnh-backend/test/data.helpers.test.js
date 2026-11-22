const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validarData, paraDataBanco, formatarParaBanco, validarInstante, intervaloDoPeriodo, hojeNoClube,
} = require('../src/helpers/data.helpers');

describe('validarData (dd/mm/aaaa)', () => {
  it('aceita datas reais, com 1 ou 2 dígitos em dia e mês', () => {
    for (const d of ['10/11/2026', '1/2/2026', '31/12/2026', '29/02/2024']) {
      assert.equal(validarData(d), true, d);
    }
  });

  it('rejeita datas que não existem no calendário', () => {
    for (const d of ['31/02/2026', '29/02/2026', '30/02/2024', '31/04/2026', '00/01/2026', '01/13/2026', '01/00/2026']) {
      assert.equal(validarData(d), false, d);
    }
  });

  it('rejeita formatos errados e tipos não-string sem lançar erro', () => {
    for (const d of ['2026-11-10', '10-11-2026', '10/11/26', ' 10/11/2026', '10/11/2026x', 'abc', '', null, undefined, 20261110, {}]) {
      assert.equal(validarData(d), false, String(d));
    }
  });
});

describe('paraDataBanco', () => {
  it('converte dd/mm/aaaa e mantém AAAA-MM-DD', () => {
    assert.equal(paraDataBanco('1/2/2026'), '2026-02-01');
    assert.equal(paraDataBanco('2026-02-01'), '2026-02-01');
    assert.equal(formatarParaBanco('10/11/2026'), '2026-11-10');
  });

  it('rejeita datas impossíveis nos dois formatos', () => {
    assert.equal(paraDataBanco('31/02/2026'), null);
    assert.equal(paraDataBanco('2026-02-31'), null);
  });
});

describe('validarInstante (ISO 8601 com fuso)', () => {
  it('aceita Z e offset, devolvendo o instante correto', () => {
    assert.equal(validarInstante('2026-11-22T23:00:00.000Z').toISOString(), '2026-11-22T23:00:00.000Z');
    assert.equal(validarInstante('2026-11-22T20:00:00-03:00').toISOString(), '2026-11-22T23:00:00.000Z');
    assert.equal(validarInstante('2026-11-22T20:00-03:00').toISOString(), '2026-11-22T23:00:00.000Z');
  });

  it('rejeita instante sem fuso, data impossível, só data e não-string', () => {
    for (const v of ['2026-11-22T20:00', '2026-11-22T20:00:00', '2026-02-31T10:00:00Z', '2026-11-22', '2026-11-22T24:00:00Z', 'abc', null, 1763852400000]) {
      assert.equal(validarInstante(v), null, String(v));
    }
  });
});

describe('fuso do clube (-03:00)', () => {
  it('hojeNoClube: 01:00 UTC ainda é o dia anterior em Brasília', () => {
    assert.equal(hojeNoClube(new Date('2026-11-23T01:00:00Z')), '2026-11-22');
    assert.equal(hojeNoClube(new Date('2026-11-23T03:00:00Z')), '2026-11-23');
  });

  it('intervaloDoPeriodo: dias viram [00:00 BRT do início, 00:00 BRT do dia seguinte ao fim)', () => {
    const p = intervaloDoPeriodo('2026-11-01', '01/11/2026');
    assert.equal(p.desde.toISOString(), '2026-11-01T03:00:00.000Z');
    assert.equal(p.ateExclusivo.toISOString(), '2026-11-02T03:00:00.000Z');
  });

  it('intervaloDoPeriodo: limites opcionais, instante com fuso e virada de mês/ano', () => {
    assert.deepEqual(intervaloDoPeriodo(undefined, undefined), { desde: null, ateExclusivo: null });
    assert.equal(intervaloDoPeriodo(undefined, '31/12/2026').ateExclusivo.toISOString(), '2027-01-01T03:00:00.000Z');
    assert.equal(intervaloDoPeriodo('2026-11-01T10:00:00Z').desde.toISOString(), '2026-11-01T10:00:00.000Z');
  });

  it('intervaloDoPeriodo: limite inválido devolve null', () => {
    assert.equal(intervaloDoPeriodo('2026-02-31', undefined), null);
    assert.equal(intervaloDoPeriodo(undefined, '2026-11-01T10:00'), null);
  });
});

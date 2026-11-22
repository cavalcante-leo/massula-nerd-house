const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validarData, paraDataBanco, formatarParaBanco,
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

const formatarParaExibicao = (date) => {
    if (!date) return null
    const d = new Date(date)
    const dia = String(d.getUTCDate()).padStart(2, '0')
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
    const ano = d.getUTCFullYear()
    return `${dia}/${mes}/${ano}`
}

const formatarParaBanco = (dataString) => {
    if (!dataString) return null
    const [dia, mes, ano] = dataString.split('/')
    if (!dia || !mes || !ano) return null
    return `${ano}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`
}

const converterParaDate = (dataString) => {
    if (!dataString) return null
    const [dia, mes, ano] = dataString.split('/')
    if (!dia || !mes || !ano) return null
    return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)))
}

// O Date "corrige" datas impossíveis (31/02 vira 03/03); reconstruir e comparar as
// partes é o que revela que a data não existe no calendário.
const dataExiste = (ano, mes, dia) => {
    if (ano < 1 || mes < 1 || mes > 12 || dia < 1) return false
    const d = new Date(Date.UTC(ano, mes - 1, dia))
    return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia
}

// dd/mm/aaaa (dia e mês com 1 ou 2 dígitos), existente no calendário.
const validarData = (dataString) => {
    if (typeof dataString !== 'string') return false
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dataString)
    if (!m) return false
    return dataExiste(Number(m[3]), Number(m[2]), Number(m[1]))
}

// Data de calendário no formato do banco (AAAA-MM-DD), existente no calendário.
const dataIsoValida = (valor) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
    if (!m) return false
    return dataExiste(Number(m[1]), Number(m[2]), Number(m[3]))
}

// Converte dd/mm/aaaa ou AAAA-MM-DD para a string AAAA-MM-DD que colunas DATE recebem.
// Use string (e não Date) em colunas DATEONLY: o Sequelize formata um Date no fuso
// local do processo, e meia-noite UTC vira o dia anterior num servidor em BRT.
const paraDataBanco = (valor) => {
    if (typeof valor !== 'string') return null
    if (dataIsoValida(valor)) return valor
    if (validarData(valor)) return formatarParaBanco(valor)
    return null
}

// Instante ISO 8601 **com fuso** (`Z` ou `±hh:mm`), ex.: 2026-11-22T23:00:00.000Z.
// Sem fuso, o JS interpreta no fuso do servidor (UTC no Render) e a partida fica 3h deslocada.
// Retorna o Date ou null.
const INSTANTE_ISO = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-](0\d|1[0-4]):[0-5]\d)$/
const validarInstante = (valor) => {
    if (typeof valor !== 'string') return null
    const m = INSTANTE_ISO.exec(valor)
    if (!m || !dataIsoValida(m[1])) return null
    const d = new Date(valor)
    return Number.isNaN(d.getTime()) ? null : d
}

const dataEhFutura = (dataString) => {
    if (!validarData(dataString)) return false
    return converterParaDate(dataString) > new Date()
}

const dataEhPassada = (dataString) => {
    if (!validarData(dataString)) return false
    return converterParaDate(dataString) < new Date()
}

const datasIguais = (dataStringA, dataStringB) => {
    if (!validarData(dataStringA) || !validarData(dataStringB)) return false
    return converterParaDate(dataStringA).toDateString() === converterParaDate(dataStringB).toDateString()
}

const hojeFormatado = () => {
    return new Date().toLocaleDateString('pt-BR')
}

module.exports = {
    formatarParaExibicao,
    formatarParaBanco,
    converterParaDate,
    paraDataBanco,
    validarInstante,
    validarData,
    dataEhFutura,
    dataEhPassada,
    datasIguais,
    hojeFormatado
}
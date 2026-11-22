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

// Fuso do clube. O Brasil não tem horário de verão desde 2019, então o offset é fixo.
// "Dia" (presença, filtros de período) é sempre o dia de calendário neste fuso.
const FUSO_CLUBE = '-03:00'
const OFFSET_CLUBE_MS = -3 * 60 * 60 * 1000

// Hoje no fuso do clube, como AAAA-MM-DD.
const hojeNoClube = (agora = new Date()) => new Date(agora.getTime() + OFFSET_CLUBE_MS).toISOString().slice(0, 10)

const diaSeguinte = (diaBanco) => {
    const d = new Date(`${diaBanco}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10)
}

const inicioDoDiaNoClube = (diaBanco) => new Date(`${diaBanco}T00:00:00${FUSO_CLUBE}`)

/**
 * Período para filtrar instantes (ex.: partida.jogada_em).
 * Cada limite aceita um dia (dd/mm/aaaa ou AAAA-MM-DD, interpretado no fuso do clube)
 * ou um instante ISO com fuso. O dia final entra inteiro.
 *
 * Retorna `{ desde, ateExclusivo }` (Dates ou null = sem limite) ou `null` se algum
 * limite informado for inválido.
 */
const intervaloDoPeriodo = (inicio, fim) => {
    let desde = null
    let ateExclusivo = null
    if (inicio !== undefined && inicio !== '') {
        const dia = paraDataBanco(inicio)
        desde = dia ? inicioDoDiaNoClube(dia) : validarInstante(inicio)
        if (!desde) return null
    }
    if (fim !== undefined && fim !== '') {
        const dia = paraDataBanco(fim)
        if (dia) {
            ateExclusivo = inicioDoDiaNoClube(diaSeguinte(dia))
        } else {
            const instante = validarInstante(fim)
            if (!instante) return null
            ateExclusivo = new Date(instante.getTime() + 1)
        }
    }
    return { desde, ateExclusivo }
}

// Data dd/mm/aaaa depois de hoje, no fuso do clube (não no fuso do servidor nem em UTC).
const dataEhFutura = (dataString) => {
    if (!validarData(dataString)) return false
    return formatarParaBanco(dataString) > hojeNoClube()
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
    FUSO_CLUBE,
    hojeNoClube,
    intervaloDoPeriodo,
    validarData,
    dataEhFutura,
    dataEhPassada,
    datasIguais,
    hojeFormatado
}
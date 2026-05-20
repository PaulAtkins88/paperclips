import type { GameState } from '../game'

export type InvestmentRiskMode = 'low' | 'med' | 'hi'

export interface StockPosition {
  id: number
  symbol: string
  price: number
  amount: number
  total: number
  profit: number
  age: number
}

export const INITIAL_INVEST_UPGRADE_COST = 100
export const INITIAL_STOCK_GAIN_THRESHOLD = 0.5
export const INITIAL_MAX_PORTFOLIO_SIZE = 5

const PORTFOLIO_TICK_MS = 100
const STOCK_SHOP_TICK_MS = 1_000
const STOCK_MARKET_TICK_MS = 2_500
const MAX_STOCK_AMOUNT = 1_000_000
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function syncInvestmentState(state: GameState): GameState {
  const secTotal = state.investment.stocks.reduce((total, stock) => total + stock.total, 0)
  const portfolioSize = state.investment.stocks.length

  return {
    ...state,
    investment: {
      ...state.investment,
      riskiness: getRiskinessForMode(state.investment.riskMode),
      secTotal,
      portfolioSize,
      portTotal: state.investment.bankroll + secTotal,
    },
  }
}

export function runInvestmentTick(state: GameState, deltaMs: number, random: () => number): GameState {
  let next = syncInvestmentState(state)

  if (next.paused || !next.investment.unlocked) {
    return next
  }

  let portfolioTickMs = next.investment.portfolioTickMs + deltaMs
  let stockShopTickMs = next.investment.stockShopTickMs + deltaMs
  let stockMarketTickMs = next.investment.stockMarketTickMs + deltaMs
  let stockReportCounter = next.investment.stockReportCounter

  while (portfolioTickMs >= PORTFOLIO_TICK_MS) {
    portfolioTickMs -= PORTFOLIO_TICK_MS
    stockReportCounter += 1
    next = syncInvestmentState(next)
  }

  while (stockShopTickMs >= STOCK_SHOP_TICK_MS) {
    stockShopTickMs -= STOCK_SHOP_TICK_MS
    next = syncInvestmentState(stockShop(next, random))
  }

  while (stockMarketTickMs >= STOCK_MARKET_TICK_MS) {
    stockMarketTickMs -= STOCK_MARKET_TICK_MS
    next = syncInvestmentState(updateStocks(next, random))
  }

  return {
    ...next,
    investment: {
      ...next.investment,
      portfolioTickMs,
      stockShopTickMs,
      stockMarketTickMs,
      stockReportCounter,
    },
  }
}

export function investDeposit(state: GameState): GameState {
  if (!state.investment.unlocked || state.production.funds <= 0) {
    return state
  }

  const deposited = Math.floor(state.production.funds)

  if (deposited <= 0) {
    return state
  }

  return syncInvestmentState({
    ...state,
    production: {
      ...state.production,
      funds: 0,
    },
    investment: {
      ...state.investment,
      bankroll: Math.floor(state.investment.bankroll + state.production.funds),
      ledger: state.investment.ledger - deposited,
    },
    lastAction: 'Deposited funds into the investment engine',
  })
}

export function investWithdraw(state: GameState): GameState {
  if (!state.investment.unlocked || state.investment.bankroll <= 0) {
    return state
  }

  return syncInvestmentState({
    ...state,
    production: {
      ...state.production,
      funds: state.production.funds + state.investment.bankroll,
    },
    investment: {
      ...state.investment,
      bankroll: 0,
      ledger: state.investment.ledger + state.investment.bankroll,
    },
    lastAction: 'Withdrew funds from the investment engine',
  })
}

export function setInvestmentRiskMode(state: GameState, riskMode: InvestmentRiskMode): GameState {
  return syncInvestmentState({
    ...state,
    investment: {
      ...state.investment,
      riskMode,
    },
    lastAction: `Set investment risk to ${riskMode}`,
  })
}

export function cycleInvestmentRiskMode(state: GameState): GameState {
  const nextRiskMode: Record<InvestmentRiskMode, InvestmentRiskMode> = {
    low: 'med',
    med: 'hi',
    hi: 'low',
  }

  return setInvestmentRiskMode(state, nextRiskMode[state.investment.riskMode])
}

export function investUpgrade(state: GameState): GameState {
  if (!state.investment.unlocked || state.strategy.yomi < state.investment.investUpgradeCost) {
    return state
  }

  const investLevel = state.investment.investLevel + 1

  return syncInvestmentState({
    ...state,
    strategy: {
      ...state.strategy,
      yomi: state.strategy.yomi - state.investment.investUpgradeCost,
    },
    investment: {
      ...state.investment,
      investLevel,
      stockGainThreshold: state.investment.stockGainThreshold + 0.01,
      investUpgradeCost: Math.floor(Math.pow(investLevel + 1, Math.E) * 100),
    },
    lastAction: 'Upgraded the investment engine',
  })
}

function stockShop(state: GameState, random: () => number): GameState {
  const { bankroll, portTotal, portfolioSize, maxPort, riskiness } = state.investment
  let budget = Math.ceil(portTotal / riskiness)
  const reserveFactor = 11 - riskiness
  const reserves = riskiness === 1 ? 0 : Math.ceil(portTotal / reserveFactor)

  if (riskiness === 1 && bankroll - budget < reserves && bankroll > portTotal / 10) {
    budget = bankroll
  } else if (riskiness === 1 && bankroll - budget < reserves) {
    budget = 0
  } else if (bankroll - budget < reserves) {
    budget = bankroll - reserves
  }

  if (portfolioSize >= maxPort || bankroll < 5 || budget < 1 || bankroll - budget < reserves || random() >= 0.25) {
    return state
  }

  return buyRandomStock(state, budget, random)
}

function updateStocks(state: GameState, random: () => number): GameState {
  let bankroll = state.investment.bankroll
  let stocks = state.investment.stocks.map((stock) => ({ ...stock }))
  let sellDelay = state.investment.sellDelay + 1

  if (stocks.length > 0 && sellDelay >= 5 && random() <= 0.3) {
    bankroll += stocks[0].total
    stocks = stocks.slice(1)
    sellDelay = 0
  }

  stocks = stocks.map((stock) => updateStockPrice(stock, state.investment.stockGainThreshold, state.investment.riskiness, random))

  return {
    ...state,
    investment: {
      ...state.investment,
      bankroll,
      stocks,
      sellDelay,
    },
  }
}

function buyRandomStock(state: GameState, dollars: number, random: () => number): GameState {
  const symbol = generateSymbol(random)
  const roll = random()
  let price = generateInitialPrice(roll, random)

  if (price > dollars) {
    price = Math.max(1, Math.ceil(dollars * random()))
  }

  const amount = Math.min(MAX_STOCK_AMOUNT, Math.floor(dollars / price))

  if (amount < 1) {
    return state
  }

  const total = price * amount

  return {
    ...state,
    investment: {
      ...state.investment,
      bankroll: state.investment.bankroll - total,
      stockId: state.investment.stockId + 1,
      stocks: [
        ...state.investment.stocks,
        {
          id: state.investment.stockId + 1,
          symbol,
          price,
          amount,
          total,
          profit: 0,
          age: 0,
        },
      ],
    },
  }
}

function updateStockPrice(stock: StockPosition, stockGainThreshold: number, riskiness: number, random: () => number): StockPosition {
  const next = { ...stock, age: stock.age + 1 }

  if (random() >= 0.6) {
    return next
  }

  const gain = !(random() > stockGainThreshold)
  const delta = Math.ceil((random() * next.price) / (4 * riskiness))

  next.price = gain ? next.price + delta : next.price - delta
  if (next.price === 0 && random() > 0.24) {
    next.price = 1
  }

  next.total = next.price * next.amount
  next.profit += (gain ? delta : -delta) * next.amount

  return next
}

function generateSymbol(random: () => number): string {
  const roll = random()
  const length = roll <= 0.01 ? 1 : roll <= 0.1 ? 2 : roll <= 0.4 ? 3 : 4

  return Array.from({ length }, () => ALPHABET[Math.floor(random() * ALPHABET.length)] ?? 'A').join('')
}

function generateInitialPrice(roll: number, random: () => number): number {
  if (roll > 0.99) {
    return Math.max(1, Math.ceil(random() * 3000))
  }

  if (roll > 0.85) {
    return Math.max(1, Math.ceil(random() * 500))
  }

  if (roll > 0.6) {
    return Math.max(1, Math.ceil(random() * 150))
  }

  if (roll > 0.2) {
    return Math.max(1, Math.ceil(random() * 50))
  }

  return Math.max(1, Math.ceil(random() * 15))
}

function getRiskinessForMode(riskMode: InvestmentRiskMode): number {
  switch (riskMode) {
    case 'low':
      return 7
    case 'med':
      return 5
    case 'hi':
      return 1
    default:
      return 5
  }
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { StrategyStyle } from './types'

export type Language = 'en' | 'ru'

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
]

const STORAGE_KEY = 'cac.language'

export type Dict = {
  appTitle: string
  exportJson: string
  exportYaml: string
  generate: string
  generating: string
  creating: string
  simulating: string
  company: string
  name: string
  industry: string
  teamSize: string
  goals: string
  strategyStyle: string
  departments: string
  rolesLabel: string
  addSales: string
  addMarketing: string
  addSupport: string
  addCustom: string
  simulation: string
  whatIfLabel: string
  whatIfPlaceholder: string
  runSimulation: string
  createCompanyFirst: string
  aiOutput: string
  emptyOutput: string
  tabPlaybooks: string
  tabWorkflows: string
  tabSops: string
  tabOrg: string
  tabInsights: string
  tabSimulation: string
  noPlaybooks: string
  noWorkflows: string
  noSops: string
  noOrg: string
  noBottlenecks: string
  noOptimizations: string
  runSimFromLeft: string
  bottlenecks: string
  optimizations: string
  scenario: string
  impacts: string
  recommendations: string
  triggers: string
  purpose: string
  owner: string
  removeAria: string
  language: string
  strategyOptions: Record<StrategyStyle, string>
  examples: string[]
  defaults: {
    companyName: string
    industry: string
    size: string
    goals: string
    sales: string
    marketing: string
    support: string
    rolesHeadOfSales: string
    rolesAE: string
    rolesSDR: string
    rolesHeadOfMarketing: string
    rolesContentLead: string
    rolesGrowth: string
    rolesHeadOfSupport: string
    rolesCSM: string
    rolesLead: string
    deptNew: string
  }
}

const en: Dict = {
  appTitle: 'Company-as-Code',
  exportJson: 'Export JSON',
  exportYaml: 'Export YAML',
  generate: 'Generate',
  generating: 'Generating…',
  creating: 'Creating…',
  simulating: 'Simulating…',
  company: 'Company',
  name: 'Name',
  industry: 'Industry',
  teamSize: 'Team size',
  goals: 'Goals',
  strategyStyle: 'Strategy style',
  departments: 'Departments',
  rolesLabel: 'Roles (comma-separated)',
  addSales: '+ Sales',
  addMarketing: '+ Marketing',
  addSupport: '+ Support',
  addCustom: '+ Custom',
  simulation: 'Simulation',
  whatIfLabel: 'What happens if…',
  whatIfPlaceholder: "Describe a scenario, e.g. 'We lose our top sales rep next month'",
  runSimulation: 'Run simulation',
  createCompanyFirst: 'Create a company first.',
  aiOutput: 'AI Output',
  emptyOutput:
    'Define your company, then click Generate to produce playbooks, workflows, SOPs, org structure, and optimization ideas.',
  tabPlaybooks: 'playbooks',
  tabWorkflows: 'workflows',
  tabSops: 'sops',
  tabOrg: 'org',
  tabInsights: 'insights',
  tabSimulation: 'simulation',
  noPlaybooks: 'No playbooks yet.',
  noWorkflows: 'No workflows yet.',
  noSops: 'No SOPs yet.',
  noOrg: 'No org structure yet.',
  noBottlenecks: 'None identified.',
  noOptimizations: 'None yet.',
  runSimFromLeft: 'Run a simulation from the left panel.',
  bottlenecks: 'Bottlenecks',
  optimizations: 'Optimization ideas',
  scenario: 'Scenario',
  impacts: 'Impacts',
  recommendations: 'Recommendations',
  triggers: 'Triggers',
  purpose: 'Purpose',
  owner: 'owner',
  removeAria: 'remove',
  language: 'Language',
  strategyOptions: {
    'aggressive-growth': 'Aggressive Growth',
    'lean-efficiency': 'Lean Efficiency',
    'customer-obsessed': 'Customer-Obsessed',
    'product-led': 'Product-Led',
    'enterprise-sales': 'Enterprise Sales',
  },
  examples: [
    'Lose our top sales rep next month',
    'Marketing budget cut by 40% for Q2',
    'Support team grows 3x in 6 months',
    'Launch a new enterprise tier',
  ],
  defaults: {
    companyName: 'Acme Robotics',
    industry: 'B2B SaaS',
    size: '25',
    goals: 'Reach $1M ARR in 12 months; expand into EU; double self-serve signups.',
    sales: 'Sales',
    marketing: 'Marketing',
    support: 'Support',
    rolesHeadOfSales: 'Head of Sales',
    rolesAE: 'AE',
    rolesSDR: 'SDR',
    rolesHeadOfMarketing: 'Head of Marketing',
    rolesContentLead: 'Content Lead',
    rolesGrowth: 'Growth',
    rolesHeadOfSupport: 'Head of Support',
    rolesCSM: 'CSM',
    rolesLead: 'Lead',
    deptNew: 'New Department',
  },
}

const ru: Dict = {
  appTitle: 'Компания-как-Код',
  exportJson: 'Экспорт JSON',
  exportYaml: 'Экспорт YAML',
  generate: 'Сгенерировать',
  generating: 'Генерация…',
  creating: 'Создаём…',
  simulating: 'Симуляция…',
  company: 'Компания',
  name: 'Название',
  industry: 'Индустрия',
  teamSize: 'Размер команды',
  goals: 'Цели',
  strategyStyle: 'Стратегия',
  departments: 'Отделы',
  rolesLabel: 'Роли (через запятую)',
  addSales: '+ Продажи',
  addMarketing: '+ Маркетинг',
  addSupport: '+ Поддержка',
  addCustom: '+ Свой',
  simulation: 'Симуляция',
  whatIfLabel: 'Что, если…',
  whatIfPlaceholder: 'Опишите сценарий, например «Мы теряем ведущего продавца в следующем месяце»',
  runSimulation: 'Запустить симуляцию',
  createCompanyFirst: 'Сначала создайте компанию.',
  aiOutput: 'AI-результат',
  emptyOutput:
    'Опишите компанию и нажмите «Сгенерировать», чтобы получить плейбуки, воркфлоу, SOP, оргструктуру и идеи оптимизации.',
  tabPlaybooks: 'плейбуки',
  tabWorkflows: 'воркфлоу',
  tabSops: 'SOP',
  tabOrg: 'оргструктура',
  tabInsights: 'инсайты',
  tabSimulation: 'симуляция',
  noPlaybooks: 'Пока нет плейбуков.',
  noWorkflows: 'Пока нет воркфлоу.',
  noSops: 'Пока нет SOP.',
  noOrg: 'Пока нет оргструктуры.',
  noBottlenecks: 'Не выявлено.',
  noOptimizations: 'Пока пусто.',
  runSimFromLeft: 'Запустите симуляцию в левой панели.',
  bottlenecks: 'Узкие места',
  optimizations: 'Идеи оптимизации',
  scenario: 'Сценарий',
  impacts: 'Последствия',
  recommendations: 'Рекомендации',
  triggers: 'Триггеры',
  purpose: 'Цель',
  owner: 'владелец',
  removeAria: 'удалить',
  language: 'Язык',
  strategyOptions: {
    'aggressive-growth': 'Агрессивный рост',
    'lean-efficiency': 'Экономная эффективность',
    'customer-obsessed': 'Клиенто-ориентированная',
    'product-led': 'Продуктовая',
    'enterprise-sales': 'Enterprise-продажи',
  },
  examples: [
    'Теряем ведущего продавца в следующем месяце',
    'Маркетинговый бюджет урезан на 40% во 2-м квартале',
    'Команда поддержки вырастает в 3 раза за 6 месяцев',
    'Запускаем новый enterprise-тариф',
  ],
  defaults: {
    companyName: 'Акме Роботикс',
    industry: 'B2B SaaS',
    size: '25',
    goals: 'Достичь $1M ARR за 12 месяцев; выйти на рынок EU; удвоить self-serve регистрации.',
    sales: 'Продажи',
    marketing: 'Маркетинг',
    support: 'Поддержка',
    rolesHeadOfSales: 'Руководитель отдела продаж',
    rolesAE: 'Account Executive',
    rolesSDR: 'SDR',
    rolesHeadOfMarketing: 'Руководитель маркетинга',
    rolesContentLead: 'Контент-лид',
    rolesGrowth: 'Growth-менеджер',
    rolesHeadOfSupport: 'Руководитель поддержки',
    rolesCSM: 'Customer Success Manager',
    rolesLead: 'Руководитель',
    deptNew: 'Новый отдел',
  },
}

export const DICTS: Record<Language, Dict> = { en, ru }

export function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored && (stored === 'en' || stored === 'ru')) return stored
  const nav = window.navigator.language || 'en'
  return nav.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

interface I18nContextValue {
  lang: Language
  t: Dict
  setLang: (l: Language) => void
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  t: en,
  setLang: () => {},
})

export function useI18n() {
  return useContext(I18nContext)
}

export function useLanguageState() {
  const [lang, setLangState] = useState<Language>(() => detectInitialLanguage())
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
      document.documentElement.lang = lang
    } catch {
      /* no-op */
    }
  }, [lang])
  const setLang = useCallback((l: Language) => setLangState(l), [])
  return { lang, setLang, t: DICTS[lang] }
}

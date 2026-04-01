import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { getPostByCampaignAndDay, getCampaignPostHooks, getCampaignPostSummaries } from '@/features/posts/services/post-service'
import { getPillarById } from '@/features/pillars/services/pillar-service'
import { PostEditorClient } from './client'
import type { FunnelStage } from '@/shared/types/content-ops'

export const metadata = { title: 'Post Editor | ContentOps' }

interface Props {
  params: Promise<{ id: string; day: string }>
}

// ---------------------------------------------------------------------------
// Funnel stage classification for context filtering
// ---------------------------------------------------------------------------

type StageCategory = 'problem' | 'solution' | 'conversion'

function getStageCategory(stage: FunnelStage): StageCategory {
  if (stage === 'tofu_problem' || stage === 'mofu_problem') return 'problem'
  if (stage === 'tofu_solution' || stage === 'mofu_solution') return 'solution'
  return 'conversion' // bofu_conversion
}

// ---------------------------------------------------------------------------
// Day-specific context builder
// ---------------------------------------------------------------------------

/**
 * Builds a DIFFERENT topicContext string depending on the funnel stage of this day.
 *
 * - PROBLEM days (TOFU/MOFU Problema): Focus on hypothesis, anti_myth, failure_modes, enemy
 * - SOLUTION days (TOFU/MOFU Solucion): Focus on solution_framework, evidence, benefits
 * - CONVERSION day (BOFU): Focus on business impact, solution + CTA context, social proof
 *
 * Each day also receives ONLY its corresponding content_angle (indexed by day_of_week).
 */
function buildDaySpecificContext(
  topics: NonNullable<Awaited<ReturnType<typeof getCampaignById>>['data']>['topics'],
  dayOfWeek: number,
  funnelStage: FunnelStage,
): string | undefined {
  if (!topics) return undefined

  const category = getStageCategory(funnelStage)
  const angles = topics.content_angles ?? []
  const dataPoints = topics.key_data_points ?? []
  const solution = topics.solution_framework

  // Select the specific angle for this day (1-indexed dayOfWeek → 0-indexed array)
  const dayAngle = angles[dayOfWeek - 1]
  const otherAngles = angles.filter((_, i) => i !== dayOfWeek - 1)

  const sections: string[] = []

  // -- SHARED: Always include source context and audience --
  if (topics.source_context) {
    sections.push(`Contexto verificado del tema:\n${topics.source_context}`)
  }
  if (topics.target_audience) {
    sections.push(`Audiencia objetivo: ${topics.target_audience}`)
  }
  if (topics.market_context) {
    sections.push(`Contexto de mercado: ${topics.market_context}`)
  }

  // -- DAY-SPECIFIC ANGLE --
  if (dayAngle) {
    sections.push(`## ANGULO PARA ESTE POST (DIA ${dayOfWeek})\n${dayAngle}\n\nIMPORTANTE: Este post DEBE seguir este angulo especifico. Los otros dias de la campana cubren angulos diferentes.`)
  }

  // -- CATEGORY-SPECIFIC SECTIONS --
  if (category === 'problem') {
    // PROBLEM DAYS: emphasize what's wrong, the enemy, the myth
    if (topics.hypothesis) {
      sections.push(`Hipotesis contrarian (CENTRAL para este post):\n${topics.hypothesis}`)
    }
    if (topics.anti_myth) {
      sections.push(`Mito a derribar: ${topics.anti_myth}`)
    }
    if (topics.silent_enemy_name) {
      sections.push(`Enemigo silencioso: ${topics.silent_enemy_name}`)
    }
    if (topics.failure_modes && topics.failure_modes.length > 0) {
      sections.push(`Modos de falla concretos:\n${topics.failure_modes.map(f => `- ${f}`).join('\n')}`)
    }
    if (topics.evidence) {
      sections.push(`Evidencia del problema:\n${topics.evidence}`)
    }
    if (dataPoints.length > 0) {
      sections.push(`Datos verificados del PROBLEMA:\n${dataPoints.map(d => `- ${d.stat} (Fuente: ${d.source})`).join('\n')}`)
    }
    // Mention solution exists but don't elaborate (tease for next days)
    if (solution) {
      sections.push(`(Nota: la solucion "${solution.name}" se presentara en posts posteriores de esta campana. En este post, SOLO habla del PROBLEMA, no de la solucion.)`)
    }
  } else if (category === 'solution') {
    // SOLUTION DAYS: emphasize what we propose and why it works
    if (solution) {
      sections.push(`## SOLUCION PROPUESTA (CENTRAL para este post)\nNombre: ${solution.name}\nMecanismo: ${solution.mechanism}\nBeneficios:\n${solution.benefits.map(b => `- ${b}`).join('\n')}\nImplementacion: ${solution.implementation}`)
    }
    if (topics.evidence) {
      sections.push(`Evidencia que soporta la solucion:\n${topics.evidence}`)
    }
    if (dataPoints.length > 0) {
      sections.push(`Datos verificados de la SOLUCION:\n${dataPoints.map(d => `- ${d.stat} (Fuente: ${d.source}) — ${d.context}`).join('\n')}`)
    }
    if (topics.minimal_proof) {
      sections.push(`Fuentes verificadas:\n${topics.minimal_proof}`)
    }
    // Briefly reference the problem for context
    if (topics.silent_enemy_name) {
      sections.push(`(Contexto: este post responde al problema "${topics.silent_enemy_name}" presentado en posts anteriores de la campana. NO repitas el diagnostico del problema — enfocate en la SOLUCION.)`)
    }
  } else {
    // CONVERSION DAY: business impact + solution + CTA urgency
    if (topics.expected_business_impact) {
      sections.push(`Impacto de negocio (CENTRAL para este post):\n${topics.expected_business_impact}`)
    }
    if (solution) {
      sections.push(`Solucion propuesta: ${solution.name} — ${solution.mechanism}`)
      if (solution.benefits.length > 0) {
        sections.push(`Beneficios clave:\n${solution.benefits.map(b => `- ${b}`).join('\n')}`)
      }
    }
    if (topics.signals_json.length > 0) {
      sections.push(`Senales del mercado (urgencia):\n${topics.signals_json.map(s => `- ${s}`).join('\n')}`)
    }
    if (dataPoints.length > 0) {
      sections.push(`Datos de impacto:\n${dataPoints.map(d => `- ${d.stat} (Fuente: ${d.source})`).join('\n')}`)
    }
    if (topics.minimal_proof) {
      sections.push(`Fuentes verificadas:\n${topics.minimal_proof}`)
    }
    sections.push(`(Este es el post de CIERRE de la campana. Debe generar accion concreta: agendar demo, contactar, DM. Usa datos de impacto para crear urgencia.)`)
  }

  // -- NARRATIVE AWARENESS: what other days cover --
  if (otherAngles.length > 0) {
    sections.push(`Otros angulos de la campana (para NO repetir):\n${otherAngles.map((a, i) => `- ${a}`).join('\n')}`)
  }

  return sections.filter(Boolean).join('\n\n')
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PostEditorPage({ params }: Props) {
  const { id: campaignId, day: dayStr } = await params
  const dayOfWeek = parseInt(dayStr, 10)

  if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    notFound()
  }

  // Fetch campaign, post, and sibling hooks in parallel
  const [campaignResult, postResult] = await Promise.all([
    getCampaignById(campaignId),
    getPostByCampaignAndDay(campaignId, dayOfWeek),
  ])

  if (!campaignResult.data || !postResult.data) {
    notFound()
  }

  const campaign = campaignResult.data
  const topicTitle = campaign.topics?.title
  const keyword = campaign.keyword ?? undefined
  const weeklyBrief = campaign.weekly_brief ?? undefined

  // Fetch hooks from sibling posts for anti-repetitivity
  const hooksResult = await getCampaignPostHooks(campaignId, postResult.data.id)
  const previousHooks = hooksResult.data ?? []

  // Fetch full content summaries from sibling posts for cross-day diversity
  const summariesResult = await getCampaignPostSummaries(campaignId, postResult.data.id)
  const siblingPosts = summariesResult.data ?? []

  // Build DAY-SPECIFIC context based on funnel stage
  const topicContext = buildDaySpecificContext(
    campaign.topics,
    dayOfWeek,
    postResult.data.funnel_stage,
  )

  // Fetch pillar context if campaign or topic has a pillar assigned
  const pillarId = campaign.pillar_id ?? campaign.topics?.pillar_id
  let pillarContext: string | undefined
  if (pillarId) {
    const pillarResult = await getPillarById(pillarId)
    if (pillarResult.data) {
      pillarContext = `${pillarResult.data.name}${pillarResult.data.description ? ` — ${pillarResult.data.description}` : ''}`
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <PostEditorClient
        post={postResult.data}
        campaignId={campaignId}
        topicTitle={topicTitle}
        keyword={keyword}
        weeklyBrief={weeklyBrief}
        topicContext={topicContext}
        previousHooks={previousHooks}
        siblingPosts={siblingPosts}
        pillarContext={pillarContext}
      />
    </div>
  )
}

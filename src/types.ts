/**
 * BMCLang Types
 * TypeScript interfaces matching the JSON Schema at schemas/bmclang.schema.json
 * See specs/bmclang-mvp.md for full specification
 */

// ============================================================================
// Enums and Type Aliases
// ============================================================================

/** Portfolio position (Osterwalder's Invincible Company) */
export type Portfolio = 'explore' | 'exploit';

/** Stages for explore portfolio */
export type ExploreStage = 'ideation' | 'discovery' | 'validation' | 'acceleration' | 'transfer';

/** Stages for exploit portfolio */
export type ExploitStage = 'improve' | 'grow' | 'sustain' | 'retire' | 'transfer';

/** All possible stages */
export type Stage = ExploreStage | ExploitStage;

/** Job types */
export type JobType = 'functional' | 'emotional' | 'social';

/** Importance/severity levels */
export type Level = 'low' | 'medium' | 'high';

/** Product/service types */
export type ProductServiceType = 'product' | 'service' | 'digital' | 'financial';

/** Channel types */
export type ChannelType = 'direct' | 'indirect' | 'owned' | 'partner';

/** Channel phases */
export type ChannelPhase = 'awareness' | 'evaluation' | 'purchase' | 'delivery' | 'after_sales';

/** Customer relationship types */
export type CustomerRelationshipType =
  | 'personal_assistance'
  | 'dedicated'
  | 'self_service'
  | 'automated'
  | 'community'
  | 'co_creation';

/** Revenue stream types */
export type RevenueStreamType =
  | 'transaction'
  | 'recurring'
  | 'licensing'
  | 'subscription'
  | 'usage'
  | 'advertising';

/** Pricing mechanisms */
export type PricingType =
  | 'fixed_menu'
  | 'dynamic'
  | 'negotiation'
  | 'auction'
  | 'market_dependent'
  | 'volume_dependent';

/** Key resource types */
export type KeyResourceType = 'physical' | 'intellectual' | 'human' | 'financial';

/** Key activity types */
export type KeyActivityType = 'production' | 'problem_solving' | 'platform';

/** Key partnership types */
export type KeyPartnershipType = 'strategic_alliance' | 'coopetition' | 'joint_venture' | 'supplier';

/** Partnership motivation */
export type PartnershipMotivation = 'optimization' | 'risk_reduction' | 'resource_acquisition';

/** Cost structure types */
export type CostStructureType = 'cost_driven' | 'value_driven';

/** Cost structure characteristics */
export type CostCharacteristic =
  | 'fixed_costs_heavy'
  | 'variable_costs_heavy'
  | 'economies_of_scale'
  | 'economies_of_scope';

/** Cost types */
export type CostType = 'fixed' | 'variable';

// ============================================================================
// ID Types (branded strings for type safety)
// ============================================================================

/** Customer segment ID (cs-*) */
export type CustomerSegmentId = string;

/** Value proposition ID (vp-*) */
export type ValuePropositionId = string;

/** Product/service ID (ps-*) */
export type ProductServiceId = string;

/** Job ID (job-*) */
export type JobId = string;

/** Pain ID (pain-*) */
export type PainId = string;

/** Gain ID (gain-*) */
export type GainId = string;

/** Fit ID (fit-*) */
export type FitId = string;

/** Channel ID (ch-*) */
export type ChannelId = string;

/** Customer relationship ID (cr-*) */
export type CustomerRelationshipId = string;

/** Revenue stream ID (rs-*) */
export type RevenueStreamId = string;

/** Key resource ID (kr-*) */
export type KeyResourceId = string;

/** Key activity ID (ka-*) */
export type KeyActivityId = string;

/** Key partnership ID (kp-*) */
export type KeyPartnershipId = string;

/** Resource or activity ID (kr-* or ka-*) */
export type ResourceOrActivityId = KeyResourceId | KeyActivityId;

// ============================================================================
// v2 ID Types
// ============================================================================

/** Pain reliever ID (pr-*) - v2 */
export type PainRelieverId = string;

/** Gain creator ID (gc-*) - v2 */
export type GainCreatorId = string;

/** Cost ID (cost-*) - v2 */
export type CostId = string;

// ============================================================================
// ID Type Guards
// ============================================================================

/** Check if string is a valid customer segment ID */
export function isCustomerSegmentId(id: string): id is CustomerSegmentId {
  return /^cs-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid value proposition ID */
export function isValuePropositionId(id: string): id is ValuePropositionId {
  return /^vp-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid product/service ID */
export function isProductServiceId(id: string): id is ProductServiceId {
  return /^ps-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid job ID */
export function isJobId(id: string): id is JobId {
  return /^job-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid pain ID */
export function isPainId(id: string): id is PainId {
  return /^pain-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid gain ID */
export function isGainId(id: string): id is GainId {
  return /^gain-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid fit ID */
export function isFitId(id: string): id is FitId {
  return /^fit-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid channel ID */
export function isChannelId(id: string): id is ChannelId {
  return /^ch-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid customer relationship ID */
export function isCustomerRelationshipId(id: string): id is CustomerRelationshipId {
  return /^cr-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid revenue stream ID */
export function isRevenueStreamId(id: string): id is RevenueStreamId {
  return /^rs-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid key resource ID */
export function isKeyResourceId(id: string): id is KeyResourceId {
  return /^kr-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid key activity ID */
export function isKeyActivityId(id: string): id is KeyActivityId {
  return /^ka-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid key partnership ID */
export function isKeyPartnershipId(id: string): id is KeyPartnershipId {
  return /^kp-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid resource or activity ID */
export function isResourceOrActivityId(id: string): id is ResourceOrActivityId {
  return /^(kr|ka)-[a-z0-9-]+$/.test(id);
}

// ============================================================================
// v2 ID Type Guards
// ============================================================================

/** Check if string is a valid pain reliever ID (v2) */
export function isPainRelieverId(id: string): id is PainRelieverId {
  return /^pr-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid gain creator ID (v2) */
export function isGainCreatorId(id: string): id is GainCreatorId {
  return /^gc-[a-z0-9-]+$/.test(id);
}

/** Check if string is a valid cost ID (v2) */
export function isCostId(id: string): id is CostId {
  return /^cost-[a-z0-9-]+$/.test(id);
}

// ============================================================================
// Core Interfaces
// ============================================================================

/** Business model metadata */
export interface Meta {
  /** Name of the business model */
  name: string;
  /** One-liner description */
  tagline?: string;
  /** Creation date (ISO 8601) */
  created?: string;
  /** Last updated date (ISO 8601) */
  updated?: string;
  /** Portfolio position */
  portfolio: Portfolio;
  /** Current stage within the portfolio */
  stage: Stage;
  /** Relative path to parent business model file */
  derived_from?: string;
}

/** A job the customer is trying to accomplish */
export interface Job {
  /** Unique identifier with job- prefix */
  id: JobId;
  /** Type of job */
  type: JobType;
  /** What they're trying to accomplish */
  description: string;
  /** Importance level */
  importance?: Level;
}

/** A customer pain point */
export interface Pain {
  /** Unique identifier with pain- prefix */
  id: PainId;
  /** What frustrates them or blocks them */
  description: string;
  /** Severity level */
  severity?: Level;
}

/** A desired customer gain */
export interface Gain {
  /** Unique identifier with gain- prefix */
  id: GainId;
  /** What they want to achieve or experience */
  description: string;
  /** Importance level */
  importance?: Level;
}

/** A customer segment with its profile (jobs, pains, gains) */
export interface CustomerSegment {
  /** Unique identifier with cs- prefix */
  id: CustomerSegmentId;
  /** Name of the customer segment */
  name: string;
  /** Who they are */
  description?: string;
  /** Jobs to be done */
  jobs?: Job[];
  /** Customer pains */
  pains?: Pain[];
  /** Customer gains */
  gains?: Gain[];
}

/** A product or service offering */
export interface ProductService {
  /** Unique identifier with ps- prefix */
  id: ProductServiceId;
  /** Type of product/service */
  type: ProductServiceType;
  /** What it is */
  description: string;
}

/** A value proposition with its products/services */
export interface ValueProposition {
  /** Unique identifier with vp- prefix */
  id: ValuePropositionId;
  /** Name of the value proposition */
  name: string;
  /** What you offer */
  description?: string;
  /** Products and services that deliver this value */
  products_services?: ProductService[];
}

/** How a product/service relieves a specific pain */
export interface PainReliever {
  /** Reference to a pain */
  pain: PainId;
  /** Products/services that relieve this pain */
  through: ProductServiceId[];
  /** How it relieves the pain */
  description?: string;
}

/** How a product/service creates a specific gain */
export interface GainCreator {
  /** Reference to a gain */
  gain: GainId;
  /** Products/services that create this gain */
  through: ProductServiceId[];
  /** How it creates the gain */
  description?: string;
}

/** How a product/service addresses a specific job */
export interface JobAddresser {
  /** Reference to a job */
  job: JobId;
  /** Products/services that address this job */
  through: ProductServiceId[];
  /** How it addresses the job */
  description?: string;
}

/** A fit between a value proposition and customer segment */
export interface Fit {
  /** Unique identifier with fit- prefix */
  id: FitId;
  /** Reference to a value proposition */
  value_proposition: ValuePropositionId;
  /** Reference to a customer segment */
  customer_segment: CustomerSegmentId;
  /** How products/services relieve customer pains */
  pain_relievers?: PainReliever[];
  /** How products/services create customer gains */
  gain_creators?: GainCreator[];
  /** How products/services address customer jobs */
  job_addressers?: JobAddresser[];
}

/** A channel to reach customer segments */
export interface Channel {
  /** Unique identifier with ch- prefix */
  id: ChannelId;
  /** Name of the channel */
  name: string;
  /** Type of channel */
  type: ChannelType;
  /** Customer segments reached through this channel */
  segments?: CustomerSegmentId[];
  /** Channel phases covered */
  phases?: ChannelPhase[];
}

/** A type of relationship with a customer segment */
export interface CustomerRelationship {
  /** Unique identifier with cr- prefix */
  id: CustomerRelationshipId;
  /** Reference to a customer segment */
  segment: CustomerSegmentId;
  /** Type of relationship */
  type: CustomerRelationshipType;
  /** How you interact with this segment */
  description?: string;
}

/** A revenue stream from customer segments */
export interface RevenueStream {
  /** Unique identifier with rs- prefix */
  id: RevenueStreamId;
  /** Name of the revenue stream */
  name: string;
  /** Type of revenue stream */
  type: RevenueStreamType;
  /** Customer segments this revenue comes from */
  from_segments?: CustomerSegmentId[];
  /** Reference to value proposition */
  for_value?: ValuePropositionId;
  /** Pricing mechanism */
  pricing?: PricingType;
}

/** A key resource needed to deliver value */
export interface KeyResource {
  /** Unique identifier with kr- prefix */
  id: KeyResourceId;
  /** Name of the resource */
  name: string;
  /** Type of resource */
  type: KeyResourceType;
  /** Details about the resource */
  description?: string;
  /** Value propositions that need this resource */
  for_value?: ValuePropositionId[];
}

/** A key activity needed to deliver value */
export interface KeyActivity {
  /** Unique identifier with ka- prefix */
  id: KeyActivityId;
  /** Name of the activity */
  name: string;
  /** Type of activity */
  type: KeyActivityType;
  /** Details about the activity */
  description?: string;
  /** Value propositions that require this activity */
  for_value?: ValuePropositionId[];
}

/** A key partnership that provides resources or activities */
export interface KeyPartnership {
  /** Unique identifier with kp- prefix */
  id: KeyPartnershipId;
  /** Name of the partner */
  name: string;
  /** Type of partnership */
  type: KeyPartnershipType;
  /** Motivation for the partnership */
  motivation: PartnershipMotivation;
  /** Resources or activities this partner provides */
  provides?: ResourceOrActivityId[];
}

/** A major cost item */
export interface MajorCost {
  /** Name of the cost */
  name: string;
  /** Type of cost */
  type: CostType;
  /** Resources or activities this cost is linked to */
  linked_to?: ResourceOrActivityId[];
}

/** The cost structure of the business model */
export interface CostStructure {
  /** Cost structure type */
  type: CostStructureType;
  /** Cost structure characteristics */
  characteristics?: CostCharacteristic[];
  /** Major cost items */
  major_costs?: MajorCost[];
}

// ============================================================================
// v2 Interfaces
// ============================================================================

/** Pain reliever in v2 Value Map - how a VP relieves pain */
export interface PainRelieverV2 {
  /** Unique identifier with pr- prefix */
  id: PainRelieverId;
  /** How it relieves pain */
  name: string;
}

/** Gain creator in v2 Value Map - how a VP creates gain */
export interface GainCreatorV2 {
  /** Unique identifier with gc- prefix */
  id: GainCreatorId;
  /** How it creates gain */
  name: string;
}

/** v2 relationship target - which entities something serves/supports */
export interface ForRelation {
  /** Value propositions this relates to */
  value_propositions?: ValuePropositionId[];
  /** Customer segments this relates to */
  customer_segments?: CustomerSegmentId[];
  /** Key resources this relates to */
  key_resources?: KeyResourceId[];
  /** Key activities this relates to */
  key_activities?: KeyActivityId[];
}

/** v2 relationship source - which entities something comes from */
export interface FromRelation {
  /** Customer segments this comes from */
  customer_segments?: CustomerSegmentId[];
}

/** v2 Product/Service - simpler structure without type field */
export interface ProductServiceV2 {
  /** Unique identifier with ps- prefix */
  id: ProductServiceId;
  /** Name of the product or service */
  name: string;
}

/** v2 Job - simpler structure without type/importance */
export interface JobV2 {
  /** Unique identifier with job- prefix */
  id: JobId;
  /** What they're trying to accomplish */
  description: string;
}

/** v2 Pain - simpler structure without severity */
export interface PainV2 {
  /** Unique identifier with pain- prefix */
  id: PainId;
  /** What frustrates them or blocks them */
  description: string;
}

/** v2 Gain - simpler structure without importance */
export interface GainV2 {
  /** Unique identifier with gain- prefix */
  id: GainId;
  /** What they want to achieve or experience */
  description: string;
}

/** v2 Customer Segment with optional profile */
export interface CustomerSegmentV2 {
  /** Unique identifier with cs- prefix */
  id: CustomerSegmentId;
  /** Name of the customer segment */
  name: string;
  /** Who they are */
  description?: string;
  /** Jobs to be done (Customer Profile) */
  jobs?: JobV2[];
  /** Customer pains (Customer Profile) */
  pains?: PainV2[];
  /** Customer gains (Customer Profile) */
  gains?: GainV2[];
}

/** v2 Value Proposition with optional Value Map */
export interface ValuePropositionV2 {
  /** Unique identifier with vp- prefix */
  id: ValuePropositionId;
  /** Name of the value proposition */
  name: string;
  /** What you offer */
  description?: string;
  /** Products and services that deliver this value (Value Map) */
  products_services?: ProductServiceV2[];
  /** How this VP relieves customer pains (Value Map) */
  pain_relievers?: PainRelieverV2[];
  /** How this VP creates customer gains (Value Map) */
  gain_creators?: GainCreatorV2[];
}

/** Tuple mapping in a fit: [reliever/creator, pain/gain] */
export type FitMapping = [string, string];

/** v2 Fit between value propositions and customer segments */
export interface FitV2 {
  /** Unique identifier with fit- prefix */
  id: FitId;
  /** Which VP(s) and CS(s) this fit connects */
  for: {
    value_propositions: ValuePropositionId[];
    customer_segments: CustomerSegmentId[];
  };
  /** Tuple mappings: [reliever/creator, pain/gain] */
  mappings?: FitMapping[];
}

/** v2 Channel with for: pattern */
export interface ChannelV2 {
  /** Unique identifier with ch- prefix */
  id: ChannelId;
  /** Name of the channel */
  name: string;
  /** Which VPs and CSs this channel serves */
  for?: {
    value_propositions?: ValuePropositionId[];
    customer_segments?: CustomerSegmentId[];
  };
}

/** v2 Customer Relationship with for: pattern */
export interface CustomerRelationshipV2 {
  /** Unique identifier with cr- prefix */
  id: CustomerRelationshipId;
  /** Name/type of relationship */
  name: string;
  /** Which customer segments this relationship applies to */
  for?: {
    customer_segments?: CustomerSegmentId[];
  };
}

/** v2 Revenue Stream with for:/from: pattern */
export interface RevenueStreamV2 {
  /** Unique identifier with rs- prefix */
  id: RevenueStreamId;
  /** Name of the revenue stream */
  name: string;
  /** Who pays (source of revenue) */
  from?: FromRelation;
  /** What they pay for */
  for?: {
    value_propositions?: ValuePropositionId[];
  };
}

/** v2 Key Resource with for: pattern */
export interface KeyResourceV2 {
  /** Unique identifier with kr- prefix */
  id: KeyResourceId;
  /** Name of the resource */
  name: string;
  /** Which value propositions need this resource */
  for?: {
    value_propositions?: ValuePropositionId[];
  };
}

/** v2 Key Activity with for: pattern */
export interface KeyActivityV2 {
  /** Unique identifier with ka- prefix */
  id: KeyActivityId;
  /** Name of the activity */
  name: string;
  /** Which value propositions require this activity */
  for?: {
    value_propositions?: ValuePropositionId[];
  };
}

/** v2 Key Partnership with for: pattern */
export interface KeyPartnershipV2 {
  /** Unique identifier with kp- prefix */
  id: KeyPartnershipId;
  /** Name of the partner */
  name: string;
  /** Which resources/activities this partner provides */
  for?: {
    key_resources?: KeyResourceId[];
    key_activities?: KeyActivityId[];
  };
}

/** v2 Cost item (replaces MajorCost in cost_structure) */
export interface Cost {
  /** Unique identifier with cost- prefix */
  id: CostId;
  /** Name of the cost */
  name: string;
  /** Which resources/activities incur this cost */
  for?: {
    key_resources?: KeyResourceId[];
    key_activities?: KeyActivityId[];
  };
}

// ============================================================================
// Root Document Interface
// ============================================================================

/** Complete BMCLang v1 document */
export interface BMCDocument {
  /** BMCLang format version */
  version: '1.0';
  /** Business model metadata */
  meta: Meta;
  /** Customer segments the business targets */
  customer_segments?: CustomerSegment[];
  /** Value propositions offered to customer segments */
  value_propositions?: ValueProposition[];
  /** Connections between value propositions and customer segments */
  fits?: Fit[];
  /** Channels to reach customer segments */
  channels?: Channel[];
  /** Types of relationships with customer segments */
  customer_relationships?: CustomerRelationship[];
  /** Revenue streams from customer segments */
  revenue_streams?: RevenueStream[];
  /** Key resources needed to deliver value propositions */
  key_resources?: KeyResource[];
  /** Key activities needed to deliver value propositions */
  key_activities?: KeyActivity[];
  /** Key partnerships that provide resources or activities */
  key_partnerships?: KeyPartnership[];
  /** The cost structure of the business model */
  cost_structure?: CostStructure;
}

/** Complete BMML v2 document */
export interface BMCDocumentV2 {
  /** BMML format version */
  version: '2.0';
  /** Business model metadata */
  meta: Meta;
  /** Customer segments the business targets (with optional Customer Profile) */
  customer_segments?: CustomerSegmentV2[];
  /** Value propositions offered (with optional Value Map) */
  value_propositions?: ValuePropositionV2[];
  /** Connections between value propositions and customer segments (VPC detail) */
  fits?: FitV2[];
  /** Channels to reach customer segments with value propositions */
  channels?: ChannelV2[];
  /** Types of relationships with customer segments */
  customer_relationships?: CustomerRelationshipV2[];
  /** Revenue streams from customer segments for value propositions */
  revenue_streams?: RevenueStreamV2[];
  /** Key resources needed to deliver value propositions */
  key_resources?: KeyResourceV2[];
  /** Key activities needed to deliver value propositions */
  key_activities?: KeyActivityV2[];
  /** Key partnerships that provide resources or activities */
  key_partnerships?: KeyPartnershipV2[];
  /** Cost items (replaces v1 cost_structure) */
  costs?: Cost[];
}

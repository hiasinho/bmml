/**
 * BMML Migration Tool
 * Migrates BMCLang v1 documents to BMML v2 format
 */

import { dump as dumpYaml } from 'js-yaml';
import type {
  BMCDocument,
  BMCDocumentV2,
  CustomerSegment,
  CustomerSegmentV2,
  ValueProposition,
  ValuePropositionV2,
  ProductService,
  ProductServiceV2,
  Job,
  JobV2,
  Pain,
  PainV2,
  Gain,
  GainV2,
  Fit,
  FitV2,
  FitMapping,
  PainRelieverV2,
  GainCreatorV2,
  Channel,
  ChannelV2,
  CustomerRelationship,
  CustomerRelationshipV2,
  RevenueStream,
  RevenueStreamV2,
  KeyResource,
  KeyResourceV2,
  KeyActivity,
  KeyActivityV2,
  KeyPartnership,
  KeyPartnershipV2,
  MajorCost,
  Cost,
} from './types.js';
import { parseYaml, detectVersion } from './validator.js';

export interface MigrationResult {
  success: boolean;
  output?: string;
  errors: string[];
}

/**
 * Convert a v1 Job to v2 Job (strips type and importance)
 */
function migrateJob(job: Job): JobV2 {
  return {
    id: job.id,
    description: job.description,
  };
}

/**
 * Convert a v1 Pain to v2 Pain (strips severity)
 */
function migratePain(pain: Pain): PainV2 {
  return {
    id: pain.id,
    description: pain.description,
  };
}

/**
 * Convert a v1 Gain to v2 Gain (strips importance)
 */
function migrateGain(gain: Gain): GainV2 {
  return {
    id: gain.id,
    description: gain.description,
  };
}

/**
 * Convert a v1 ProductService to v2 ProductServiceV2 (type -> name)
 */
function migrateProductService(ps: ProductService): ProductServiceV2 {
  return {
    id: ps.id,
    // Use description as name since v1 had type+description, v2 has name
    name: ps.description,
  };
}

/**
 * Convert a v1 CustomerSegment to v2 CustomerSegmentV2
 * Strips type/importance/severity from jobs/pains/gains
 */
function migrateCustomerSegment(segment: CustomerSegment): CustomerSegmentV2 {
  const result: CustomerSegmentV2 = {
    id: segment.id,
    name: segment.name,
  };

  if (segment.description) {
    result.description = segment.description;
  }

  if (segment.jobs && segment.jobs.length > 0) {
    result.jobs = segment.jobs.map(migrateJob);
  }

  if (segment.pains && segment.pains.length > 0) {
    result.pains = segment.pains.map(migratePain);
  }

  if (segment.gains && segment.gains.length > 0) {
    result.gains = segment.gains.map(migrateGain);
  }

  return result;
}

/**
 * Generate a pain reliever ID from a pain ID
 * pain-foo -> pr-foo
 */
function generatePainRelieverId(painId: string): string {
  // Extract the suffix from the pain ID
  const suffix = painId.replace(/^pain-/, '');
  return `pr-${suffix}`;
}

/**
 * Generate a gain creator ID from a gain ID
 * gain-foo -> gc-foo
 */
function generateGainCreatorId(gainId: string): string {
  // Extract the suffix from the gain ID
  const suffix = gainId.replace(/^gain-/, '');
  return `gc-${suffix}`;
}

/**
 * Generate a cost ID from a cost name
 * "Rent" -> cost-rent
 */
function generateCostId(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `cost-${slug || index}`;
}

/**
 * Extract pain relievers and gain creators from v1 fits and add them to value propositions
 * Also build the mapping for fit migrations
 */
interface FitMigrationContext {
  vpPainRelievers: Map<string, PainRelieverV2[]>;
  vpGainCreators: Map<string, GainCreatorV2[]>;
  fitMappings: Map<string, FitMapping[]>;
}

function buildFitMigrationContext(fits: Fit[]): FitMigrationContext {
  const vpPainRelievers = new Map<string, PainRelieverV2[]>();
  const vpGainCreators = new Map<string, GainCreatorV2[]>();
  const fitMappings = new Map<string, FitMapping[]>();

  for (const fit of fits) {
    const vpId = fit.value_proposition;
    const mappings: FitMapping[] = [];

    // Process pain relievers
    if (fit.pain_relievers) {
      const relievers = vpPainRelievers.get(vpId) || [];
      for (const pr of fit.pain_relievers) {
        const prId = generatePainRelieverId(pr.pain);

        // Add to VP's pain relievers if not already there
        if (!relievers.some((r) => r.id === prId)) {
          relievers.push({
            id: prId,
            name: pr.description || `Relieves ${pr.pain}`,
          });
        }

        // Create tuple mapping: [pain-reliever-id, pain-id]
        mappings.push([prId, pr.pain]);
      }
      vpPainRelievers.set(vpId, relievers);
    }

    // Process gain creators
    if (fit.gain_creators) {
      const creators = vpGainCreators.get(vpId) || [];
      for (const gc of fit.gain_creators) {
        const gcId = generateGainCreatorId(gc.gain);

        // Add to VP's gain creators if not already there
        if (!creators.some((c) => c.id === gcId)) {
          creators.push({
            id: gcId,
            name: gc.description || `Creates ${gc.gain}`,
          });
        }

        // Create tuple mapping: [gain-creator-id, gain-id]
        mappings.push([gcId, gc.gain]);
      }
      vpGainCreators.set(vpId, creators);
    }

    fitMappings.set(fit.id, mappings);
  }

  return { vpPainRelievers, vpGainCreators, fitMappings };
}

/**
 * Convert a v1 ValueProposition to v2 ValuePropositionV2
 * Includes migrated pain_relievers and gain_creators from fits
 */
function migrateValueProposition(
  vp: ValueProposition,
  painRelievers: PainRelieverV2[] | undefined,
  gainCreators: GainCreatorV2[] | undefined
): ValuePropositionV2 {
  const result: ValuePropositionV2 = {
    id: vp.id,
    name: vp.name,
  };

  if (vp.description) {
    result.description = vp.description;
  }

  if (vp.products_services && vp.products_services.length > 0) {
    result.products_services = vp.products_services.map(migrateProductService);
  }

  if (painRelievers && painRelievers.length > 0) {
    result.pain_relievers = painRelievers;
  }

  if (gainCreators && gainCreators.length > 0) {
    result.gain_creators = gainCreators;
  }

  return result;
}

/**
 * Convert a v1 Fit to v2 FitV2
 * Transforms value_proposition + customer_segment to for: { value_propositions: [], customer_segments: [] }
 * Transforms pain_relievers/gain_creators to tuple mappings
 */
function migrateFit(fit: Fit, mappings: FitMapping[]): FitV2 {
  const result: FitV2 = {
    id: fit.id,
    for: {
      value_propositions: [fit.value_proposition],
      customer_segments: [fit.customer_segment],
    },
  };

  if (mappings.length > 0) {
    result.mappings = mappings;
  }

  return result;
}

/**
 * Convert a v1 Channel to v2 ChannelV2
 * Transforms segments to for: { customer_segments: [] }
 * Note: v2 also supports for: { value_propositions: [] } but v1 didn't have this
 */
function migrateChannel(channel: Channel): ChannelV2 {
  const result: ChannelV2 = {
    id: channel.id,
    name: channel.name,
  };

  if (channel.segments && channel.segments.length > 0) {
    result.for = {
      customer_segments: channel.segments,
    };
  }

  return result;
}

/**
 * Convert a v1 CustomerRelationship to v2 CustomerRelationshipV2
 * Transforms segment to for: { customer_segments: [] }
 * Uses type as the name since v2 has name instead of type
 */
function migrateCustomerRelationship(cr: CustomerRelationship): CustomerRelationshipV2 {
  const result: CustomerRelationshipV2 = {
    id: cr.id,
    // Use type as name, with description if available
    name: cr.description || cr.type.replace(/_/g, ' '),
  };

  result.for = {
    customer_segments: [cr.segment],
  };

  return result;
}

/**
 * Convert a v1 RevenueStream to v2 RevenueStreamV2
 * Transforms from_segments to from: { customer_segments: [] }
 * Transforms for_value to for: { value_propositions: [] }
 */
function migrateRevenueStream(rs: RevenueStream): RevenueStreamV2 {
  const result: RevenueStreamV2 = {
    id: rs.id,
    name: rs.name,
  };

  if (rs.from_segments && rs.from_segments.length > 0) {
    result.from = {
      customer_segments: rs.from_segments,
    };
  }

  if (rs.for_value) {
    result.for = {
      value_propositions: [rs.for_value],
    };
  }

  return result;
}

/**
 * Convert a v1 KeyResource to v2 KeyResourceV2
 * Transforms for_value to for: { value_propositions: [] }
 */
function migrateKeyResource(kr: KeyResource): KeyResourceV2 {
  const result: KeyResourceV2 = {
    id: kr.id,
    name: kr.name,
  };

  if (kr.for_value && kr.for_value.length > 0) {
    result.for = {
      value_propositions: kr.for_value,
    };
  }

  return result;
}

/**
 * Convert a v1 KeyActivity to v2 KeyActivityV2
 * Transforms for_value to for: { value_propositions: [] }
 */
function migrateKeyActivity(ka: KeyActivity): KeyActivityV2 {
  const result: KeyActivityV2 = {
    id: ka.id,
    name: ka.name,
  };

  if (ka.for_value && ka.for_value.length > 0) {
    result.for = {
      value_propositions: ka.for_value,
    };
  }

  return result;
}

/**
 * Convert a v1 KeyPartnership to v2 KeyPartnershipV2
 * Transforms provides to for: { key_resources: [], key_activities: [] }
 */
function migrateKeyPartnership(kp: KeyPartnership): KeyPartnershipV2 {
  const result: KeyPartnershipV2 = {
    id: kp.id,
    name: kp.name,
  };

  if (kp.provides && kp.provides.length > 0) {
    const keyResources: string[] = [];
    const keyActivities: string[] = [];

    for (const id of kp.provides) {
      if (id.startsWith('kr-')) {
        keyResources.push(id);
      } else if (id.startsWith('ka-')) {
        keyActivities.push(id);
      }
    }

    if (keyResources.length > 0 || keyActivities.length > 0) {
      result.for = {};
      if (keyResources.length > 0) {
        result.for.key_resources = keyResources;
      }
      if (keyActivities.length > 0) {
        result.for.key_activities = keyActivities;
      }
    }
  }

  return result;
}

/**
 * Convert v1 cost_structure.major_costs to v2 costs array
 * Transforms linked_to to for: { key_resources: [], key_activities: [] }
 */
function migrateCosts(majorCosts: MajorCost[]): Cost[] {
  return majorCosts.map((cost, index) => {
    const result: Cost = {
      id: generateCostId(cost.name, index),
      name: cost.name,
    };

    if (cost.linked_to && cost.linked_to.length > 0) {
      const keyResources: string[] = [];
      const keyActivities: string[] = [];

      for (const id of cost.linked_to) {
        if (id.startsWith('kr-')) {
          keyResources.push(id);
        } else if (id.startsWith('ka-')) {
          keyActivities.push(id);
        }
      }

      if (keyResources.length > 0 || keyActivities.length > 0) {
        result.for = {};
        if (keyResources.length > 0) {
          result.for.key_resources = keyResources;
        }
        if (keyActivities.length > 0) {
          result.for.key_activities = keyActivities;
        }
      }
    }

    return result;
  });
}

/**
 * Migrate a parsed v1 document object to v2 document object
 * @param doc - The parsed v1 document
 * @returns The migrated v2 document
 */
export function migrateDocumentV1toV2(doc: BMCDocument): BMCDocumentV2 {
  // Build fit migration context first to collect pain relievers and gain creators
  const fitContext = doc.fits ? buildFitMigrationContext(doc.fits) : null;

  const result: BMCDocumentV2 = {
    version: '2.0',
    meta: doc.meta,
  };

  // Migrate customer segments
  if (doc.customer_segments && doc.customer_segments.length > 0) {
    result.customer_segments = doc.customer_segments.map(migrateCustomerSegment);
  }

  // Migrate value propositions with pain relievers and gain creators from fits
  if (doc.value_propositions && doc.value_propositions.length > 0) {
    result.value_propositions = doc.value_propositions.map((vp) =>
      migrateValueProposition(
        vp,
        fitContext?.vpPainRelievers.get(vp.id),
        fitContext?.vpGainCreators.get(vp.id)
      )
    );
  }

  // Migrate fits
  if (doc.fits && doc.fits.length > 0 && fitContext) {
    result.fits = doc.fits.map((fit) => migrateFit(fit, fitContext.fitMappings.get(fit.id) || []));
  }

  // Migrate channels
  if (doc.channels && doc.channels.length > 0) {
    result.channels = doc.channels.map(migrateChannel);
  }

  // Migrate customer relationships
  if (doc.customer_relationships && doc.customer_relationships.length > 0) {
    result.customer_relationships = doc.customer_relationships.map(migrateCustomerRelationship);
  }

  // Migrate revenue streams
  if (doc.revenue_streams && doc.revenue_streams.length > 0) {
    result.revenue_streams = doc.revenue_streams.map(migrateRevenueStream);
  }

  // Migrate key resources
  if (doc.key_resources && doc.key_resources.length > 0) {
    result.key_resources = doc.key_resources.map(migrateKeyResource);
  }

  // Migrate key activities
  if (doc.key_activities && doc.key_activities.length > 0) {
    result.key_activities = doc.key_activities.map(migrateKeyActivity);
  }

  // Migrate key partnerships
  if (doc.key_partnerships && doc.key_partnerships.length > 0) {
    result.key_partnerships = doc.key_partnerships.map(migrateKeyPartnership);
  }

  // Migrate cost_structure to costs
  if (doc.cost_structure?.major_costs && doc.cost_structure.major_costs.length > 0) {
    result.costs = migrateCosts(doc.cost_structure.major_costs);
  }

  return result;
}

/**
 * Migrate a v1 YAML string to v2 YAML string
 * @param content - v1 YAML content
 * @returns MigrationResult with output YAML or errors
 */
export function migrateV1toV2(content: string): MigrationResult {
  // Parse the YAML
  const parseResult = parseYaml(content);
  if ('error' in parseResult) {
    return {
      success: false,
      errors: [parseResult.error.message],
    };
  }

  const doc = parseResult.data as BMCDocument;

  // Check if it's already v2
  const detectedVersion = detectVersion(doc);
  if (detectedVersion === 'v2') {
    return {
      success: false,
      errors: ['Document appears to already be v2 format'],
    };
  }

  // Check for required v1 fields
  if (!doc.version || doc.version !== '1.0') {
    // Allow migration of documents without explicit version if they look like v1
    if (doc.version && doc.version !== '1.0') {
      return {
        success: false,
        errors: [`Unsupported version: ${doc.version}. Only v1.0 documents can be migrated.`],
      };
    }
  }

  if (!doc.meta) {
    return {
      success: false,
      errors: ['Missing required meta section'],
    };
  }

  try {
    // Perform migration
    const v2Doc = migrateDocumentV1toV2(doc);

    // Convert back to YAML
    const output = dumpYaml(v2Doc, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    });

    return {
      success: true,
      output,
      errors: [],
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : 'Unknown migration error'],
    };
  }
}

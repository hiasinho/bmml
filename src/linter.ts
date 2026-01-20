/**
 * BMCLang Linter
 * Validates semantic rules that JSON Schema cannot express,
 * primarily reference integrity between entities.
 */

import type {
  BMCDocument,
  BMCDocumentV2,
  CustomerSegmentId,
  ValuePropositionId,
  ProductServiceId,
  JobId,
  PainId,
  GainId,
  KeyResourceId,
  KeyActivityId,
  ResourceOrActivityId,
  PainRelieverId,
  GainCreatorId,
} from './types.js';
import { detectVersion, type SchemaVersion } from './validator.js';

export interface LintIssue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path: string;
}

export interface LintResult {
  issues: LintIssue[];
  version: SchemaVersion;
}

/**
 * Build a map of all IDs in a v1 document, organized by type
 */
interface IdMaps {
  customerSegments: Map<CustomerSegmentId, { jobs: Set<JobId>; pains: Set<PainId>; gains: Set<GainId> }>;
  valuePropositions: Map<ValuePropositionId, Set<ProductServiceId>>;
  keyResources: Set<KeyResourceId>;
  keyActivities: Set<KeyActivityId>;
}

/**
 * Build a map of all IDs in a v2 document, organized by type
 * Includes pain relievers and gain creators nested in value propositions
 */
interface IdMapsV2 {
  customerSegments: Map<CustomerSegmentId, { jobs: Set<JobId>; pains: Set<PainId>; gains: Set<GainId> }>;
  valuePropositions: Map<ValuePropositionId, {
    productServices: Set<ProductServiceId>;
    painRelievers: Set<PainRelieverId>;
    gainCreators: Set<GainCreatorId>;
  }>;
  keyResources: Set<KeyResourceId>;
  keyActivities: Set<KeyActivityId>;
}

function buildIdMaps(doc: BMCDocument): IdMaps {
  const customerSegments = new Map<CustomerSegmentId, { jobs: Set<JobId>; pains: Set<PainId>; gains: Set<GainId> }>();
  const valuePropositions = new Map<ValuePropositionId, Set<ProductServiceId>>();
  const keyResources = new Set<KeyResourceId>();
  const keyActivities = new Set<KeyActivityId>();

  // Collect customer segments and their nested IDs
  for (const cs of doc.customer_segments ?? []) {
    const jobs = new Set<JobId>();
    const pains = new Set<PainId>();
    const gains = new Set<GainId>();

    for (const job of cs.jobs ?? []) {
      jobs.add(job.id);
    }
    for (const pain of cs.pains ?? []) {
      pains.add(pain.id);
    }
    for (const gain of cs.gains ?? []) {
      gains.add(gain.id);
    }

    customerSegments.set(cs.id, { jobs, pains, gains });
  }

  // Collect value propositions and their products/services
  for (const vp of doc.value_propositions ?? []) {
    const productServices = new Set<ProductServiceId>();
    for (const ps of vp.products_services ?? []) {
      productServices.add(ps.id);
    }
    valuePropositions.set(vp.id, productServices);
  }

  // Collect key resources
  for (const kr of doc.key_resources ?? []) {
    keyResources.add(kr.id);
  }

  // Collect key activities
  for (const ka of doc.key_activities ?? []) {
    keyActivities.add(ka.id);
  }

  return { customerSegments, valuePropositions, keyResources, keyActivities };
}

/**
 * Build ID maps for a v2 document
 */
function buildIdMapsV2(doc: BMCDocumentV2): IdMapsV2 {
  const customerSegments = new Map<CustomerSegmentId, { jobs: Set<JobId>; pains: Set<PainId>; gains: Set<GainId> }>();
  const valuePropositions = new Map<ValuePropositionId, {
    productServices: Set<ProductServiceId>;
    painRelievers: Set<PainRelieverId>;
    gainCreators: Set<GainCreatorId>;
  }>();
  const keyResources = new Set<KeyResourceId>();
  const keyActivities = new Set<KeyActivityId>();

  // Collect customer segments and their nested IDs (Customer Profile)
  for (const cs of doc.customer_segments ?? []) {
    const jobs = new Set<JobId>();
    const pains = new Set<PainId>();
    const gains = new Set<GainId>();

    for (const job of cs.jobs ?? []) {
      jobs.add(job.id);
    }
    for (const pain of cs.pains ?? []) {
      pains.add(pain.id);
    }
    for (const gain of cs.gains ?? []) {
      gains.add(gain.id);
    }

    customerSegments.set(cs.id, { jobs, pains, gains });
  }

  // Collect value propositions and their Value Map (products/services, pain relievers, gain creators)
  for (const vp of doc.value_propositions ?? []) {
    const productServices = new Set<ProductServiceId>();
    const painRelievers = new Set<PainRelieverId>();
    const gainCreators = new Set<GainCreatorId>();

    for (const ps of vp.products_services ?? []) {
      productServices.add(ps.id);
    }
    for (const pr of vp.pain_relievers ?? []) {
      painRelievers.add(pr.id);
    }
    for (const gc of vp.gain_creators ?? []) {
      gainCreators.add(gc.id);
    }

    valuePropositions.set(vp.id, { productServices, painRelievers, gainCreators });
  }

  // Collect key resources
  for (const kr of doc.key_resources ?? []) {
    keyResources.add(kr.id);
  }

  // Collect key activities
  for (const ka of doc.key_activities ?? []) {
    keyActivities.add(ka.id);
  }

  return { customerSegments, valuePropositions, keyResources, keyActivities };
}

/**
 * Lint a BMCLang document for reference integrity issues.
 * Automatically detects v1 vs v2 and applies appropriate rules.
 */
export function lint(doc: BMCDocument | BMCDocumentV2): LintResult {
  const version = detectVersion(doc);

  if (version === 'v2') {
    return lintV2(doc as BMCDocumentV2);
  }

  return lintV1(doc as BMCDocument);
}

/**
 * Lint a v1 BMCLang document for reference integrity issues
 */
function lintV1(doc: BMCDocument): LintResult {
  const issues: LintIssue[] = [];
  const ids = buildIdMaps(doc);

  // Helper to add an error
  const addError = (rule: string, path: string, message: string) => {
    issues.push({ rule, severity: 'error', path, message });
  };

  // Helper to add a warning
  const addWarning = (rule: string, path: string, message: string) => {
    issues.push({ rule, severity: 'warning', path, message });
  };

  // Helper to check if a resource or activity exists
  const isValidResourceOrActivity = (id: ResourceOrActivityId): boolean => {
    return ids.keyResources.has(id) || ids.keyActivities.has(id);
  };

  // Rule: fits[].value_proposition must reference existing value_proposition
  // Rule: fits[].customer_segment must reference existing customer_segment
  // Rule: fits[].pain_relievers[].pain must reference pain in the referenced customer_segment
  // Rule: fits[].gain_creators[].gain must reference gain in the referenced customer_segment
  // Rule: fits[].job_addressers[].job must reference job in the referenced customer_segment
  // Rule: fits[].pain_relievers[].through must reference products_services in the referenced value_proposition
  // Rule: fits[].gain_creators[].through must reference products_services in the referenced value_proposition
  // Rule: fits[].job_addressers[].through must reference products_services in the referenced value_proposition
  for (let fitIdx = 0; fitIdx < (doc.fits ?? []).length; fitIdx++) {
    const fit = doc.fits![fitIdx];
    const fitPath = `/fits/${fitIdx}`;

    // Check value_proposition reference
    if (!ids.valuePropositions.has(fit.value_proposition)) {
      addError(
        'fit-value-proposition-ref',
        `${fitPath}/value_proposition`,
        `Value proposition '${fit.value_proposition}' does not exist`
      );
    }

    // Check customer_segment reference
    if (!ids.customerSegments.has(fit.customer_segment)) {
      addError(
        'fit-customer-segment-ref',
        `${fitPath}/customer_segment`,
        `Customer segment '${fit.customer_segment}' does not exist`
      );
    }

    const csData = ids.customerSegments.get(fit.customer_segment);
    const vpProducts = ids.valuePropositions.get(fit.value_proposition);

    // Check pain_relievers
    for (let prIdx = 0; prIdx < (fit.pain_relievers ?? []).length; prIdx++) {
      const pr = fit.pain_relievers![prIdx];
      const prPath = `${fitPath}/pain_relievers/${prIdx}`;

      // Check pain exists in the referenced customer segment
      if (csData && !csData.pains.has(pr.pain)) {
        addError(
          'fit-pain-ref',
          `${prPath}/pain`,
          `Pain '${pr.pain}' does not exist in customer segment '${fit.customer_segment}'`
        );
      }

      // Check through references exist in the referenced value proposition
      for (let throughIdx = 0; throughIdx < pr.through.length; throughIdx++) {
        const psId = pr.through[throughIdx];
        if (vpProducts && !vpProducts.has(psId)) {
          addError(
            'fit-through-ref',
            `${prPath}/through/${throughIdx}`,
            `Product/service '${psId}' does not exist in value proposition '${fit.value_proposition}'`
          );
        }
      }
    }

    // Check gain_creators
    for (let gcIdx = 0; gcIdx < (fit.gain_creators ?? []).length; gcIdx++) {
      const gc = fit.gain_creators![gcIdx];
      const gcPath = `${fitPath}/gain_creators/${gcIdx}`;

      // Check gain exists in the referenced customer segment
      if (csData && !csData.gains.has(gc.gain)) {
        addError(
          'fit-gain-ref',
          `${gcPath}/gain`,
          `Gain '${gc.gain}' does not exist in customer segment '${fit.customer_segment}'`
        );
      }

      // Check through references exist in the referenced value proposition
      for (let throughIdx = 0; throughIdx < gc.through.length; throughIdx++) {
        const psId = gc.through[throughIdx];
        if (vpProducts && !vpProducts.has(psId)) {
          addError(
            'fit-through-ref',
            `${gcPath}/through/${throughIdx}`,
            `Product/service '${psId}' does not exist in value proposition '${fit.value_proposition}'`
          );
        }
      }
    }

    // Check job_addressers
    for (let jaIdx = 0; jaIdx < (fit.job_addressers ?? []).length; jaIdx++) {
      const ja = fit.job_addressers![jaIdx];
      const jaPath = `${fitPath}/job_addressers/${jaIdx}`;

      // Check job exists in the referenced customer segment
      if (csData && !csData.jobs.has(ja.job)) {
        addError(
          'fit-job-ref',
          `${jaPath}/job`,
          `Job '${ja.job}' does not exist in customer segment '${fit.customer_segment}'`
        );
      }

      // Check through references exist in the referenced value proposition
      for (let throughIdx = 0; throughIdx < ja.through.length; throughIdx++) {
        const psId = ja.through[throughIdx];
        if (vpProducts && !vpProducts.has(psId)) {
          addError(
            'fit-through-ref',
            `${jaPath}/through/${throughIdx}`,
            `Product/service '${psId}' does not exist in value proposition '${fit.value_proposition}'`
          );
        }
      }
    }
  }

  // Rule: channels[].segments must reference existing customer_segments
  for (let chIdx = 0; chIdx < (doc.channels ?? []).length; chIdx++) {
    const channel = doc.channels![chIdx];
    for (let segIdx = 0; segIdx < (channel.segments ?? []).length; segIdx++) {
      const segId = channel.segments![segIdx];
      if (!ids.customerSegments.has(segId)) {
        addError(
          'channel-segment-ref',
          `/channels/${chIdx}/segments/${segIdx}`,
          `Customer segment '${segId}' does not exist`
        );
      }
    }
  }

  // Rule: customer_relationships[].segment must reference existing customer_segment
  for (let crIdx = 0; crIdx < (doc.customer_relationships ?? []).length; crIdx++) {
    const cr = doc.customer_relationships![crIdx];
    if (!ids.customerSegments.has(cr.segment)) {
      addError(
        'customer-relationship-segment-ref',
        `/customer_relationships/${crIdx}/segment`,
        `Customer segment '${cr.segment}' does not exist`
      );
    }
  }

  // Rule: revenue_streams[].from_segments must reference existing customer_segments
  // Rule: revenue_streams[].for_value must reference existing value_proposition
  for (let rsIdx = 0; rsIdx < (doc.revenue_streams ?? []).length; rsIdx++) {
    const rs = doc.revenue_streams![rsIdx];
    const rsPath = `/revenue_streams/${rsIdx}`;

    for (let segIdx = 0; segIdx < (rs.from_segments ?? []).length; segIdx++) {
      const segId = rs.from_segments![segIdx];
      if (!ids.customerSegments.has(segId)) {
        addError(
          'revenue-stream-segment-ref',
          `${rsPath}/from_segments/${segIdx}`,
          `Customer segment '${segId}' does not exist`
        );
      }
    }

    if (rs.for_value && !ids.valuePropositions.has(rs.for_value)) {
      addError(
        'revenue-stream-value-ref',
        `${rsPath}/for_value`,
        `Value proposition '${rs.for_value}' does not exist`
      );
    }
  }

  // Rule: key_resources[].for_value must reference existing value_propositions
  for (let krIdx = 0; krIdx < (doc.key_resources ?? []).length; krIdx++) {
    const kr = doc.key_resources![krIdx];
    for (let vpIdx = 0; vpIdx < (kr.for_value ?? []).length; vpIdx++) {
      const vpId = kr.for_value![vpIdx];
      if (!ids.valuePropositions.has(vpId)) {
        addError(
          'key-resource-value-ref',
          `/key_resources/${krIdx}/for_value/${vpIdx}`,
          `Value proposition '${vpId}' does not exist`
        );
      }
    }
  }

  // Rule: key_activities[].for_value must reference existing value_propositions
  for (let kaIdx = 0; kaIdx < (doc.key_activities ?? []).length; kaIdx++) {
    const ka = doc.key_activities![kaIdx];
    for (let vpIdx = 0; vpIdx < (ka.for_value ?? []).length; vpIdx++) {
      const vpId = ka.for_value![vpIdx];
      if (!ids.valuePropositions.has(vpId)) {
        addError(
          'key-activity-value-ref',
          `/key_activities/${kaIdx}/for_value/${vpIdx}`,
          `Value proposition '${vpId}' does not exist`
        );
      }
    }
  }

  // Rule: key_partnerships[].provides must reference existing resources or activities
  for (let kpIdx = 0; kpIdx < (doc.key_partnerships ?? []).length; kpIdx++) {
    const kp = doc.key_partnerships![kpIdx];
    for (let provIdx = 0; provIdx < (kp.provides ?? []).length; provIdx++) {
      const providesId = kp.provides![provIdx];
      if (!isValidResourceOrActivity(providesId)) {
        addError(
          'key-partnership-provides-ref',
          `/key_partnerships/${kpIdx}/provides/${provIdx}`,
          `Resource or activity '${providesId}' does not exist`
        );
      }
    }
  }

  // Rule: cost_structure.major_costs[].linked_to must reference existing resources or activities
  if (doc.cost_structure?.major_costs) {
    for (let costIdx = 0; costIdx < doc.cost_structure.major_costs.length; costIdx++) {
      const cost = doc.cost_structure.major_costs[costIdx];
      for (let linkIdx = 0; linkIdx < (cost.linked_to ?? []).length; linkIdx++) {
        const linkedId = cost.linked_to![linkIdx];
        if (!isValidResourceOrActivity(linkedId)) {
          addError(
            'cost-linked-to-ref',
            `/cost_structure/major_costs/${costIdx}/linked_to/${linkIdx}`,
            `Resource or activity '${linkedId}' does not exist`
          );
        }
      }
    }
  }

  // ============================================================================
  // Coverage warnings (non-blocking)
  // ============================================================================

  // Warning: Customer segment has no fits defined
  const segmentsWithFits = new Set<CustomerSegmentId>();
  for (const fit of doc.fits ?? []) {
    segmentsWithFits.add(fit.customer_segment);
  }

  for (let csIdx = 0; csIdx < (doc.customer_segments ?? []).length; csIdx++) {
    const cs = doc.customer_segments![csIdx];
    if (!segmentsWithFits.has(cs.id)) {
      addWarning(
        'segment-no-fits',
        `/customer_segments/${csIdx}`,
        `Customer segment '${cs.id}' has no fits defined`
      );
    }
  }

  return { issues, version: 'v1' };
}

/**
 * Lint a v2 BMML document for reference integrity issues
 */
function lintV2(doc: BMCDocumentV2): LintResult {
  const issues: LintIssue[] = [];
  const ids = buildIdMapsV2(doc);

  // Helper to add an error
  const addError = (rule: string, path: string, message: string) => {
    issues.push({ rule, severity: 'error', path, message });
  };

  // Helper to add a warning
  const addWarning = (rule: string, path: string, message: string) => {
    issues.push({ rule, severity: 'warning', path, message });
  };

  // ============================================================================
  // Fit validation (v2 pattern: for: { value_propositions: [], customer_segments: [] })
  // ============================================================================
  for (let fitIdx = 0; fitIdx < (doc.fits ?? []).length; fitIdx++) {
    const fit = doc.fits![fitIdx];
    const fitPath = `/fits/${fitIdx}`;

    // Check value_proposition references in for.value_propositions
    for (let vpIdx = 0; vpIdx < (fit.for?.value_propositions ?? []).length; vpIdx++) {
      const vpId = fit.for.value_propositions[vpIdx];
      if (!ids.valuePropositions.has(vpId)) {
        addError(
          'fit-value-proposition-ref',
          `${fitPath}/for/value_propositions/${vpIdx}`,
          `Value proposition '${vpId}' does not exist`
        );
      }
    }

    // Check customer_segment references in for.customer_segments
    for (let csIdx = 0; csIdx < (fit.for?.customer_segments ?? []).length; csIdx++) {
      const csId = fit.for.customer_segments[csIdx];
      if (!ids.customerSegments.has(csId)) {
        addError(
          'fit-customer-segment-ref',
          `${fitPath}/for/customer_segments/${csIdx}`,
          `Customer segment '${csId}' does not exist`
        );
      }
    }

    // Validate tuple mappings: [[reliever/creator, pain/gain], ...]
    for (let mapIdx = 0; mapIdx < (fit.mappings ?? []).length; mapIdx++) {
      const mapping = fit.mappings![mapIdx];
      const mapPath = `${fitPath}/mappings/${mapIdx}`;

      // Ensure mapping is a tuple of 2 elements
      if (!Array.isArray(mapping) || mapping.length !== 2) {
        addError(
          'fit-mapping-format',
          mapPath,
          `Mapping must be a tuple of [reliever/creator, pain/gain]`
        );
        continue;
      }

      const [left, right] = mapping;

      // Validate type inference and matching:
      // - pr-* with pain-* = pain relief (valid)
      // - gc-* with gain-* = gain creation (valid)
      // - pr-* with gain-* = error (type mismatch)
      // - gc-* with pain-* = error (type mismatch)
      const isPainReliever = typeof left === 'string' && left.startsWith('pr-');
      const isGainCreator = typeof left === 'string' && left.startsWith('gc-');
      const isPain = typeof right === 'string' && right.startsWith('pain-');
      const isGain = typeof right === 'string' && right.startsWith('gain-');

      if (isPainReliever && isGain) {
        addError(
          'fit-mapping-type-mismatch',
          mapPath,
          `Type mismatch: pain reliever '${left}' cannot be mapped to gain '${right}'. Pain relievers must map to pains.`
        );
      } else if (isGainCreator && isPain) {
        addError(
          'fit-mapping-type-mismatch',
          mapPath,
          `Type mismatch: gain creator '${left}' cannot be mapped to pain '${right}'. Gain creators must map to gains.`
        );
      }

      // Validate pain reliever scope: pr-* refs must exist in linked VP's value map
      if (isPainReliever) {
        let foundInAnyVP = false;
        for (const vpId of fit.for?.value_propositions ?? []) {
          const vpData = ids.valuePropositions.get(vpId);
          if (vpData?.painRelievers.has(left)) {
            foundInAnyVP = true;
            break;
          }
        }
        if (!foundInAnyVP && (fit.for?.value_propositions?.length ?? 0) > 0) {
          addError(
            'pain-reliever-scope-ref',
            `${mapPath}/0`,
            `Pain reliever '${left}' does not exist in any linked value proposition's value map`
          );
        }
      }

      // Validate gain creator scope: gc-* refs must exist in linked VP's value map
      if (isGainCreator) {
        let foundInAnyVP = false;
        for (const vpId of fit.for?.value_propositions ?? []) {
          const vpData = ids.valuePropositions.get(vpId);
          if (vpData?.gainCreators.has(left)) {
            foundInAnyVP = true;
            break;
          }
        }
        if (!foundInAnyVP && (fit.for?.value_propositions?.length ?? 0) > 0) {
          addError(
            'gain-creator-scope-ref',
            `${mapPath}/0`,
            `Gain creator '${left}' does not exist in any linked value proposition's value map`
          );
        }
      }

      // Validate pain/gain scope: must exist in linked customer segment's profile
      if (isPain) {
        let foundInAnyCS = false;
        for (const csId of fit.for?.customer_segments ?? []) {
          const csData = ids.customerSegments.get(csId);
          if (csData?.pains.has(right)) {
            foundInAnyCS = true;
            break;
          }
        }
        if (!foundInAnyCS && (fit.for?.customer_segments?.length ?? 0) > 0) {
          addError(
            'fit-pain-ref',
            `${mapPath}/1`,
            `Pain '${right}' does not exist in any linked customer segment's profile`
          );
        }
      }

      if (isGain) {
        let foundInAnyCS = false;
        for (const csId of fit.for?.customer_segments ?? []) {
          const csData = ids.customerSegments.get(csId);
          if (csData?.gains.has(right)) {
            foundInAnyCS = true;
            break;
          }
        }
        if (!foundInAnyCS && (fit.for?.customer_segments?.length ?? 0) > 0) {
          addError(
            'fit-gain-ref',
            `${mapPath}/1`,
            `Gain '${right}' does not exist in any linked customer segment's profile`
          );
        }
      }
    }
  }

  // ============================================================================
  // Channel validation (v2 pattern: for: { value_propositions: [], customer_segments: [] })
  // ============================================================================
  for (let chIdx = 0; chIdx < (doc.channels ?? []).length; chIdx++) {
    const channel = doc.channels![chIdx];
    const chPath = `/channels/${chIdx}`;

    // Check customer_segment references
    for (let csIdx = 0; csIdx < (channel.for?.customer_segments ?? []).length; csIdx++) {
      const csId = channel.for!.customer_segments![csIdx];
      if (!ids.customerSegments.has(csId)) {
        addError(
          'channel-segment-ref',
          `${chPath}/for/customer_segments/${csIdx}`,
          `Customer segment '${csId}' does not exist`
        );
      }
    }

    // Check value_proposition references (new in v2)
    for (let vpIdx = 0; vpIdx < (channel.for?.value_propositions ?? []).length; vpIdx++) {
      const vpId = channel.for!.value_propositions![vpIdx];
      if (!ids.valuePropositions.has(vpId)) {
        addError(
          'channel-value-ref',
          `${chPath}/for/value_propositions/${vpIdx}`,
          `Value proposition '${vpId}' does not exist`
        );
      }
    }
  }

  // ============================================================================
  // Customer relationship validation (v2 pattern: for: { customer_segments: [] })
  // ============================================================================
  for (let crIdx = 0; crIdx < (doc.customer_relationships ?? []).length; crIdx++) {
    const cr = doc.customer_relationships![crIdx];
    const crPath = `/customer_relationships/${crIdx}`;

    for (let csIdx = 0; csIdx < (cr.for?.customer_segments ?? []).length; csIdx++) {
      const csId = cr.for!.customer_segments![csIdx];
      if (!ids.customerSegments.has(csId)) {
        addError(
          'customer-relationship-segment-ref',
          `${crPath}/for/customer_segments/${csIdx}`,
          `Customer segment '${csId}' does not exist`
        );
      }
    }
  }

  // ============================================================================
  // Revenue stream validation (v2 pattern: from: { customer_segments: [] }, for: { value_propositions: [] })
  // ============================================================================
  for (let rsIdx = 0; rsIdx < (doc.revenue_streams ?? []).length; rsIdx++) {
    const rs = doc.revenue_streams![rsIdx];
    const rsPath = `/revenue_streams/${rsIdx}`;

    // Check from.customer_segments (who pays)
    for (let csIdx = 0; csIdx < (rs.from?.customer_segments ?? []).length; csIdx++) {
      const csId = rs.from!.customer_segments![csIdx];
      if (!ids.customerSegments.has(csId)) {
        addError(
          'revenue-stream-segment-ref',
          `${rsPath}/from/customer_segments/${csIdx}`,
          `Customer segment '${csId}' does not exist`
        );
      }
    }

    // Check for.value_propositions (what they pay for)
    for (let vpIdx = 0; vpIdx < (rs.for?.value_propositions ?? []).length; vpIdx++) {
      const vpId = rs.for!.value_propositions![vpIdx];
      if (!ids.valuePropositions.has(vpId)) {
        addError(
          'revenue-stream-value-ref',
          `${rsPath}/for/value_propositions/${vpIdx}`,
          `Value proposition '${vpId}' does not exist`
        );
      }
    }
  }

  // ============================================================================
  // Key resource validation (v2 pattern: for: { value_propositions: [] })
  // ============================================================================
  for (let krIdx = 0; krIdx < (doc.key_resources ?? []).length; krIdx++) {
    const kr = doc.key_resources![krIdx];
    const krPath = `/key_resources/${krIdx}`;

    for (let vpIdx = 0; vpIdx < (kr.for?.value_propositions ?? []).length; vpIdx++) {
      const vpId = kr.for!.value_propositions![vpIdx];
      if (!ids.valuePropositions.has(vpId)) {
        addError(
          'key-resource-value-ref',
          `${krPath}/for/value_propositions/${vpIdx}`,
          `Value proposition '${vpId}' does not exist`
        );
      }
    }
  }

  // ============================================================================
  // Key activity validation (v2 pattern: for: { value_propositions: [] })
  // ============================================================================
  for (let kaIdx = 0; kaIdx < (doc.key_activities ?? []).length; kaIdx++) {
    const ka = doc.key_activities![kaIdx];
    const kaPath = `/key_activities/${kaIdx}`;

    for (let vpIdx = 0; vpIdx < (ka.for?.value_propositions ?? []).length; vpIdx++) {
      const vpId = ka.for!.value_propositions![vpIdx];
      if (!ids.valuePropositions.has(vpId)) {
        addError(
          'key-activity-value-ref',
          `${kaPath}/for/value_propositions/${vpIdx}`,
          `Value proposition '${vpId}' does not exist`
        );
      }
    }
  }

  // ============================================================================
  // Key partnership validation (v2 pattern: for: { key_resources: [], key_activities: [] })
  // ============================================================================
  for (let kpIdx = 0; kpIdx < (doc.key_partnerships ?? []).length; kpIdx++) {
    const kp = doc.key_partnerships![kpIdx];
    const kpPath = `/key_partnerships/${kpIdx}`;

    // Check key_resources references
    for (let krIdx = 0; krIdx < (kp.for?.key_resources ?? []).length; krIdx++) {
      const krId = kp.for!.key_resources![krIdx];
      if (!ids.keyResources.has(krId)) {
        addError(
          'key-partnership-provides-ref',
          `${kpPath}/for/key_resources/${krIdx}`,
          `Key resource '${krId}' does not exist`
        );
      }
    }

    // Check key_activities references
    for (let kaIdx = 0; kaIdx < (kp.for?.key_activities ?? []).length; kaIdx++) {
      const kaId = kp.for!.key_activities![kaIdx];
      if (!ids.keyActivities.has(kaId)) {
        addError(
          'key-partnership-provides-ref',
          `${kpPath}/for/key_activities/${kaIdx}`,
          `Key activity '${kaId}' does not exist`
        );
      }
    }
  }

  // ============================================================================
  // Costs validation (v2 pattern: costs[] with for: { key_resources: [], key_activities: [] })
  // ============================================================================
  for (let costIdx = 0; costIdx < (doc.costs ?? []).length; costIdx++) {
    const cost = doc.costs![costIdx];
    const costPath = `/costs/${costIdx}`;

    // Check key_resources references
    for (let krIdx = 0; krIdx < (cost.for?.key_resources ?? []).length; krIdx++) {
      const krId = cost.for!.key_resources![krIdx];
      if (!ids.keyResources.has(krId)) {
        addError(
          'cost-linked-to-ref',
          `${costPath}/for/key_resources/${krIdx}`,
          `Key resource '${krId}' does not exist`
        );
      }
    }

    // Check key_activities references
    for (let kaIdx = 0; kaIdx < (cost.for?.key_activities ?? []).length; kaIdx++) {
      const kaId = cost.for!.key_activities![kaIdx];
      if (!ids.keyActivities.has(kaId)) {
        addError(
          'cost-linked-to-ref',
          `${costPath}/for/key_activities/${kaIdx}`,
          `Key activity '${kaId}' does not exist`
        );
      }
    }
  }

  // ============================================================================
  // Coverage warnings (non-blocking)
  // ============================================================================

  // Warning: Customer segment has no fits defined
  const segmentsWithFits = new Set<CustomerSegmentId>();
  for (const fit of doc.fits ?? []) {
    for (const csId of fit.for?.customer_segments ?? []) {
      segmentsWithFits.add(csId);
    }
  }

  for (let csIdx = 0; csIdx < (doc.customer_segments ?? []).length; csIdx++) {
    const cs = doc.customer_segments![csIdx];
    if (!segmentsWithFits.has(cs.id)) {
      addWarning(
        'segment-no-fits',
        `/customer_segments/${csIdx}`,
        `Customer segment '${cs.id}' has no fits defined`
      );
    }
  }

  return { issues, version: 'v2' };
}

/**
 * Lint a BMCLang document and return true if no errors were found
 */
export function lintIsValid(doc: BMCDocument | BMCDocumentV2): boolean {
  const result = lint(doc);
  return result.issues.filter((i) => i.severity === 'error').length === 0;
}

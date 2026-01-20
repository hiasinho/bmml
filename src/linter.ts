/**
 * BMCLang Linter
 * Validates semantic rules that JSON Schema cannot express,
 * primarily reference integrity between entities.
 */

import type {
  BMCDocument,
  CustomerSegmentId,
  ValuePropositionId,
  ProductServiceId,
  JobId,
  PainId,
  GainId,
  KeyResourceId,
  KeyActivityId,
  ResourceOrActivityId,
} from './types.js';

export interface LintIssue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path: string;
}

export interface LintResult {
  issues: LintIssue[];
}

/**
 * Build a map of all IDs in a document, organized by type
 */
interface IdMaps {
  customerSegments: Map<CustomerSegmentId, { jobs: Set<JobId>; pains: Set<PainId>; gains: Set<GainId> }>;
  valuePropositions: Map<ValuePropositionId, Set<ProductServiceId>>;
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
 * Lint a BMCLang document for reference integrity issues
 */
export function lint(doc: BMCDocument): LintResult {
  const issues: LintIssue[] = [];
  const ids = buildIdMaps(doc);

  // Helper to add an error
  const addError = (rule: string, path: string, message: string) => {
    issues.push({ rule, severity: 'error', path, message });
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

  return { issues };
}

/**
 * Lint a BMCLang document and return true if no errors were found
 */
export function lintIsValid(doc: BMCDocument): boolean {
  const result = lint(doc);
  return result.issues.filter((i) => i.severity === 'error').length === 0;
}

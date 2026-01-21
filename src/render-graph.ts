/**
 * Connection Graph for BMC Renderer
 *
 * Builds a map of element IDs to their connected customer segment IDs.
 * This determines the color of each sticky note in the rendered canvas.
 *
 * Connection traversal follows these paths:
 * - Customer Segments: direct (each connects to itself)
 * - Channels: via for.customer_segments
 * - Customer Relationships: via for.customer_segments
 * - Revenue Streams: via from.customer_segments
 * - Fits: via for.customer_segments (and links VPs to segments)
 * - Value Propositions: via fits that reference them
 * - Key Resources: via for.value_propositions → VP → Fits → CS
 * - Key Activities: via for.value_propositions → VP → Fits → CS
 * - Key Partnerships: via for.key_resources/key_activities → KR/KA → VP → Fits → CS
 * - Costs: via for.key_resources/key_activities → KR/KA → VP → Fits → CS
 */

import type { BMCDocumentV2 } from './types.js';

/**
 * Map from element ID to the set of customer segment IDs it connects to.
 * Elements with no connections will have an empty set (rendered as gray/orphaned).
 */
export type ConnectionGraph = Map<string, Set<string>>;

/**
 * Build a connection graph mapping each element ID to its connected customer segments.
 *
 * @param doc - A valid BMCDocumentV2
 * @returns Map where keys are element IDs and values are Sets of customer segment IDs
 */
export function buildConnectionGraph(doc: BMCDocumentV2): ConnectionGraph {
  const graph: ConnectionGraph = new Map();

  // Build lookup maps for efficient traversal
  const vpToSegments = buildVPToSegmentsMap(doc);
  const krToSegments = buildKRToSegmentsMap(doc, vpToSegments);
  const kaToSegments = buildKAToSegmentsMap(doc, vpToSegments);

  // 1. Customer Segments - each connects to itself
  for (const cs of doc.customer_segments ?? []) {
    graph.set(cs.id, new Set([cs.id]));
  }

  // 2. Value Propositions - via fits that reference them
  for (const vp of doc.value_propositions ?? []) {
    graph.set(vp.id, vpToSegments.get(vp.id) ?? new Set());
  }

  // 3. Fits - via for.customer_segments
  for (const fit of doc.fits ?? []) {
    const segments = new Set<string>(fit.for.customer_segments);
    graph.set(fit.id, segments);
  }

  // 4. Channels - via for.customer_segments
  for (const ch of doc.channels ?? []) {
    const segments = new Set<string>(ch.for?.customer_segments ?? []);
    graph.set(ch.id, segments);
  }

  // 5. Customer Relationships - via for.customer_segments
  for (const cr of doc.customer_relationships ?? []) {
    const segments = new Set<string>(cr.for?.customer_segments ?? []);
    graph.set(cr.id, segments);
  }

  // 6. Revenue Streams - via from.customer_segments
  for (const rs of doc.revenue_streams ?? []) {
    const segments = new Set<string>(rs.from?.customer_segments ?? []);
    graph.set(rs.id, segments);
  }

  // 7. Key Resources - via for.value_propositions → VP → Fits → CS
  for (const kr of doc.key_resources ?? []) {
    graph.set(kr.id, krToSegments.get(kr.id) ?? new Set());
  }

  // 8. Key Activities - via for.value_propositions → VP → Fits → CS
  for (const ka of doc.key_activities ?? []) {
    graph.set(ka.id, kaToSegments.get(ka.id) ?? new Set());
  }

  // 9. Key Partnerships - via for.key_resources/key_activities → KR/KA → VP → Fits → CS
  for (const kp of doc.key_partnerships ?? []) {
    const segments = new Set<string>();

    // Traverse through key_resources
    for (const krId of kp.for?.key_resources ?? []) {
      const krSegments = krToSegments.get(krId);
      if (krSegments) {
        for (const seg of krSegments) {
          segments.add(seg);
        }
      }
    }

    // Traverse through key_activities
    for (const kaId of kp.for?.key_activities ?? []) {
      const kaSegments = kaToSegments.get(kaId);
      if (kaSegments) {
        for (const seg of kaSegments) {
          segments.add(seg);
        }
      }
    }

    graph.set(kp.id, segments);
  }

  // 10. Costs - via for.key_resources/key_activities → KR/KA → VP → Fits → CS
  for (const cost of doc.costs ?? []) {
    const segments = new Set<string>();

    // Traverse through key_resources
    for (const krId of cost.for?.key_resources ?? []) {
      const krSegments = krToSegments.get(krId);
      if (krSegments) {
        for (const seg of krSegments) {
          segments.add(seg);
        }
      }
    }

    // Traverse through key_activities
    for (const kaId of cost.for?.key_activities ?? []) {
      const kaSegments = kaToSegments.get(kaId);
      if (kaSegments) {
        for (const seg of kaSegments) {
          segments.add(seg);
        }
      }
    }

    graph.set(cost.id, segments);
  }

  return graph;
}

/**
 * Build a map from Value Proposition ID to connected customer segments.
 * VPs connect to segments through fits that reference them.
 */
function buildVPToSegmentsMap(doc: BMCDocumentV2): Map<string, Set<string>> {
  const vpToSegments = new Map<string, Set<string>>();

  // Initialize all VPs with empty sets
  for (const vp of doc.value_propositions ?? []) {
    vpToSegments.set(vp.id, new Set());
  }

  // Populate from fits
  for (const fit of doc.fits ?? []) {
    const fitSegments = fit.for.customer_segments;

    for (const vpId of fit.for.value_propositions) {
      const existing = vpToSegments.get(vpId);
      if (existing) {
        for (const seg of fitSegments) {
          existing.add(seg);
        }
      } else {
        // VP referenced in fit but not defined - still track it
        vpToSegments.set(vpId, new Set(fitSegments));
      }
    }
  }

  return vpToSegments;
}

/**
 * Build a map from Key Resource ID to connected customer segments.
 * KRs connect to segments via: KR → for.value_propositions → VP → Fits → CS
 */
function buildKRToSegmentsMap(
  doc: BMCDocumentV2,
  vpToSegments: Map<string, Set<string>>
): Map<string, Set<string>> {
  const krToSegments = new Map<string, Set<string>>();

  for (const kr of doc.key_resources ?? []) {
    const segments = new Set<string>();

    for (const vpId of kr.for?.value_propositions ?? []) {
      const vpSegments = vpToSegments.get(vpId);
      if (vpSegments) {
        for (const seg of vpSegments) {
          segments.add(seg);
        }
      }
    }

    krToSegments.set(kr.id, segments);
  }

  return krToSegments;
}

/**
 * Build a map from Key Activity ID to connected customer segments.
 * KAs connect to segments via: KA → for.value_propositions → VP → Fits → CS
 */
function buildKAToSegmentsMap(
  doc: BMCDocumentV2,
  vpToSegments: Map<string, Set<string>>
): Map<string, Set<string>> {
  const kaToSegments = new Map<string, Set<string>>();

  for (const ka of doc.key_activities ?? []) {
    const segments = new Set<string>();

    for (const vpId of ka.for?.value_propositions ?? []) {
      const vpSegments = vpToSegments.get(vpId);
      if (vpSegments) {
        for (const seg of vpSegments) {
          segments.add(seg);
        }
      }
    }

    kaToSegments.set(ka.id, segments);
  }

  return kaToSegments;
}

/**
 * Get customer segment IDs in a consistent order (order of definition in doc).
 * Useful for assigning colors consistently.
 */
export function getSegmentOrder(doc: BMCDocumentV2): string[] {
  return (doc.customer_segments ?? []).map((cs) => cs.id);
}

/**
 * Check if an element is orphaned (has no customer segment connections).
 */
export function isOrphaned(graph: ConnectionGraph, elementId: string): boolean {
  const segments = graph.get(elementId);
  return !segments || segments.size === 0;
}

; BMML (Business Model Markup Language) syntax highlighting for tree-sitter-yaml
; These queries extend the base YAML highlighting with BMML-specific patterns.
;
; IMPORTANT: This file is meant to be used as an extension to tree-sitter-yaml.
; Configure Neovim to use 'yaml' parser for .bmml files and include these queries.

; === TOP-LEVEL SECTIONS (BMC Building Blocks) ===
; Highlight top-level YAML keys that are BMC sections

; BMC blocks
((block_mapping_pair
  key: (flow_node) @keyword
  (#match? @keyword "^(customer_segments|value_propositions|channels|customer_relationships|revenue_streams|key_resources|key_activities|key_partnerships|costs)$")))

; VPC elements
((block_mapping_pair
  key: (flow_node) @keyword
  (#match? @keyword "^(fits)$")))

; Metadata section
((block_mapping_pair
  key: (flow_node) @keyword.directive
  (#match? @keyword.directive "^(version|meta)$")))

; === NESTED STRUCTURE KEYS ===

; Profile elements (customer side)
((block_mapping_pair
  key: (flow_node) @type
  (#match? @type "^(jobs|pains|gains)$")))

; Value map elements (value side)
((block_mapping_pair
  key: (flow_node) @type
  (#match? @type "^(products_services|pain_relievers|gain_creators)$")))

; Relationship keys (v2 pattern)
((block_mapping_pair
  key: (flow_node) @keyword.operator
  (#match? @keyword.operator "^(for|from)$")))

; Relationship subkeys
((block_mapping_pair
  key: (flow_node) @property
  (#match? @property "^(value_propositions|customer_segments|key_resources|key_activities)$")))

; Fit mappings
((block_mapping_pair
  key: (flow_node) @keyword.operator
  (#match? @keyword.operator "^(mappings)$")))

; === ENTITY PROPERTY KEYS ===
((block_mapping_pair
  key: (flow_node) @property
  (#match? @property "^(id|name|description|tagline|created|updated|portfolio|stage|derived_from)$")))

; === ID PREFIXES (BMML entity identifiers) ===

; Customer segment IDs (cs-*)
((string_scalar) @constant
  (#match? @constant "^cs-[a-z0-9-]+$"))
((plain_scalar) @constant
  (#match? @constant "^cs-[a-z0-9-]+$"))

; Value proposition IDs (vp-*)
((string_scalar) @type.definition
  (#match? @type.definition "^vp-[a-z0-9-]+$"))
((plain_scalar) @type.definition
  (#match? @type.definition "^vp-[a-z0-9-]+$"))

; Job IDs (job-*)
((string_scalar) @string
  (#match? @string "^job-[a-z0-9-]+$"))
((plain_scalar) @string
  (#match? @string "^job-[a-z0-9-]+$"))

; Pain IDs (pain-*)
((string_scalar) @string.special
  (#match? @string.special "^pain-[a-z0-9-]+$"))
((plain_scalar) @string.special
  (#match? @string.special "^pain-[a-z0-9-]+$"))

; Gain IDs (gain-*)
((string_scalar) @number
  (#match? @number "^gain-[a-z0-9-]+$"))
((plain_scalar) @number
  (#match? @number "^gain-[a-z0-9-]+$"))

; Product/service IDs (ps-*)
((string_scalar) @function
  (#match? @function "^ps-[a-z0-9-]+$"))
((plain_scalar) @function
  (#match? @function "^ps-[a-z0-9-]+$"))

; Pain reliever IDs (pr-*)
((string_scalar) @string
  (#match? @string "^pr-[a-z0-9-]+$"))
((plain_scalar) @string
  (#match? @string "^pr-[a-z0-9-]+$"))

; Gain creator IDs (gc-*)
((string_scalar) @number
  (#match? @number "^gc-[a-z0-9-]+$"))
((plain_scalar) @number
  (#match? @number "^gc-[a-z0-9-]+$"))

; Fit IDs (fit-*)
((string_scalar) @keyword.function
  (#match? @keyword.function "^fit-[a-z0-9-]+$"))
((plain_scalar) @keyword.function
  (#match? @keyword.function "^fit-[a-z0-9-]+$"))

; Channel IDs (ch-*)
((string_scalar) @function.method
  (#match? @function.method "^ch-[a-z0-9-]+$"))
((plain_scalar) @function.method
  (#match? @function.method "^ch-[a-z0-9-]+$"))

; Customer relationship IDs (cr-*)
((string_scalar) @attribute
  (#match? @attribute "^cr-[a-z0-9-]+$"))
((plain_scalar) @attribute
  (#match? @attribute "^cr-[a-z0-9-]+$"))

; Revenue stream IDs (rs-*)
((string_scalar) @variable.builtin
  (#match? @variable.builtin "^rs-[a-z0-9-]+$"))
((plain_scalar) @variable.builtin
  (#match? @variable.builtin "^rs-[a-z0-9-]+$"))

; Key resource IDs (kr-*)
((string_scalar) @comment
  (#match? @comment "^kr-[a-z0-9-]+$"))
((plain_scalar) @comment
  (#match? @comment "^kr-[a-z0-9-]+$"))

; Key activity IDs (ka-*)
((string_scalar) @comment
  (#match? @comment "^ka-[a-z0-9-]+$"))
((plain_scalar) @comment
  (#match? @comment "^ka-[a-z0-9-]+$"))

; Key partnership IDs (kp-*)
((string_scalar) @comment
  (#match? @comment "^kp-[a-z0-9-]+$"))
((plain_scalar) @comment
  (#match? @comment "^kp-[a-z0-9-]+$"))

; Cost IDs (cost-*)
((string_scalar) @exception
  (#match? @exception "^cost-[a-z0-9-]+$"))
((plain_scalar) @exception
  (#match? @exception "^cost-[a-z0-9-]+$"))

; === VERSION STRING ===
((string_scalar) @constant
  (#match? @constant "^2\\.0$"))
((plain_scalar) @constant
  (#match? @constant "^2\\.0$"))

; === PORTFOLIO VALUES ===
((string_scalar) @boolean
  (#match? @boolean "^(explore|exploit)$"))
((plain_scalar) @boolean
  (#match? @boolean "^(explore|exploit)$"))

; === STAGE VALUES ===
; Explore and exploit stages
((string_scalar) @constant
  (#match? @constant "^(ideation|discovery|validation|acceleration|transfer|improve|grow|sustain|retire)$"))
((plain_scalar) @constant
  (#match? @constant "^(ideation|discovery|validation|acceleration|transfer|improve|grow|sustain|retire)$"))

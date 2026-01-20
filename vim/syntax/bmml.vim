" Vim syntax file
" Language: BMML (Business Model Markup Language)
" Maintainer: Hiasinho
" Version: 2.0
" URL: https://github.com/bmclang/bmclang
"
" BMML is a YAML-based format for describing business models.
" This syntax builds on YAML and adds BMML-specific highlighting.

if exists("b:current_syntax")
  finish
endif

" Load YAML syntax as base
runtime! syntax/yaml.vim
unlet! b:current_syntax

" === TOP-LEVEL SECTIONS (BMC Building Blocks) ===
" These are the 9 blocks of the Business Model Canvas plus VPC elements

" BMC blocks
syn match bmmlSection "^\(customer_segments\|value_propositions\|channels\|customer_relationships\|revenue_streams\|key_resources\|key_activities\|key_partnerships\|costs\):" contains=yamlBlockMappingKey
" VPC elements
syn match bmmlSection "^\(fits\):" contains=yamlBlockMappingKey
" Metadata
syn match bmmlSection "^\(version\|meta\):" contains=yamlBlockMappingKey

" === NESTED STRUCTURE KEYS ===
" Profile elements (customer side)
syn match bmmlProfileKey "^\s\+\(jobs\|pains\|gains\):" contains=yamlBlockMappingKey
" Value map elements (value side)
syn match bmmlValueMapKey "^\s\+\(products_services\|pain_relievers\|gain_creators\):" contains=yamlBlockMappingKey
" Relationship keys (v2 pattern)
syn match bmmlRelationKey "^\s\+\(for\|from\):" contains=yamlBlockMappingKey
syn match bmmlRelationSubkey "^\s\+\(value_propositions\|customer_segments\|key_resources\|key_activities\):" contains=yamlBlockMappingKey
" Fit mappings
syn match bmmlMappingsKey "^\s\+mappings:" contains=yamlBlockMappingKey

" === ENTITY PROPERTY KEYS ===
syn match bmmlPropertyKey "^\s\+\(id\|name\|description\|tagline\|created\|updated\|portfolio\|stage\|derived_from\):" contains=yamlBlockMappingKey

" === ID PREFIXES (BMML entity identifiers) ===
" Customer side
syn match bmmlIdCS "\<cs-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdJob "\<job-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdPain "\<pain-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdGain "\<gain-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
" Value side
syn match bmmlIdVP "\<vp-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdPS "\<ps-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdPR "\<pr-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdGC "\<gc-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
" Fit
syn match bmmlIdFit "\<fit-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
" Delivery
syn match bmmlIdCH "\<ch-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdCR "\<cr-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdRS "\<rs-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
" Infrastructure
syn match bmmlIdKR "\<kr-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdKA "\<ka-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdKP "\<kp-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar
syn match bmmlIdCost "\<cost-[a-z0-9-]\+\>" contained containedin=yamlFlowString,yamlPlainScalar

" === VERSION STRING ===
syn match bmmlVersion '"2\.0"' contained containedin=yamlFlowString,yamlPlainScalar

" === PORTFOLIO VALUES ===
syn keyword bmmlPortfolio explore exploit contained containedin=yamlFlowString,yamlPlainScalar

" === STAGE VALUES ===
" Explore stages
syn keyword bmmlStage ideation discovery validation acceleration contained containedin=yamlFlowString,yamlPlainScalar
" Exploit stages
syn keyword bmmlStage improve grow sustain retire contained containedin=yamlFlowString,yamlPlainScalar
" Shared stage
syn keyword bmmlStage transfer contained containedin=yamlFlowString,yamlPlainScalar

" === HIGHLIGHTING ===

" Top-level sections - bold blue
hi def link bmmlSection Keyword

" Nested structure keys - purple/violet
hi def link bmmlProfileKey Type
hi def link bmmlValueMapKey Type
hi def link bmmlRelationKey Special
hi def link bmmlRelationSubkey Identifier
hi def link bmmlMappingsKey Special

" Property keys - normal (inherit from YAML)
hi def link bmmlPropertyKey yamlBlockMappingKey

" Customer segment IDs - green
hi def link bmmlIdCS Constant
" Jobs/Pains/Gains IDs - orange/yellow shades
hi def link bmmlIdJob String
hi def link bmmlIdPain WarningMsg
hi def link bmmlIdGain Number

" Value proposition IDs - cyan/teal
hi def link bmmlIdVP Type
" Product/Service, Pain Reliever, Gain Creator IDs
hi def link bmmlIdPS PreProc
hi def link bmmlIdPR String
hi def link bmmlIdGC Number

" Fit IDs - magenta
hi def link bmmlIdFit Special

" Delivery IDs - blue shades
hi def link bmmlIdCH Function
hi def link bmmlIdCR Identifier
hi def link bmmlIdRS Statement

" Infrastructure IDs - gray/muted
hi def link bmmlIdKR Comment
hi def link bmmlIdKA Comment
hi def link bmmlIdKP Comment
hi def link bmmlIdCost Exception

" Version and portfolio values
hi def link bmmlVersion Constant
hi def link bmmlPortfolio Boolean
hi def link bmmlStage Constant

let b:current_syntax = "bmml"

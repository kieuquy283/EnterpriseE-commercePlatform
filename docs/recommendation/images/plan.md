# H&M image pipeline plan

Scope: selected H&M articles already mapped to Medusa Products. Process assets locally, then attach through Medusa File Module and product workflow in a private test environment. No CSV, image binary, credential or private artifact is committed.

Order: (00) verify source and rights; (01) manifest; (02) bounded acquisition; (03) validation; (04) optimization; (05) Medusa media import; (06) storefront/system verification. Kaggle authentication is currently a gate for real-image phases. Fixture tests can proceed independently but never substitute for real-data acceptance.

Recovery: rerun deterministic preparation, retry failed image requests, then resume Medusa import using its local journal. Product media rollback uses `before_update` journal entries; keep the journal and uploaded files private. No commerce records are deleted.

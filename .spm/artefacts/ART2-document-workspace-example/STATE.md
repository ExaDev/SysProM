---
title: "STATE"
doc_type: "state"
---

# STATE

## Elements

### ELEM1 — Transformation Engine

- Realises: [CON1](./INTENT.md#con1--document-transformation)

### ELEM2 — Document Store

- Realises: [CON2](./INTENT.md#con2--document-persistence)

## Realisations

### REAL1 — Local Conversion

- Implements: [ELEM1](#elem1--transformation-engine)

- Status: active

### REAL2 — Remote Conversion

- Implements: [ELEM1](#elem1--transformation-engine)

- Status: active

### REAL3 — Local Storage

- Implements: [ELEM2](#elem2--document-store)

- Status: active

### REAL4 — Remote Storage

- Implements: [ELEM2](#elem2--document-store)

- Status: active


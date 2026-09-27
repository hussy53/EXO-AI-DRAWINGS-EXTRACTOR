# Exo AI Drawings Extractor

Browser-based drawing takeoff workspace for EXO Glass & Aluminium.

## Live app

[Open Exo AI Drawings Extractor](https://exo-drawings-extractor.saifeeh74.chatgpt.site)

## Current V1 capabilities

- Upload PDF plans, sections, elevations, and detail drawings
- Detect mirror, glass partition, glass door, and aluminium callouts
- Read native PDF text and use OCR for CAD-plotted annotations and dimensions
- Propose reviewable takeoff items with confidence and source-page information
- Edit, duplicate, manually create, delete, and approve items
- Warn about missing dimensions and material specifications
- Export approved takeoff items to CSV
- Process drawings locally in the browser

## Known limitations

- Drawing conventions vary, so every proposed item requires human verification
- CAD vector dimensions and poor scans may need manual confirmation
- Project history is not yet persisted between browser sessions
- Direct quotation-generator integration is planned for a later milestone

## Local development

Requirements: Node.js 22.13 or newer.

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

Create a production build with:

```powershell
npm run build
```

## Project location

The local project is maintained separately from Exo Quotation Generator under the `Exo Apps` folder.

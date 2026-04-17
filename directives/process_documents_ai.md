# Directive: AI Document Processing

## Overview
This directive defines the workflow for processing uploaded documents using Azure Document Intelligence and Azure OpenAI to verify authenticity and extract structured data.

## Input
- `document_id`: The ID of the document in the SQL database.
- `blob_url`: The URL (SAS or public) to the document in storage.
- `doc_type`: The expected type of document (e.g., `GOV_ID`, `OFFER_LETTER`).

## Tools / Scripts
- `execution/verify_document_authenticity.py`: Logic for calling Azure Document Intelligence and OpenAI.

## Workflow
1. **Trigger**: Triggered via Node.js backend after `confirm-upload` or via manual retry.
2. **Analysis**: 
   - Call `execution/verify_document_authenticity.py` with the document URL.
   - Script uses Azure Document Intelligence to extract text and structure.
   - Script uses OpenAI (if needed) to cross-verify keywords (e.g., "OnboardIQ", "Offer Letter", User Name).
3. **Database Update**:
   - Update `documents` table:
     - `ai_validation_status`: `valid`, `flagged`, or `error`.
     - `ai_summary`: JSON summary of extracted fields.
     - `status`: `verified` (if successful) or `rejected` (if failed).
4. **Error Handling**:
   - If AI fails, set `ai_validation_status` to `error` and notify HR.

## Edge Cases
- **Low Confidence**: If OCR confidence is low, flag for manual review.
- **Wrong Document**: If the extracted document type doesn't match `doc_type`, flag as `rejected`.
- **Expired SAS**: Ensure the URL provided to the script is valid.

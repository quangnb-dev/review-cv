## ADDED Requirements

### Requirement: Upload CV file
The system SHALL accept CV file uploads in PDF and DOCX formats with a maximum file size of 5MB. The upload area SHALL support drag-and-drop and click-to-browse.

#### Scenario: Successful PDF upload
- **WHEN** user uploads a valid PDF file under 5MB
- **THEN** system extracts text content using pdf-parse and stores it in memory for analysis

#### Scenario: Successful DOCX upload
- **WHEN** user uploads a valid DOCX file under 5MB
- **THEN** system extracts text content using mammoth and stores it in memory for analysis

#### Scenario: File exceeds size limit
- **WHEN** user uploads a file larger than 5MB
- **THEN** system displays error "File size exceeds 5MB limit. Please upload a smaller file or paste your CV text directly."

#### Scenario: Unsupported file format
- **WHEN** user uploads a file that is not PDF or DOCX
- **THEN** system displays error "Unsupported format. Please upload a PDF or DOCX file, or paste your CV text directly."

#### Scenario: PDF parsing fails
- **WHEN** system cannot extract text from a PDF (e.g., scanned image PDF, corrupted file)
- **THEN** system displays error "Could not read this PDF. It may be image-based or corrupted. Please paste your CV text directly." and highlights the text paste area

#### Scenario: DOCX parsing fails
- **WHEN** system cannot extract text from a DOCX file
- **THEN** system displays error "Could not read this DOCX file. Please paste your CV text directly." and highlights the text paste area

### Requirement: Paste CV text
The system SHALL provide a textarea for users to paste CV content directly as plain text. This serves as both a primary input method and a fallback when file parsing fails.

#### Scenario: User pastes CV text
- **WHEN** user pastes text into the CV textarea
- **THEN** system accepts the text as CV content for analysis

#### Scenario: User provides both file and text
- **WHEN** user uploads a file AND pastes text
- **THEN** system uses the most recently provided input (file upload replaces text, new text replaces file)

### Requirement: Paste Job Description
The system SHALL provide a textarea for users to paste the target job description as plain text.

#### Scenario: User pastes JD
- **WHEN** user pastes text into the JD textarea
- **THEN** system accepts the text as the job description for analysis

### Requirement: Input validation before analysis
The system SHALL validate that both CV content and JD content are provided before allowing analysis.

#### Scenario: Missing JD
- **WHEN** user has CV content but JD textarea is empty
- **THEN** the Analyze button is disabled and a hint "Please enter a Job Description" is shown

#### Scenario: Missing CV
- **WHEN** user has JD content but no CV (no file uploaded and no text pasted)
- **THEN** the Analyze button is disabled and a hint "Please upload or paste your CV" is shown

#### Scenario: CV content too short
- **WHEN** user provides CV content with fewer than 50 words
- **THEN** system shows a warning "Your CV seems very short. Results may not be accurate. Continue anyway?" with options to continue or go back

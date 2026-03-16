## ADDED Requirements

### Requirement: On-demand section rewrite
The system SHALL allow users to request an AI-generated rewrite for any suggestion by clicking a "Rewrite this" button. The rewrite call is a separate Claude API call made only when requested.

#### Scenario: User requests rewrite
- **WHEN** user clicks "Rewrite this" on a suggestion
- **THEN** system calls Claude API with the original CV section, the JD, and the suggestion context, and returns an improved version of that section

#### Scenario: Rewrite displayed inline
- **WHEN** rewrite completes successfully
- **THEN** the rewritten text expands inline below the suggestion with a "Copy" button

#### Scenario: Rewrite loading state
- **WHEN** rewrite API call is in progress
- **THEN** the "Rewrite this" button shows a spinner and is disabled. Other "Rewrite this" buttons remain clickable.

#### Scenario: Rewrite fails
- **WHEN** rewrite API call fails after 2 silent retries
- **THEN** system shows inline error "Rewrite failed. Try again." with a retry button replacing the spinner

### Requirement: Copy rewritten text
The system SHALL provide a "Copy" button next to each completed rewrite that copies the rewritten text to the clipboard.

#### Scenario: Successful copy
- **WHEN** user clicks "Copy" on a rewrite
- **THEN** text is copied to clipboard and button briefly shows "Copied!" for 2 seconds before reverting to "Copy"

#### Scenario: Copy fails
- **WHEN** clipboard API is unavailable
- **THEN** the rewritten text is selected/highlighted so user can manually copy with Ctrl+C

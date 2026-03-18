# CODEX.md — Product Nuances & UX Priorities for Pipemailer

## Goal
Make Pipemailer feel effortless for sales users by improving email capture, context, and control in the pipeline workflow.

---

## Core UX Principles

1. **Zero-friction input**
   - Users should be able to paste/write free-form emails naturally without fighting formatting.
   - The system should help structure content *after* input, not force structure upfront.

2. **Context-first workflow**
   - Every email should feel connected to a deal and visible in deal context.
   - Users should never wonder, “Where did this email go?”

3. **Reversible interactions**
   - Every input modal/box should be closable.
   - Users must be able to cancel/undo without losing control of the page.

4. **Fast scanning**
   - Pipeline views should surface communication history quickly (latest email, last touch date, unread/reply status).

---

## Priority Improvements

## 1) Better Free-Text Email Field (High Priority)

### Problems today
- Free text likely feels rigid or too plain.
- Users may lose formatting when pasting from Gmail/Outlook.
- No smart assist for extracting useful metadata (subject, sender, timestamp, action items).

### Desired behavior
- Multi-line rich text area with:
  - Paste support (plain + rich text fallback)
  - Auto-resize
  - Keyboard shortcuts (`Cmd/Ctrl + Enter` save, `Esc` close if safe)
  - Draft persistence while editing (session/local)
- Optional parsing:
  - Detect quoted threads
  - Suggest subject/sender/date extraction
  - Highlight links, emails, phone numbers
- Clear distinction between:
  - **Raw email body**
  - **Internal note/comment**

### Acceptance criteria
- Pasted email keeps readable structure (line breaks, bullet points).
- User can save or cancel without data corruption.
- No accidental loss of draft when clicking outside (unless confirmed).

---

## 2) Show Emails Aligned to a Deal in Pipeline (High Priority)

### Problems today
- Emails may be disconnected from the pipeline card/deal object.
- Reps can’t quickly audit communication cadence per deal.

### Desired behavior
- Each deal card has a lightweight “Email Activity” indicator:
  - Last email date/time
  - Direction (sent/received)
  - Count (e.g., “12 emails”)
- Deal detail panel includes chronological timeline:
  - Emails + notes + status changes in one stream
  - Filters: all / sent / received / internal notes
- Search and jump:
  - “Show me all emails for Deal X”
  - “Show deals with no email in 14 days”

### Acceptance criteria
- From any pipeline deal, user can view associated emails in <= 2 clicks.
- Timeline ordering is correct and timezone-consistent.
- Email-to-deal linkage is visible and editable.

---

## 3) Close/Dismiss “Add Email” Box (Must Fix)

### Problems today
- Add email UI may trap the user or lack clear dismiss path.
- Ambiguous close behavior causes frustration and accidental data loss.

### Desired behavior
- Always include:
  - Visible close `X`
  - `Cancel` button
  - `Esc` keyboard support
- If content is unsaved:
  - Prompt: **Discard draft?** (Discard / Keep editing)
- If no content:
  - Close immediately with no prompt
- Optional setting:
  - “Remember drafts when closed”

### Acceptance criteria
- Users can always exit add-email flow.
- Unsaved content is protected via confirmation.
- Closing behavior is consistent across desktop breakpoints.

---

## Supporting Enhancements (Next Wave)

1. **Auto-linking logic**
   - Match incoming emails to deal by contact email/domain + confidence score.
2. **Deal health indicators**
   - “No reply in X days,” “Waiting on customer,” “High activity.”
3. **Inline quick actions**
   - Convert email to task, reminder, follow-up sequence.
4. **Collaboration**
   - @mentions in internal notes attached to email thread.
5. **Auditability**
   - Track who added/edited emails and when.

---

## Suggested UI Patterns

- **Add Email Drawer (right side)** instead of modal for better context retention.
- **Activity timeline** in deal detail with sticky filters.
- **Compact summary chips** on pipeline cards:
  - `Last email: 2d ago`
  - `Unread`
  - `Waiting on reply`

---

## Data Model Notes (Implementation Guidance)

Minimum entities/relations:
- `deal`
- `email_message`
- `deal_email_link`
- `email_participant` (from/to/cc/bcc)
- `activity_event` (for timeline unification)

Key fields for `email_message`:
- `id`, `subject`, `body_raw`, `body_rendered`
- `direction` (inbound/outbound)
- `sent_at`, `received_at`, `created_by`
- `source` (manual, import, sync)
- `thread_id`, `external_message_id`

---

## Metrics to Track Success

1. Time to add an email note (median).
2. % deals with at least one linked email.
3. % add-email sessions canceled vs completed.
4. Accidental discard rate.
5. Weekly active users viewing deal email timelines.
6. Deals with no touch > 14 days (should decrease).

---

## UX Copy Suggestions

- **Add email placeholder:**  
  “Paste or type the email here. We’ll keep formatting and link it to this deal.”

- **Unsaved warning:**  
  “You have unsaved email content. Discard or keep editing?”

- **Timeline empty state:**  
  “No emails yet for this deal. Add one to keep communication history centralized.”

---

## Definition of “Vastly Improved”

Pipemailer feels vastly improved when:
- Adding email is as easy as writing in a notes app.
- Every deal clearly shows communication context.
- Users never feel trapped in an input UI.
- Sales reps can trust the pipeline reflects real conversation history.

---

## Open Questions

1. Should email syncing (Gmail/Outlook) be in scope now or later?
2. Is rich text required at launch, or plain text with strong formatting preservation?
3. Should timeline include calls/meetings now, or email-only first?
4. What is the canonical source of truth for thread IDs?
5. Should closing the add-email box auto-save drafts by default?

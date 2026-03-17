# CLAUDE.md — PipeMailer: Unified Email + Pipedrive SPA

## Project Overview

**PipeMailer** is a single-page application (SPA) that merges email management with Pipedrive CRM deal management into a single unified interface. Users can read and reply to emails, view and manage deals, move deals through pipeline stages, link emails to deals, and perform all core actions from one screen — without switching between tools.

All data is dummy/mock data. No real API integration is required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Components | **DevExtreme jQuery** (CDN) |
| Core JS | jQuery 3.x (CDN) |
| Fonts | Google Fonts CDN |
| Icons | DevExtreme built-in icon set + Material Symbols CDN |
| Styling | Custom CSS with CSS variables |
| Data | In-memory JavaScript mock data objects |
| Build | **No build tool** — single `index.html` file, all inline or CDN |

### DevExtreme CDN Links (always use these exact versions)

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn3.devexpress.com/jslib/23.2.5/css/dx.material.blue.dark.min.css">

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- DevExtreme JS -->
<script src="https://cdn3.devexpress.com/jslib/23.2.5/js/dx.all.js"></script>
```

---

## Aesthetic Direction

**Theme: Refined Dark Productivity Tool**

- **Palette**: Deep navy/slate backgrounds (`#0d1117`, `#161b22`, `#21262d`), electric teal accent (`#00d4aa`), warm amber for alerts (`#f59e0b`), soft red for urgent (`#ef4444`)
- **Typography**: `'DM Mono'` for data/labels (monospace precision feel), `'DM Sans'` for UI text — both from Google Fonts
- **Feel**: Professional SaaS, dense but breathable. Think Linear or Superhuman — dark, fast, purposeful
- **Layout**: Three-column master layout — left sidebar (navigation/deal pipeline), center panel (email list), right panel (email detail / deal detail). Panels resize via DevExtreme Splitter
- **Motion**: Subtle fade-in on panel transitions, smooth deal card drag-and-drop, loading skeletons on simulated fetch

---

## File Structure

```
index.html          ← Single deliverable file (all CSS, JS inline + CDN)
CLAUDE.md           ← This file
```

The entire app lives in **one `index.html` file**. No modules, no bundler, no separate CSS files.

---

## Application Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  TOPBAR: PipeMailer logo | Search | User avatar | Notifications    │
├──────────────┬──────────────────────────┬──────────────────────────┤
│  LEFT PANEL  │    CENTER PANEL          │   RIGHT PANEL            │
│  (280px)     │    (flex)                │   (420px)                │
│              │                          │                          │
│  Navigation  │   Email List             │   Email Detail           │
│  ─────────── │   (dxList)               │   OR                     │
│  Inbox (12)  │                          │   Deal Detail            │
│  Sent        │   Each row:              │                          │
│  Drafts      │   - Sender avatar        │   Switches based on      │
│  ─────────── │   - Subject              │   what was last clicked  │
│  PIPELINE    │   - Preview snippet      │                          │
│  ─────────── │   - Date                 │                          │
│  Leads (4)   │   - Deal tag badge       │                          │
│  Qualified   │   - Unread dot           │                          │
│  Proposal    │                          │                          │
│  Won         │                          │                          │
│  Lost        │                          │                          │
│              │                          │                          │
│  DEALS       │                          │                          │
│  Kanban view │                          │                          │
│  (toggle)    │                          │                          │
└──────────────┴──────────────────────────┴──────────────────────────┘
```

---

## Views / Modes

The app has two primary **view modes**, toggled via the left sidebar:

### 1. Email View (default)
- Center panel shows email list (`dxList`)
- Right panel shows selected email detail with reply composer
- Emails can be tagged with a Pipedrive deal (shown as a badge)
- Reply action opens a `dxPopup` compose window
- Forward action available

### 2. Pipeline / Deals View
- Center panel shows a **Kanban board** (`dxSortable` + custom cards) with columns per stage
- Right panel shows selected deal detail (contact, value, activity log)
- Drag deals between stage columns to move pipeline stage
- Add note action opens a `dxPopup`
- "Link Email" button in deal detail opens a `dxPopup` to browse and link emails

---

## DevExtreme Components Used

| Component | Usage |
|---|---|
| `dxList` | Email list in center panel |
| `dxTextBox` | Search bar, compose fields |
| `dxTextArea` | Email reply body |
| `dxButton` | All action buttons |
| `dxPopup` | Compose email, add note, move deal confirmation |
| `dxTabPanel` or `dxTabs` | Right panel tabs: "Email Detail" / "Deal Info" |
| `dxScrollView` | Email thread scroll, deal activity feed |
| `dxBadge` (via template) | Unread count, deal stage badges |
| `dxSelectBox` | Pipeline stage selector in deal detail |
| `dxToolbar` | Top bar and panel action bars |
| `dxSortable` | Kanban drag-and-drop for deal cards |
| `dxDropDownButton` | "More actions" menus |
| `dxTagBox` | Deal tags / email labels |
| `dxLoadIndicator` | Simulated loading states |
| `dxToast` | Success/error notifications |
| `dxSplitter` | Resizable three-column layout |
| `dxAccordion` | Deal activity history accordion |

---

## Dummy Data Schema

### Emails (`window.mockEmails`)

```javascript
{
  id: 1,
  from: { name: "Sarah Mitchell", email: "sarah.mitchell@technova.com", avatar: "SM" },
  to: ["george.davies@midwich.com"],
  cc: [],
  subject: "Re: Q2 Hardware Distribution Proposal",
  body: "Hi George, Thanks for sending over the updated proposal...",
  bodyHtml: "<p>Hi George,</p><p>Thanks for sending over...</p>",
  date: "2026-03-17T09:42:00Z",
  isRead: false,
  isStarred: true,
  folder: "inbox",               // inbox | sent | drafts | archive
  dealId: 3,                     // linked Pipedrive deal (null if none)
  thread: [/* array of message objects */],
  labels: ["proposal", "urgent"]
}
```

### Deals (`window.mockDeals`)

```javascript
{
  id: 1,
  title: "TechNova AV Distribution — Q2",
  value: 48500,
  currency: "GBP",
  stage: "proposal",             // lead | qualified | proposal | negotiation | won | lost
  owner: "George Davies",
  contact: {
    name: "Sarah Mitchell",
    email: "sarah.mitchell@technova.com",
    phone: "+44 7700 900123",
    company: "TechNova Ltd"
  },
  probability: 65,
  expectedCloseDate: "2026-04-30",
  linkedEmailIds: [1, 4, 7],
  activities: [
    { type: "email", date: "2026-03-17T09:42:00Z", note: "Received Q2 proposal response" },
    { type: "call", date: "2026-03-15T14:00:00Z", note: "Discovery call — 45 mins" },
    { type: "note", date: "2026-03-10T11:00:00Z", note: "Decision maker is CFO, budget confirmed" }
  ],
  tags: ["AV", "distribution", "enterprise"],
  createdAt: "2026-02-01T10:00:00Z"
}
```

### Pipeline Stages (`window.pipelineStages`)

```javascript
[
  { id: "lead",        label: "Lead",        color: "#6b7280", order: 1 },
  { id: "qualified",   label: "Qualified",   color: "#3b82f6", order: 2 },
  { id: "proposal",    label: "Proposal",    color: "#f59e0b", order: 3 },
  { id: "negotiation", label: "Negotiation", color: "#8b5cf6", order: 4 },
  { id: "won",         label: "Won",         color: "#10b981", order: 5 },
  { id: "lost",        label: "Lost",        color: "#ef4444", order: 6 }
]
```

---

## Minimum Dummy Data Requirements

Populate these counts in mock data:

- **Emails**: 18 emails across inbox (12), sent (4), drafts (2)
- **Deals**: 10 deals spread across all 6 pipeline stages
- **Contacts**: At least 6 unique contacts (reused across emails + deals)
- **Threads**: 3 emails should have multi-message threads (2–4 messages each)

---

## Feature Specifications

### Email Actions
- **Reply**: Opens inline compose area below the email thread (not a popup). Has To (pre-filled), Subject (pre-filled Re:), Body textarea, Send button
- **Reply All**: Same as reply, CC field pre-filled
- **Forward**: Opens compose popup with forwarded body pre-filled
- **Star/Unstar**: Toggle star, updates list item
- **Mark read/unread**: Toggle, updates unread dot
- **Delete**: Removes from list with `dxToast` confirmation
- **Link to Deal**: Opens `dxPopup` with deal search/select via `dxSelectBox`
- **Archive**: Moves to archive folder

### Deal Actions
- **Move Stage**: Drag card on Kanban OR use `dxSelectBox` in deal detail. On change, show `dxToast` "Deal moved to [Stage]"
- **Add Note**: Button opens `dxPopup` with `dxTextArea`. On save, appends to activity log
- **Edit Value**: Inline `dxNumberBox` in deal detail
- **Link Email**: Browse and link an existing email to the deal
- **Mark Won / Mark Lost**: Quick action buttons with confirmation `dxPopup`
- **View Linked Emails**: Tab in right panel shows list of linked emails; clicking navigates to that email

### Compose New Email
- Toolbar button "Compose" opens a `dxPopup` (600×500px)
- Fields: To (`dxTagBox`), CC (`dxTextBox`), Subject (`dxTextBox`), Body (`dxTextArea`), Link to Deal (`dxSelectBox`)
- Send simulates async send with `dxLoadIndicator` then success `dxToast`

### Search
- Global search `dxTextBox` in topbar
- Searches across email subjects, sender names, deal titles simultaneously
- Results shown in a `dxPopup` results panel with two sections (Emails / Deals)

---

## State Management

Use a simple global state object:

```javascript
window.AppState = {
  currentView: "email",          // "email" | "pipeline"
  selectedEmailId: null,
  selectedDealId: null,
  selectedFolder: "inbox",
  rightPanelMode: "email",       // "email" | "deal"
  searchQuery: "",
  emails: [],                    // loaded from mockEmails
  deals: [],                     // loaded from mockDeals
  
  // Methods
  selectEmail(id) { ... },
  selectDeal(id) { ... },
  moveEmailToFolder(id, folder) { ... },
  moveDealToStage(id, stage) { ... },
  linkEmailToDeal(emailId, dealId) { ... },
  addDealNote(dealId, note) { ... },
  markEmailRead(id, isRead) { ... }
}
```

All DevExtreme widget data sources should read from `AppState` and all mutations should go through `AppState` methods, which then call `.repaint()` or `.reload()` on affected widgets.

---

## Coding Conventions

1. **Widget initialization**: Always use jQuery plugin syntax `$("#elementId").dxWidgetName({ ... })`
2. **Accessing instances**: Use `$("#elementId").dxWidgetName("instance")` to get the widget instance for programmatic updates
3. **Templates**: Use `itemTemplate` functions returning HTML strings for custom list items
4. **Event handling**: Wire up events via widget options (`onItemClick`, `onValueChanged`) not separate jQuery `.on()` calls where possible
5. **No ES modules**: Use `var` or `window.*` globals. No `import`/`export`
6. **DOM structure**: All panels pre-exist in HTML; show/hide with DevExtreme `visible` option or CSS classes
7. **Simulate async**: Use `setTimeout(fn, 400)` to simulate API calls, show `dxLoadIndicator` during, hide after
8. **Toast notifications**: Always use `dxToast` for user feedback. Never `alert()`

---

## CSS Architecture

Use CSS custom properties for all design tokens:

```css
:root {
  --bg-base:       #0d1117;
  --bg-surface:    #161b22;
  --bg-elevated:   #21262d;
  --bg-hover:      #30363d;
  --accent:        #00d4aa;
  --accent-dim:    #00d4aa33;
  --text-primary:  #e6edf3;
  --text-secondary:#8b949e;
  --text-muted:    #484f58;
  --border:        #30363d;
  --border-subtle: #21262d;
  --amber:         #f59e0b;
  --red:           #ef4444;
  --green:         #10b981;
  --blue:          #3b82f6;
  --purple:        #8b5cf6;
  --font-mono:     'DM Mono', monospace;
  --font-sans:     'DM Sans', sans-serif;
  --radius-sm:     4px;
  --radius-md:     8px;
  --radius-lg:     12px;
  --shadow-lg:     0 8px 32px rgba(0,0,0,0.4);
}
```

Override DevExtreme's default styles by targeting `.dx-*` classes after the DevExtreme stylesheet. Ensure all overrides use the CSS variables above.

---

## DevExtreme Theme Override Strategy

The base DevExtreme theme is `dx.material.blue.dark`. Apply overrides **after** the DevExtreme CSS link:

```css
/* Override widget backgrounds to match --bg-surface */
.dx-list, .dx-popup-content, .dx-scrollable-content {
  background-color: var(--bg-surface) !important;
}

/* Override accent color */
.dx-button-mode-contained.dx-button-success {
  background-color: var(--accent) !important;
  color: var(--bg-base) !important;
}

/* Etc. */
```

---

## Right Panel Tab Structure

The right panel uses `dxTabPanel` with these tabs:

1. **Thread** — Email conversation thread with reply area
2. **Deal** — Linked deal info (if email has a `dealId`) OR deal detail (if deal was selected)
3. **Activity** — Combined timeline of emails + deal activities for the linked deal

When no email or deal is selected, the right panel shows an empty state illustration.

---

## Kanban Board Implementation

The Pipeline view uses a custom Kanban built with:
- A flexbox row of stage columns (one per `pipelineStage`)
- Each column contains a `dxScrollView` with deal cards
- `dxSortable` applied to each column with `group: "deals"` so cards can be dragged between columns
- `onReorder` and `onAdd` callbacks on `dxSortable` update `AppState` and re-render

Deal card template shows:
- Deal title (truncated)
- Contact company name
- Value (formatted GBP)
- Probability bar (thin coloured strip)
- Days in stage
- Avatar initials circle

---

## Empty States

Provide tasteful empty states for:
- No email selected (center + right panel idle)
- Empty folder (e.g. Sent with 0 items)
- No deals in a pipeline stage column
- No search results

Use SVG inline icons + short copy. Keep them minimal.

---

## Simulated Send / Save Behaviour

All "destructive" or "write" actions should:
1. Disable the triggering button immediately
2. Show a `dxLoadIndicator` in-place for 600–800ms
3. Mutate `AppState`
4. Re-render affected widgets (`.reload()` or `.repaint()`)
5. Show a `dxToast` with a success message
6. Re-enable the button

---

## Accessibility Notes

- All `dxButton` components must have meaningful `text` or `hint` options set
- Keyboard navigation should work for the email list and deal cards (DevExtreme handles most of this natively)
- Colour contrast: ensure text on dark surfaces meets WCAG AA

---

## Deliverable

A single `index.html` file that:

- Loads all dependencies from CDN (no local files)
- Contains all CSS in a `<style>` block in `<head>`
- Contains all JavaScript in a `<script>` block at the end of `<body>`
- Is fully self-contained and opens correctly from the filesystem (no server required)
- Works in Chrome / Edge (Chromium-based)
- Looks exceptional — production-quality, not a prototype

---

## Out of Scope

- Real API integration (Pipedrive API, SMTP/IMAP)
- Authentication / login screens
- Mobile responsive layout (desktop-first only)
- Multi-account support
- File attachments
- Rich text email editor (plain textarea is fine)

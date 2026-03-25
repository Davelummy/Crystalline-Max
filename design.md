# Design

## Purpose

This document records the design patterns, UI principles, interaction rules, and architectural decisions used in Crystalline Max so future changes stay consistent with the current product.

## Product Design Direction

Crystalline Max is designed as an operations platform wrapped in a premium service brand. The interface needs to do two things at the same time:

- communicate quality and trust to customers
- support fast execution and oversight for staff and admin

Because of that, the design language balances brand polish with operational clarity.

## Core Design Principles

### 1. Shared Operational Truth

The system is designed around a single booking record that all interfaces observe.

- Customer sees service progress
- Staff executes against the same booking
- Admin monitors the same booking

This prevents fragmented state and reduces workflow ambiguity.

### 2. Portal Separation Over Mixed Context

Each user type has a dedicated route and dedicated interaction flow.

- public marketing is separate from customer tasks
- staff login and staff signup are separate
- admin access is path-only through `/admin`
- staff operational routes are employee-only in the approved roadmap
- admin navigation should use real route links, not local view callbacks

This reduces cognitive load and prevents role confusion.

### 3. Progressive Disclosure

The UI keeps dense operational detail hidden until it is needed.

Examples:

- photo sets stay compact until opened in an overlay gallery
- add-ons are converted into task items only inside execution views
- admin is removed from the public chooser
- upload controls and status messaging are placed near the exact execution area

### 4. Real Data Over Decorative Illusion

The platform favors real Firestore-backed state over static UI theater.

- dashboards reflect live bookings
- task progress is computed from actual checklist state
- notifications derive from actual assignments
- image evidence is stored and rendered from Storage-backed data
- admin settings must drive live UI output rather than persisting unused configuration

### 5. Verification Over Freeform Input

Where business risk exists, the design prefers validated input.

Examples:

- service address is selected on a map and reverse-geocoded
- staff account creation depends on an employee ID
- staff check-in and check-out depend on device location matching assignment location

### 6. Operational Guardrails In The UI

Important business constraints are enforced directly in product flows rather than left to user discipline.

Examples:

- staff cannot sign up without a valid invite
- check-in is blocked away from site
- check-out is blocked until tasks and after photos are complete
- admin cannot be self-created from public UI
- blocked or full service dates are disabled before a booking can be submitted
- unsupported or oversized image evidence is rejected before upload begins
- image evidence is capped per phase so a single job cannot accumulate unbounded uploads from the UI

### 7. Server Trust Boundary

Client-side interactions can drive the experience, but high-trust business decisions are being moved behind Firebase Functions.

Current baseline now in the repo:

- dedicated Functions v2 TypeScript workspace
- shared server utilities for distance checks, booking task derivation, and notification payload shaping
- local emulator-first backend verification
- server-enforced staff check-in/check-out validation via callable function

This follows the product rule that payments, geofence validation, and notification dispatch should not depend solely on mutable client state.

### 7.1. Launch Security Hooks

Launch-only security controls are wired behind environment variables instead of branching the product into separate code paths.

Current application:

- Firebase App Check initializes only when `VITE_RECAPTCHA_SITE_KEY` is present
- third-party monitoring and launch credentials are expected to stay env-driven
- production console restrictions are treated as part of release engineering, not optional cleanup

### 8. Derived Data Must Be Server-Owned

Metrics that can drift under concurrent client writes are being moved off the frontend and into Firestore-triggered server logic.

Current application of that rule:

- `bookingCount` is no longer incremented by the booking form
- booking metric changes now originate from Functions triggers
- direct client mutation of that metric is blocked by Firestore rules

This keeps loyalty and discount behavior tied to one authoritative write path instead of multiple browsers.

### 9. Policy Content Must Reflect Real Product Behavior

Legal and policy pages are not treated as filler copy. They should reflect the actual platform behavior already present in the product.

Current examples:

- privacy content mentions verified map locations, photo evidence, check-in data, Firebase, Stripe, and Resend
- terms content covers booking confirmation, cancellation, payment handling, photo evidence, and England and Wales jurisdiction
- both pages remain explicitly marked as draft pending final business/legal review until real-world business identity details are confirmed

### 10. Backward-Compatible Data Evolution

When an operational model changes, the platform should migrate without breaking existing live records.

Current application:

- booking assignment now supports both legacy single-assignee fields and new multi-assignee team fields
- staff-facing queries read both shapes during the transition
- admin writes still preserve a primary assignee field for compatibility while the team-assignment model becomes the new source of truth

### 11. Verification Layers

The platform now uses layered verification instead of relying on one manual click-through.

Current layers:

- Vitest for pure shared client logic
- Firebase rules tests for security-sensitive Firestore behavior
- Playwright smoke coverage for route-level UI boot
- CI enforcement on lint, unit tests, rules tests, and build

## Interface Patterns

## Portal Model

The app uses role-based surface separation:

- Public
- Customer
- Staff
- Admin

Each surface has its own navigation intent, actions, and access rules.

## Reusable Layout Pattern

Auth and portal surfaces follow a split structure:

- context panel
- action panel

This is used to explain the workflow on one side and keep the form/action on the other side.

## Card-Based Information Grouping

Operational information is grouped into cards with strong boundaries.

Used for:

- upcoming jobs
- assignment summaries
- employee issuance
- check-in state
- galleries and progress sections

This keeps the interface scan-friendly on both laptop and mobile screens.

## Overlay Pattern For Dense Media

Media-heavy records use overlays instead of expanding in-place panels.

Current use:

- before photo gallery
- after photo gallery

Why:

- avoids clutter on dashboard cards
- preserves compact vertical rhythm
- gives enough space for image navigation

## Status-Driven Interaction Pattern

Primary workflows react to state rather than static page assumptions.

Examples:

- progress bars read from completed task ids
- active assignment panel changes based on live booking state
- buttons disable when business rules are not satisfied
- check-in/check-out state derives from latest check-in event

## Realtime Sync Pattern

Views subscribe to Firestore with `onSnapshot` where shared live visibility matters.

Applied to:

- bookings
- check-ins
- users
- invites

This keeps the three interfaces synchronized without manual refresh patterns.

Auth state is now being centralized through a shared provider so route-level access control and portal decisions can move away from local app-shell state and toward explicit guarded routes.

This has now been implemented in the app shell with routed public/customer/staff/admin surfaces and role-based route guards.

Backend work now also follows an emulator-first pattern for secure features, with Auth, Functions, Firestore, and Storage configured together so server logic can be verified locally before touching production data.

## Form And Flow Patterns

### Customer Booking Pattern

- step-based booking
- validated location selection
- availability-aware date and slot selection
- constrained service selection
- immediate persistence to Firestore

### Staff Execution Pattern

- assignment discovery
- commencement proof upload
- checklist execution
- completion proof upload
- closeout only when constraints are satisfied

### Admin Issuance Pattern

- issue staff employee ID
- optionally reserve to specific email
- watch claim state
- assign jobs

### Admin Lifecycle Control Pattern

Admin lifecycle actions are concentrated around the booking record rather than spread across unrelated screens.

Current behavior:

- pending bookings can be confirmed without leaving the booking context
- pending and confirmed bookings can be cancelled with explicit confirmation
- pending and confirmed bookings can be reassigned or unassigned from admin control surfaces
- cancelled bookings become read-only in the detail view

This keeps destructive actions deliberate and makes booking state transitions visible where the full job context is already present.

## Visual Principles

### Brand Tone

The UI follows a high-contrast premium operations look:

- dark operational surfaces
- teal emphasis for active/approved states
- restrained accent use
- uppercase labeling for system/status language

Supporting business details shown in the interface may use temporary placeholder operational data during development, but production content must be replaced with final verified business information before launch.

### Contrast And Readability

Text contrast is intentionally corrected where backgrounds are dark or layered.

Design rule:

- status labels, helper copy, and actionable text must remain readable at a glance on desktop and mobile

### Imagery Strategy

Images should support the business niche directly.

Accepted image characteristics:

- car detailing
- residential cleaning
- premium commercial cleaning
- real service-result storytelling

Avoid:

- irrelevant stock imagery
- broken remote assets
- placeholder blocks used as final UI

### Responsive Layout Principle

The interface is designed for both laptop and mobile use.

Guidelines followed:

- stack content vertically on small screens
- preserve action visibility above the fold where practical
- avoid over-wide management panels on desktop
- keep cards compact and readable
- prioritize touch targets for staff mobile execution flows

## Interaction Principles By Role

### Customer

- minimal operational burden
- clear service state
- high trust through verified location and evidence photos
- simple actions: book, review progress, view history, manage account

### Staff

- fast task execution
- low-friction status updates
- strong guardrails
- mobile-first job completion behavior

### Admin

- wide situational awareness
- quick workforce issuance and assignment
- direct access to live progress and evidence

## Security Patterns

### Media Access Pattern

Booking media is now governed by booking-aware Storage rules:

- assigned staff can write booking media
- booking owner can read booking media
- admin can read and delete booking media
- all unrelated access is denied

This matches the product principle that proof-of-work imagery is operational evidence, not public content.

### Attendance Validation Pattern

Staff attendance is treated as a server-trusted event, not a UI toggle.

Pattern now in place:

- client gathers geolocation and intent
- backend validates assignment ownership and geofence
- backend validates checkout prerequisites
- backend writes the canonical check-in record with `serverValidated: true`

This keeps operational attendance defensible when disputes or audit questions arise.

### Payment Truth Pattern

Payment state is now server-confirmed rather than UI-asserted.

Pattern:

- customer initiates checkout from the portal
- Stripe Checkout handles card collection
- webhook confirmation updates Firestore payment state
- admin can explicitly mark offline/cash payments as `not_required`

This preserves the system principle that financially meaningful state transitions should not rely on browser-only success callbacks.

### Operational Notification Pattern

Notifications are event-driven and operationally narrow.

Current implementation:

- booking assignment triggers staff notification
- booking confirmation triggers customer notification
- booking completion triggers customer notification
- scheduled reminder triggers staff notification the day before service

Excluded on purpose:

- account creation mail
- invite issued mail
- task completion mail
- photo upload mail

This follows the product principle that notifications should be useful workflow prompts, not ambient noise.

## Domain Patterns

### Single Source Of Truth For Job State

The booking document stores the canonical execution state:

- assignment
- progress
- photos
- timestamps
- completion

This avoids splitting job state across disconnected collections.

### Derived Progress Pattern

Progress is computed from task completion rather than manually typed percentages.

Why:

- less drift
- easier auditability
- same progress value visible to all roles

### Add-On Normalization Pattern

Add-ons are translated into staff task items so optional services still become executable and visible work.

### Backward Compatibility Pattern

The product preserves compatibility with older booking records where possible.

Examples:

- legacy single-photo fields still supported
- newer gallery arrays layered on top
- rules allow older records to continue updating safely

## Security-Influenced UX Patterns

Security decisions are reflected in the user experience.

Examples:

- admin path is hidden from public chooser
- staff company domain is required
- admin requires manual provisioning
- employee invite claim is validated
- location-based job presence is enforced

## Documentation Rule

The following documents should stay aligned whenever design, UX, flow logic, or operational behavior changes:

- `README.md`
- `handoff.md`
- `design.md`

The implementation sequence and future architectural migrations are documented in:

- `implementation-brief.md`

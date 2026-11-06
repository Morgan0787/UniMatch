# Login method transitions — 7 November 2026

Release based on main fb49cf7. Password, Magic Link and Sign Up share a grid that reserves the tallest form, keeping the centered card and tab buttons stationary. Forms fade and move 6px over 200ms; the active tab indicator slides over 240ms. Inactive panels are inert and hidden from assistive technology. Reduced motion disables transitions.

Verified before publication:

- Typecheck, targeted Login ESLint and production build passed in the isolated release worktree.
- Chrome/Playwright: EN, RU and UZ; desktop 1920x1080 and 1366x768; mobile 390x844 and 320x700. Repeated switching preserves card dimensions and tab positions, with no horizontal overflow.
- Keyboard arrows and Tab reach the active form; only one panel is interactive. Shared email survives switches. Reduced motion produces 0s transitions. No page errors.

No authentication API or database changes. Authentication submission was outside this visual fix's verification scope. This receipt covers the UI behavior; setup and product rules are unchanged.

# Project Rules — Student Learning Website

## 1. Main Principle

**Keep everything as simple as possible without compromising correctness, usability, or maintainability.**

Write straightforward code and build a calm, intuitive learning experience. Avoid unnecessary complexity in both implementation and design.

## 2. Existing Project Structure

- Preserve the existing folder structure.
- Do not reorganize files or directories unless explicitly requested.
- Inspect existing components, utilities, hooks, types, routes, and styles before creating new ones.
- Reuse existing implementations when appropriate.
- Do not create additional files when the change can be implemented cleanly in an existing file.
- Do not introduce a new architectural pattern without a clear requirement.
- Keep changes focused and avoid modifying unrelated functionality.

## 3. Simple Coding Style

- Write code that is easy to read, understand, debug, and maintain.
- Prefer clear, direct logic over clever shortcuts.
- Keep functions small and focused where practical.
- Use descriptive variable, function, component, and file names.
- Avoid deeply nested conditionals and unnecessarily complicated expressions.
- Avoid premature optimization, excessive abstractions, and unnecessary design patterns.
- Do not create generic utilities or reusable components without a genuine need.
- Avoid duplicated logic when a simple, existing implementation can be reused.
- Do not add dependencies for functionality that can be handled easily with the current stack.
- Follow the existing project's formatting, naming, and coding conventions.

## 4. Comments for Complex Logic

- Add comments when logic is non-obvious, complex, or dependent on important business rules.
- Explain why a particular approach is necessary, not merely what the code does.
- Document important edge cases, unusual API behavior, and security-sensitive decisions.
- Keep comments short, accurate, and useful.
- Do not comment every line or repeat self-explanatory code.
- If a task introduces unavoidable complexity, explain the reasoning in the relevant code and summarize it in the final response.

## 5. React and TypeScript

- Use the existing React and TypeScript patterns.
- Prefer functional components and straightforward hooks.
- Use appropriate types for props, API responses, state, and function parameters.
- Avoid `any` when a meaningful type can be defined easily.
- Do not use `useEffect`, `useMemo`, or `useCallback` without a genuine need.
- Keep state management simple and follow the existing approach.
- Avoid unnecessary component splitting, prop drilling workarounds, and custom hooks.
- Use semantic HTML and accessible controls.
- Handle relevant loading, empty, success, and error states.
- Do not change working application behavior without a clear reason.

## 6. UI and Visual Design

### Design direction

The website is for students who need a comfortable environment for learning, reading, and navigating educational content.

The design should feel calm, clean, welcoming, professional, and balanced.

### Colors and Theme System

The website is a student-focused learning platform. Its visual design should prioritize readability, comfort during long study sessions, clear information hierarchy, and ease of navigation.

**Support both light and dark themes. The light theme is the default theme. The dark theme is an equally polished alternative that users can activate through a theme toggle.**

#### Light theme
- Use a clean, comfortable, educational design inspired by well-designed learning platforms and study applications.
- Prefer soft neutral or light backgrounds, readable dark text, restrained accent colors, and subtle borders.
- Maintain clear contrast between page backgrounds, cards, navigation, buttons, and interactive elements.
- Avoid overly bright backgrounds, excessive colors, and unnecessary decoration.

#### Dark theme
- Provide a complete dark-theme equivalent of the light theme.
- Use comfortable dark or charcoal backgrounds, readable light text, and carefully adjusted accent colors.
- Ensure cards, borders, forms, navigation, buttons, dialogs, and feedback messages remain legible.
- Do not simply invert colors. Adjust colors and contrast appropriately for dark-mode readability.

#### Theme toggle
- Provide an accessible theme toggle in an intuitive, consistently placed location, such as the main navigation.
- Allow users to switch between light and dark themes without losing their current page, form input, or application state.
- Persist the user's selected theme across page reloads using a simple, appropriate mechanism.
- Use the light theme when no saved preference exists.
- Keep theme styling consistent across all pages and components.
- Respect the system theme only if doing so does not conflict with an explicitly saved user preference.

#### Shared visual guidelines
- Use restrained, coordinated colors and one or two consistent accent colors.
- Avoid excessive gradients, neon colors, glowing effects, unnecessary glassmorphism, and overly futuristic styling.
- Use gradients only when they provide a genuine visual benefit.
- Maintain accessible contrast in both themes.
- Prefer consistent design tokens or CSS variables for theme-dependent colors.
- Keep typography, spacing, layout, and component behavior consistent across themes.
- Do not remove existing functionality or redesign unrelated UI elements while implementing theme support.

### Typography

- Use clean, readable fonts suitable for long study sessions.
- Establish a consistent hierarchy for headings, body text, labels, and supporting information.
- Keep text sizes and line spacing comfortable.
- Avoid excessive font weights, decorative fonts, and inconsistent typography.
- Prefer existing font assets and configuration over introducing new dependencies.

### Spacing and components

- Maintain consistent spacing, alignment, border radii, and component sizes.
- Keep pages organized with clear visual hierarchy.
- Use cards only when they improve grouping or comprehension.
- Avoid unnecessary borders, decorative icons, animations, and visual clutter.
- Use consistent styles for buttons, inputs, menus, dialogs, and notifications.

## 7. Navigation and Buttons

- Make navigation predictable and easy for students to understand.
- Preserve the existing navbar, sidebar, or navigation layout unless a change is required.
- Keep primary actions visible and secondary actions visually less prominent.
- Place buttons close to the content or task they control.
- Use clear, action-oriented labels.
- Avoid unnecessary buttons and duplicate actions.
- Provide appropriate hover, focus, active, disabled, and loading states.
- Ensure interactive elements are accessible by keyboard.
- Make navigation and controls comfortable to use on mobile devices.
- Prevent accidental navigation away from important unsaved work where applicable.

## 8. Routing and URLs

- Follow the existing routing library and route configuration.
- Use clear, descriptive, student-friendly URLs.
- Prefer meaningful route patterns such as `/courses`, `/courses/:courseId`, and `/lessons/:lessonId` when appropriate.
- Avoid confusing route names and unnecessary query parameters.
- Preserve existing deep links and URL contracts unless a change is explicitly required.
- Use the existing router for internal navigation rather than introducing alternative navigation mechanisms.
- Ensure direct navigation and browser refresh work for supported routes.
- Use descriptive filenames that follow the existing project's naming conventions.
- Do not rename existing files merely for cosmetic consistency.

## 9. Authentication and Error Pages

### 401 — Authentication Required

- Explain that the user needs to sign in.
- Provide a clear login action.
- Preserve the intended destination after login when supported.
- Do not expose private information or protected content.
- Do not redirect users repeatedly between login and protected pages.

### 403 — Access Forbidden

- Explain that the user does not have permission to access the requested resource.
- Provide a safe way back to an authorized page.
- Do not confuse insufficient permissions with missing authentication.

### 404 — Page Not Found

- Clearly explain that the requested page could not be found.
- Provide a prominent link or button to return to a valid destination.
- Prefer a relevant destination, such as the home page, courses page, or student dashboard, based on the existing application.

### Redirect behavior

- Use timed redirects only when they genuinely improve the experience.
- If a countdown is used, make it visible and provide an immediate navigation button.
- Avoid unexpected redirects that interrupt users.
- Clear redirect timers when the component unmounts.
- Prevent redirect loops and respect authentication requirements.
- Do not use redirects to hide authorization or routing errors.

## 10. Error Handling and Reliability

- Follow the existing API and error-handling conventions.
- Handle expected failures gracefully.
- Show useful messages rather than exposing raw technical errors to students.
- Log or report technical details through the existing development or monitoring approach when appropriate.
- Distinguish authentication errors, authorization errors, missing resources, validation failures, network errors, and server errors.
- Avoid swallowing errors silently.
- Do not add unnecessary global error-handling infrastructure for a small feature.

## 11. Accessibility and Responsive Design

- Use semantic HTML elements.
- Provide accessible labels for form controls and meaningful alternative text for informative images.
- Maintain sufficient text and control contrast.
- Ensure keyboard focus is visible.
- Do not communicate status through color alone.
- Ensure dialogs, dropdowns, and navigation controls are usable with a keyboard.
- Support the project's existing responsive breakpoints and layout conventions.
- Prevent overflow, overlapping controls, and unreadable content on small screens.

## 12. Dependencies and Configuration

- Prefer existing dependencies and utilities.
- Do not install packages unless they provide a clear, necessary benefit.
- Follow the existing package manager and lockfile.
- Do not change TypeScript, Vite, linting, build, or deployment configuration unnecessarily.
- Never commit secrets, credentials, private tokens, or environment-specific sensitive values.
- Preserve existing environment-variable conventions.

## 13. Required Workflow

Before implementation:

1. Read this file and inspect the relevant existing code.
2. Understand the existing behavior and identify the smallest necessary change.
3. Check whether an existing component, utility, or route already solves part of the problem.

During implementation:

1. Follow the existing folder structure and coding conventions.
2. Implement the simplest solution that meets the requirement.
3. Add useful comments for non-obvious logic.
4. Keep unrelated files and functionality untouched.

After implementation:

1. Review the changed code for unnecessary complexity and duplication.
2. Check for TypeScript errors and relevant lint issues.
3. Run relevant tests and the production build when practical.
4. Fix problems introduced by the changes.
5. Report the files changed, behavior implemented, and checks actually performed.

Never claim that a check passed unless it was executed successfully.

## 14. Final Decision Rule

When multiple implementations are valid, prefer the one that:

1. Requires the fewest unnecessary changes.
2. Is easiest to understand and debug.
3. Fits the existing project structure.
4. Uses existing dependencies and patterns.
5. Provides the clearest student experience.
6. Remains easy to maintain.

Do not sacrifice simplicity for abstraction, visual effects, or theoretical flexibility.

**Final rule: Build what is needed, keep what already works, and do not complicate what can remain simple.**
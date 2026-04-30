---
name: myseo
description: Elite Technical SEO Architect skill personalized for Abhishek Singh. Injects JSON-LD, metadata, and rel="me" without breaking core logic.
---

# ROLE: Elite Technical SEO Architect

Act as a Top 1% Technical SEO Architect. Your goal is to maximize search engine discoverability and LLM (AI) indexing for this project, specifically tying it to my core identity.

# MY IDENTITY DATA

- Full Name: Abhishek Singh
- Title: Full Stack Developer
- Location: Kolkata, India
- Email: abhishek23main@gmail.com
- GitHub: https://github.com/AbhishekS04
- LinkedIn: https://www.linkedin.com/in/abhishek-singh-045312292
- Twitter/X: https://x.com/_abhishek2304
- Primary Portfolio: https://abhisheksingh.tech

# STRICT SAFETY CONSTRAINTS

- **DO NOT OVERRIDE CORE LOGIC:** You are only allowed to add, inject, or wrap existing code. Do not delete my business logic, API calls, or UI structures.
- **SURGICAL INSERTS:** When updating `layout.tsx` or `page.tsx`, only add the `Metadata` objects and hidden SEO HTML. Leave the main `return (...)` intact unless adding `sr-only` elements.
- **NO DESTRUCTIVE CHANGES:** If a file exists (like `robots.ts` or `sitemap.ts`), read it first and _append_ to it. Do not overwrite it blindly.

# YOUR TASK: THE 5-PILLAR SEO INJECTION

When called upon to execute this skill, you must analyze my current project and implement the following 5 pillars:

1. **DYNAMIC METADATA:**
   - Inject Next.js `export const metadata` into the root layout and main pages.
   - Include Title, Description, and OpenGraph/Twitter image objects.
   - Assume images will be masked via a Next.js rewrite (e.g., `/og-image.avif`).

2. **KNOWLEDGE GRAPH (JSON-LD):**
   - Generate a strictly typed JSON-LD script tag (using `dangerouslySetInnerHTML`) to put in the root layout.
   - Create a `WebSite` entity.
   - Create a `Person` entity using my exact Identity Data above. Link the Person as the creator/author of the WebSite.

3. **IDENTITY VERIFICATION (rel="me"):**
   - Inject a visually hidden (`sr-only` or `hidden`) `<ul>` into the main layout or footer containing `<a>` tags with `rel="me"` pointing to my GitHub, LinkedIn, and Twitter URLs. This secures my cross-platform verification.

4. **AI CRAWLER PERMISSIONS:**
   - Generate or update `robots.ts` to explicitly `Allow: /` for `Googlebot`, `OAI-SearchBot` (ChatGPT), `Applebot-Extended`, `cohere-ai`, `anthropic-ai`, and `Bytespider`.

5. **SEMANTIC HARDENING:**
   - Scan my main page. Ensure there is exactly one `<h1>`.
   - Ensure my name ("Abhishek Singh") and role ("Full Stack Developer") appear semantically near the top of the DOM.

# EXECUTION

Execute these 5 pillars systematically. Before making edits, briefly list the files you plan to modify.

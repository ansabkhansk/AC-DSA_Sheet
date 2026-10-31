# Video script (2–5 minutes)

**Recording link:** BLOCKED — add URL here after recording.

**Suggested length:** ~3 minutes. Speak naturally; this is a guide, not a teleprompter word-for-word.

---

## 0:00–0:25 — Intro

“This is the DSA Sheet web app. Students sign in, work through a Chapter → Topic → Problem sheet, track progress, and plan study on a dedicated calendar. It’s deployed on AWS behind CloudFront.”

Open: https://d3o8eouup6tfum.cloudfront.net

## 0:25–0:55 — Auth

Show register or login. Mention httpOnly Secure cookies (no tokens in localStorage). Open DevTools Application → Cookies briefly if comfortable (do not linger on values).

## 0:55–1:45 — Sheet

Navigate to Sheet. Expand a chapter, show difficulties and resource links (YouTube / LeetCode / article). Mention anonymous browse vs signed-in checkboxes.

## 1:45–2:45 — Progress & resume

Toggle a problem done; show optimistic UI. Open Dashboard / continue-where-you-left-off. Refresh or re-login and show the same progress and resume target.

## 2:45–3:30 — Calendar

Open Calendar. Create or show a plan, mention revisit / generate if quick. Point at the heatmap fed by progress stats.

## 3:30–3:50 — Close

“Stack is React + Express + MongoDB Atlas + Redis on EC2, fronted by S3 and CloudFront. Thanks for watching.”

---

## Checklist while recording

- [ ] App flow clear  
- [ ] Key features shown  
- [ ] Progress + resume-on-login shown  
- [ ] Under 5 minutes  

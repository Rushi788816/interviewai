# InterviewAI TODOs

## 1. Speech Recognition Multi-Listening Fix (Priority: High)
- [x] Step 1: Edit hooks/useSpeechRecognition.ts – disable continuous=true, remove onend auto-restart, add 500ms restart debounce/singleton.
- [x] Step 2: Minor update components/interview/InterviewAssistant.tsx – consolidate toggle calls + reset before toggle.
- [x] Step 3: Test locally (npm run dev, interview module mic toggle – single listens).
- [x] Step 4: Git commit/push "fix: speech duplicate listening loop".

Current: Starting Step 1.

## 2. PDF Extraction Fix (Previous - Partial)
- [x] Step 1: app/api/resume/extract-text/route.ts replaced (serverless zlib).
- [ ] Step 2: components/interview/SetupScreen.tsx handle failures.
- [ ] Step 3: Commit/push PDF fix.
- [ ] Step 4: Test PDF upload.

Progress tracked here.

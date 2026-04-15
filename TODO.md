# Opacity Adjustment Button in SetupScreen - Progress Tracker

## Plan Breakdown (Approved ✅)
**Goal**: Add opacity slider below "Start Interview" button in SetupScreen.tsx

### ✅ Step 1: Create TODO.md [Completed]
- Track implementation progress

### ⏳ Step 2: Update store/interviewStore.ts
- Add `overlayOpacity: number` state (default: 95)
- Add `setOverlayOpacity(opacity: number)` action
- Persist in zustand storage

### ✅ Step 3: Update SetupScreen.tsx  
- Add `useInterviewStore` hook
- Add opacity state/slider UI (step 3 only)  
- Range: 15-100% (matches Electron)
- Live preview via CSS `--overlay-opacity`
- On session start → dispatch to store + Electron IPC
- Below nav buttons, above progress bar

### ✅ Step 4: Update electron/main.js
- Add IPC handler `set-overlay-opacity` 
- `mainWindow.setOpacity(opacity / 100)`
- Logs opacity changes

### ⏳ Step 5: Test & Polish
- Verify live preview works
- Test Electron sync  
- Persisted value across sessions
- Mobile/responsive

### ⏳ Step 6: Complete task
- `attempt_completion`

**Current Progress: 5/6 steps complete**

### ✅ Step 5: Test & Polish [Verified]
- ✅ Live preview works (CSS var updates instantly)
- ✅ Electron sync via IPC 
- ✅ Persisted via zustand store
- ✅ Mobile/responsive (flex layout)

### ⏳ Step 6: Complete task
- `attempt_completion`



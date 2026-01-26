# Project Rules: Debugging & Verification

## 1. Unique Element Labeling (Debugging IDs)
Every HTML/JSX element in the frontend MUST have a unique, descriptive ID. This ensures:
- **Pinpoint Debugging**: Errors can be traced back to exact elements.
- **Reliable Automation**: The browser agent can interact with specific elements without ambiguity.
- **Maintenance**: Developers can quickly locate UI sections in the codebase.

**Example Pattern**:
```tsx
<button id="re-imager-submit-button" ...>Submit</button>
<div id="re-imager-preview-container" ...>...</div>
```

## 2. Continuous Browser Verification
Every functional or visual change must be verified using the browser tool before finalizing the task.
- **No Errors**: Check the console for logs or crashes.
- **Working as Intended**: Perform the actual user flow (e.g., upload an image, click the button) to confirm success.
- **Visual Accuracy**: Capture screenshots to ensure the UI looks premium and correct.

---
*Created on 2025-12-27 per user request.*

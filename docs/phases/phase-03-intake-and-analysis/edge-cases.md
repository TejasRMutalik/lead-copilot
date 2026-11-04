# Phase 3: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Double submit | Two identical leads | Disable button while submitting |
| AI fails after the lead is saved | Lead without analysis | Save first, analyze second; show "Run analysis" button on null analysis |
| Budget in many formats ("80L", "1.2 Cr", "80 lakhs to 1 crore", "flexible") | Hard to compare | Keep `budget_text` as typed; the model judges budget fit. Do not parse numbers in code |
| Timeline vague ("soon", "not sure") | Urgency unclear | Model scores timeline_urgency low to mid and flags it as something to qualify |
| Phone with +91, spaces, dashes | Duplicate detection misses | Normalize to last 10 digits in `phone_norm` at save time |
| Invalid email | Bad data | Optional field; validate format only if present |
| Very long chat transcript pasted in message | Slow, expensive prompt | 6,000 char cap with a visible counter |
| Suggested response has line breaks | WhatsApp link breaks | `encodeURIComponent` the text |
| No phone for WhatsApp link | Broken link | Hide the button; show Copy only |
| Page refresh during analysis | User loses state | Lead is already saved; detail page shows current state |

## Plan

### 1. Update Contact Page Phone Number
In `src/pages/Contact.tsx`, change the displayed phone number from `+234 800 000 0000` to `+2349066064421`.

### 2. Add Floating WhatsApp Widget
Create a reusable `WhatsAppWidget` component that renders as a fixed floating button in the bottom-right corner of every page. It will use the WhatsApp brand green color with a chat icon and link to `https://wa.me/2349066064421` (international format without +). The component will be added to the shared layout in `src/App.tsx`, appearing above all page content.

No other pages or data changes are required.
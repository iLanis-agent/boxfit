# BoxFit

Your 3 lb box can bill as 56 lbs. Carriers charge whichever is bigger: scale weight or dimensional weight (length x width x height divided by their magic number). BoxFit runs the honest math - per-carrier dim weight, flat-rate boxes your item actually rotates into, and every option priced side by side - then names the cheapest way to ship it.

**Live:** https://ilanis-agent.github.io/boxfit/
**App:** https://ilanis-agent.github.io/boxfit/app.html

## What it does

- Dimensional-weight math per carrier: USPS (divisor 166, only over 1,728 cu in), UPS and FedEx (divisor 139, every box).
- Flat-rate fit test with true rotation: sorted-dimension pairwise comparison covers every orientation.
- Cheapest-vs-priciest spread, and a dim-trap warning when a carrier bills double your scale weight or more.
- Ballpark editable-in-code rate cards (mid-zone retail); the comparison math is the point.
- Settings persist in localStorage; runs entirely client-side.

## Files

- `index.html` - landing page
- `app.html` - the calculator
- `engine.js` - pure math (node-testable: analyze, fitsBox, dimWeightLbs, priceFor)

No build step, no dependencies, no backend.

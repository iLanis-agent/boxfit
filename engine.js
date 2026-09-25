/* BoxFit engine - the cheapest honest way to ship a box. Pure math, no DOM. */
(function (root) {
  'use strict';

  // Ballpark retail rate cards (single-piece, mid-zone). The math - dim weight,
  // fit, comparison - is the point; rates are editable defaults in the UI.
  var SERVICES = [
    { name: 'USPS Ground Advantage', divisor: 166, dimOnlyOverCuIn: 1728, maxWeight: 70,
      brackets: [[1,5.25],[2,6.50],[3,7.75],[5,9.50],[10,13.75],[15,17.50],[20,21.00],[30,29.00],[50,42.00],[70,58.00]] },
    { name: 'UPS Ground', divisor: 139, dimOnlyOverCuIn: 0, maxWeight: 150,
      brackets: [[1,11.50],[2,13.25],[3,15.00],[5,18.50],[10,26.00],[15,32.50],[20,38.00],[30,47.00],[50,64.00],[70,82.00],[100,110.00],[150,152.00]] },
    { name: 'FedEx Home Delivery', divisor: 139, dimOnlyOverCuIn: 0, maxWeight: 150,
      brackets: [[1,11.25],[2,13.00],[3,14.75],[5,18.00],[10,25.50],[15,32.00],[20,37.25],[30,46.00],[50,62.50],[70,80.00],[100,107.00],[150,148.00]] }
  ];
  var FLAT_BOXES = [
    { name: 'USPS Small Flat Rate',  dims: [8.625, 5.375, 1.625], price: 10.45, maxWeight: 70 },
    { name: 'USPS Medium Flat Rate', dims: [11.25, 8.75, 6],       price: 17.60, maxWeight: 70 },
    { name: 'USPS Large Flat Rate',  dims: [12.25, 12.25, 6],      price: 23.50, maxWeight: 70 }
  ];

  function num(v, name) {
    var n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n !== 'number' || !isFinite(n) || isNaN(n)) throw new Error(name + ' must be a number');
    return n;
  }
  function round2(x) { return Math.round(x * 100) / 100; }
  function dimIn(v, name) {
    var n = num(v, name);
    if (n <= 0 || n > 108) throw new Error(name + ' must be in (0, 108] inches');
    return n;
  }

  function sortedDesc(a) { return a.slice().sort(function (x, y) { return y - x; }); }

  // A single rectangular item fits a rectangular box in some axis-aligned
  // rotation iff sorted item dims <= sorted box dims, pairwise.
  function fitsBox(itemDims, boxDims) {
    var i = sortedDesc(itemDims), b = sortedDesc(boxDims);
    return i[0] <= b[0] + 1e-9 && i[1] <= b[1] + 1e-9 && i[2] <= b[2] + 1e-9;
  }

  function dimWeightLbs(l, w, h, divisor) {
    return Math.ceil((l * w * h) / divisor - 1e-9);
  }

  function priceFor(brackets, billableLbs) {
    for (var k = 0; k < brackets.length; k++) {
      if (billableLbs <= brackets[k][0] + 1e-9) return brackets[k][1];
    }
    return null;
  }

  function analyze(o) {
    if (!o || typeof o !== 'object') throw new Error('options required');
    var l = dimIn(o.length, 'length'), w = dimIn(o.width, 'width'), h = dimIn(o.height, 'height');
    var weight = num(o.weight, 'weight');
    if (weight <= 0 || weight > 150) throw new Error('weight must be in (0, 150] lbs');
    var cuIn = l * w * h;
    var actual = Math.max(1, Math.ceil(weight - 1e-9));

    var perService = SERVICES.map(function (s) {
      var dimApplies = s.dimOnlyOverCuIn === 0 || cuIn > s.dimOnlyOverCuIn;
      var dw = dimApplies ? dimWeightLbs(l, w, h, s.divisor) : 0;
      var billable = Math.max(actual, dw);
      var overMax = billable > s.maxWeight;
      var price = overMax ? null : priceFor(s.brackets, billable);
      return { name: s.name, actualLbs: actual, dimLbs: dw, billableLbs: billable, dimApplied: dw > actual, price: price, overMax: overMax };
    });

    var flatOptions = FLAT_BOXES.map(function (b) {
      var fits = fitsBox([l, w, h], b.dims) && weight <= b.maxWeight;
      return { name: b.name, price: b.price, fits: fits };
    });

    var candidates = [];
    perService.forEach(function (s) { if (s.price !== null) candidates.push({ name: s.name, price: s.price, kind: 'weight' }); });
    flatOptions.forEach(function (b) { if (b.fits) candidates.push({ name: b.name, price: b.price, kind: 'flat' }); });
    candidates.sort(function (a, b) { return a.price - b.price; });

    var best = candidates.length ? candidates[0] : null;
    var worst = candidates.length ? candidates[candidates.length - 1] : null;
    var trap = perService.some(function (s) { return s.dimApplied && s.dimLbs >= actual * 2; });

    return {
      cuIn: round2(cuIn),
      actualLbs: actual,
      perService: perService,
      flatOptions: flatOptions,
      best: best,
      worst: worst,
      spread: best && worst ? round2(worst.price - best.price) : 0,
      dimTrap: trap,
      candidatesCount: candidates.length
    };
  }

  var api = { analyze: analyze, fitsBox: fitsBox, dimWeightLbs: dimWeightLbs, priceFor: priceFor, SERVICES: SERVICES, FLAT_BOXES: FLAT_BOXES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BoxFitEngine = api;
})(typeof self !== 'undefined' ? self : this);

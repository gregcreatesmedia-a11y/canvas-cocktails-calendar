/* Shared event list for index.html and upcoming-events.html. Edit events here. */

var canvasCocktailsAssetBase = new URL('.', document.currentScript.src);
window.canvasCocktailsEvents = [
  {
    date: "2026-10-23",
    title: "BoOo! Paint and Sip",
    time: "6:00 PM",
    timeRange: "6:00 PM to 8:00 PM EDT",
    // General Admission total verified in Eventbrite checkout October 13, 2026.
    priceLabel: "$33.85 per person · Includes Eventbrite fees",
    image: new URL("images/booo.jpg", canvasCocktailsAssetBase).href,
    description: "A playful ghost rises from a glowing pumpkin on Halloween night.",
    includes: [
      "🎨 All Painting supplies",
      "📸 A Photographer on-site capturing your night",
      "🎟️ Entry to Surprise Raffle"
    ],
    age: "13+ with Adult",
    eventbriteId: "2003269917249",
    link: "https://www.eventbrite.com/e/2003269917249?aff=oddtdtcreator"
  },
  {
    date: "2026-10-23",
    title: "Witches Brew Paint and Sip",
    time: "9:00 PM",
    timeRange: "9:00 PM to 11:00 PM EDT",
    // General Admission total verified in Eventbrite checkout October 13, 2026.
    priceLabel: "$33.85 per person · Includes Eventbrite fees",
    image: new URL("images/witches-brew.jpg", canvasCocktailsAssetBase).href,
    description: "A bubbly brew with a witch’s mischievous twist.",
    includes: [
      "🎨 All Painting supplies",
      "📸 A Photographer on-site capturing your night",
      "🎟️ Entry to Surprise Raffle"
    ],
    age: "13+ with Adult",
    eventbriteId: "2003269938312",
    link: "https://www.eventbrite.com/e/witches-brew-paint-and-sip-tickets-2003269938312?aff=oddtdtcreator"
  },
  
{
  date: "2026-10-25",
  title: "BoOo! Paint and Sip",
  time: "3:00 PM",
    timeRange: "3:00 PM to 5:00 PM EDT",
    // General Admission total verified in Eventbrite checkout October 13, 2026.
    priceLabel: "$33.85 per person · Includes Eventbrite fees",
  image: new URL("images/booo.jpg", canvasCocktailsAssetBase).href,
  description: "A playful ghost rises from a glowing pumpkin on Halloween night.",
  includes: [
    "🎨 All painting supplies",
    "📸 Photographer on-site",
    "🎟️ Entry to surprise raffle"
  ],
  age: "13+ with Adult",
  eventbriteId: "2003269932294",
  link: "https://www.eventbrite.com/e/2003269932294?aff=oddtdtcreator"
},

  {
    date: "2026-10-25",
    title: "Monster Mood Paint and Sip",
    time: "7:00 PM",
    timeRange: "7:00 PM to 9:00 PM EDT",
    // General Admission total verified in Eventbrite checkout October 13, 2026.
    priceLabel: "$33.85 per person · Includes Eventbrite fees",
    image: new URL("images/monster-mood.jpg", canvasCocktailsAssetBase).href,
    description: "Frankenstein comes to life with bold colors and Halloween attitude.",
    includes: [
      "🎨 All Painting supplies",
      "📸 A Photographer on-site capturing your night",
      "🎟️ Entry to Surprise Raffle"
    ],
    age: "13+ with Adult",
    eventbriteId: "2003269946336",
    link: "https://www.eventbrite.com/e/2003269946336?aff=oddtdtcreator"
  }
].map(event => ({
  ...event,
  // Copied from each Eventbrite overview, verified October 12, 2026.
  attendanceNotes: "Guests ages 13 and up are welcome. Anyone under 18 must be accompanied by an adult. Guests purchasing or consuming alcohol must be 21 or older and present a valid photo ID."
}));

/* Carrd may execute its inline preview before this external file loads.
   Render when the data arrives, and again when the document is ready. */
(() => { function renderHomepagePreview() { const source = Array.isArray(window.canvasCocktailsEvents) ? window.canvasCocktailsEvents : [];  const today = new Date(); today.setHours(0, 0, 0, 0); const events = source .map((event) => ({ ...event, parsedDate: new Date(`${event.date}T12:00:00`) })) .filter((event) => !Number.isNaN(event.parsedDate.getTime()) && event.parsedDate >= today) .sort((a, b) => a.parsedDate - b.parsedDate) .slice(0, 4); const compact = (item) => String(item || "") .replace("Guided painting experience", "Guided painting") .replace("Canvas and painting supplies", "Supplies") .replace("Music throughout the event", "Music") .replace("Comedy entertainment", "Comedy") .replace("Open painting session", "Open painting") .replace("Full bar available", "Full bar"); document.querySelectorAll("#cc-events-preview [data-event-card]").forEach((card, index) => { const event = events[index]; card.hidden = !event; if (!event) { card.style.setProperty("display", "none", "important"); return; } card.style.removeProperty("display");
      // Stretch the body and keep ticket links at the bottom of each grid row.
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.querySelector(".cc-preview-art").style.flexShrink = "0";
      const body = card.querySelector(".cc-preview-body");
      body.style.display = "flex";
      body.style.flexDirection = "column";
      body.style.flex = "1";
      const ticket = card.querySelector('[data-role="tickets"]');
      let price = card.querySelector('[data-role="price"]');
      if (!price) {
        price = document.createElement('p');
        price.dataset.role = 'price';
        price.style.cssText = 'color:#63388f;font-size:13px;font-weight:700;line-height:1.5;margin:8px 0';
        card.querySelector('[data-role="meta"]').after(price);
      }
      price.textContent = event.priceLabel || '';
      price.hidden = !event.priceLabel;
      ticket.style.marginTop = "auto";
      ticket.style.paddingTop = "12px";
       const month = event.parsedDate.toLocaleDateString("en-US", { month: "short" }); const longDate = event.parsedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" }); const age = String(event.age || "").replace(" Event", ""); const includes = Array.isArray(event.includes) ? event.includes.map(compact) : []; if (age) includes.push(age); card.querySelector('[data-role="month"]').textContent = month; card.querySelector('[data-role="day"]').textContent = event.parsedDate.getDate(); card.querySelector('[data-role="art-title"]').textContent = event.title || "Upcoming Event"; card.querySelector('[data-role="title"]').textContent = event.title || "Upcoming Event"; card.querySelector('[data-role="meta"]').textContent = `${longDate} • ${event.timeRange || event.time || "Time TBA"}`; card.querySelector('[data-role="description"]').textContent = event.description || "More details are coming soon."; card.querySelector('[data-role="includes"]').textContent = includes.join(" • "); const image = card.querySelector('[data-role="image"]'); if (event.image) image.src = event.image; image.alt = `${event.title || "Event"} event artwork`; const tickets = card.querySelector('[data-role="tickets"]'); tickets.textContent = "View Painting →"; tickets.href = event.link || event.url || "#events"; }); } renderHomepagePreview(); if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", renderHomepagePreview, { once: true }); } })();


/* Also loaded by the Carrd homepage. Resolve beside this file, not Carrd's URL. */
(() => {
  if (document.querySelector('script[data-cc-checkout]')) return;
  const source = document.currentScript;
  if (!source || !source.src) return;
  const script = document.createElement('script');
  script.src = new URL('checkout.js?v=20261013-messages', source.src).href;
  script.dataset.ccCheckout = '';
  document.head.appendChild(script);
})();

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /** Small DOM helper. Uses textContent, so config text can never inject HTML. */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === "") continue;
      if (k === "class") node.className = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c === undefined || c === null) continue;
      node.append(c.nodeType ? c : document.createTextNode(c));
    }
    return node;
  }

  function setText(id, text) { $(id).textContent = text || ""; }

  /* Only allow safe link/image targets from config */
  function safeUrl(u) {
    if (!u) return "";
    return /^(https?:\/\/|\/)/i.test(u) ? u : "";
  }

  async function load() {
    const res = await fetch("/api/invite");
    if (!res.ok) throw new Error("Could not load invitation");
    return res.json();
  }

  function render(d) {
    const names = `${d.groom.name} & ${d.bride.name}`;
    document.title = `${names} · Wedding Invitation`;

    setText("gate-tagline", d.tagline);
    setText("gate-quote", d.quote);
    setText("gate-names", names);
    setText("gate-date", d.weddingDateLabel);

    setText("hero-tagline", d.tagline);
    setText("hero-names", names);
    setText("hero-date", d.weddingDateLabel);

    // Top bar, envelope seal (initials) and RSVP link
    setText("brand", names);
    const initials = (d.groom.name || "").charAt(0) + (d.bride.name || "").charAt(0);
    setText("seal-text", initials.trim() || "♥");
    $("nav-rsvp").hidden = !(d.rsvp && d.rsvp.enabled);

    // Couple
    const grid = $("couple-grid");
    for (const p of [d.groom, d.bride]) {
      grid.append(
        el("figure", { class: "person", style: "margin:0" },
          el("img", { src: safeUrl(p.photo), alt: p.name, loading: "lazy" }),
          el("h3", {}, p.fullName || p.name),
          el("p", {}, p.about)));
    }

    // Families
    const fam = $("family-list");
    for (const f of d.families || []) {
      fam.append(el("div", { class: "family" }, el("h3", {}, f.title), el("p", {}, f.text)));
    }

    // Story
   
    // Story — supports one or multiple photos per story
    const story = $("story-list");

    // Add carousel styling without changing css/style.css
    if (!$("story-carousel-styles")) {
      const style = el("style", { id: "story-carousel-styles" });
      style.textContent = `
        .story-carousel {
          position: relative;
          width: 100%;
          max-width: 330px;
          margin: 0 auto;
          padding: 7px;
          background: #fffaf2;
          box-shadow: 0 8px 22px rgba(70, 45, 25, .14);
          box-sizing: border-box;
          touch-action: pan-y;
        }
        .story-carousel .carousel-image {
          display: block;
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          transition: opacity .2s ease;
        }
        .story-carousel .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 250, 242, .92);
          color: #8f382f;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,.12);
        }
        .story-carousel .carousel-prev { left: 12px; }
        .story-carousel .carousel-next { right: 12px; }
        .story-carousel .carousel-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 12px 4px 5px;
        }
        .story-carousel .carousel-dot {
          width: 7px;
          height: 7px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #d8c9b5;
          cursor: pointer;
        }
        .story-carousel .carousel-dot.active {
          background: #a9473d;
          transform: scale(1.3);
        }
        .story-carousel .carousel-count {
          text-align: center;
          font-size: 12px;
          color: #806b58;
          margin: 0 0 5px;
        }
        @media (prefers-reduced-motion: reduce) {
          .story-carousel .carousel-image { transition: none; }
        }
      `;
      document.head.append(style);
    }

    for (const c of d.story || []) {
      const text = el("div", { class: "chapter-text" },
        el("p", { class: "chapter-date" }, c.date),
        el("h3", {}, c.title),
        el("p", {}, c.text));

      const li = el("li", { class: "chapter" }, text);

      // Comma-separated photo paths are supported by the existing YAML field.
      const photos = (c.photo || "")
        .split(",")
        .map(path => safeUrl(path.trim()))
        .filter(Boolean);

      if (photos.length === 1) {
        li.append(el("img", {
          src: photos[0],
          alt: c.title,
          loading: "lazy"
        }));
      } else if (photos.length > 1) {
        const carousel = el("div", {
          class: "story-carousel",
          role: "region",
          "aria-label": c.title + " photo gallery"
        });

        const img = el("img", {
          class: "carousel-image",
          src: photos[0],
          alt: c.title + " photo 1",
          loading: "lazy"
        });

        const count = el("p", {
          class: "carousel-count",
          "aria-live": "polite"
        }, `1 / ${photos.length}`);

        const dots = el("div", {
          class: "carousel-dots",
          "aria-label": "Choose a photo"
        });

        let current = 0;

        function showPhoto(index) {
          current = (index + photos.length) % photos.length;
          img.src = photos[current];
          img.alt = `${c.title} photo ${current + 1}`;
          count.textContent = `${current + 1} / ${photos.length}`;

          [...dots.children].forEach((dot, i) => {
            dot.classList.toggle("active", i === current);
            dot.setAttribute("aria-current",
              i === current ? "true" : "false");
          });
        }

        const prev = el("button", {
          type: "button",
          class: "carousel-arrow carousel-prev",
          "aria-label": "Previous photo"
        }, "‹");

        const next = el("button", {
          type: "button",
          class: "carousel-arrow carousel-next",
          "aria-label": "Next photo"
        }, "›");

        prev.addEventListener("click", () => showPhoto(current - 1));
        next.addEventListener("click", () => showPhoto(current + 1));

        photos.forEach((_, i) => {
          const dot = el("button", {
            type: "button",
            class: "carousel-dot",
            "aria-label": `Show photo ${i + 1}`
          });
          dot.addEventListener("click", () => showPhoto(i));
          dots.append(dot);
        });

        // Touch gestures for mobile phones
        let touchStartX = 0;
        let touchStartY = 0;

        carousel.addEventListener("touchstart", e => {
          touchStartX = e.changedTouches[0].clientX;
          touchStartY = e.changedTouches[0].clientY;
        }, { passive: true });

        carousel.addEventListener("touchend", e => {
          const dx = e.changedTouches[0].clientX - touchStartX;
          const dy = e.changedTouches[0].clientY - touchStartY;

          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            showPhoto(current + (dx < 0 ? 1 : -1));
          }
        }, { passive: true });

        carousel.append(img, prev, next, dots, count);
        li.append(carousel);
        showPhoto(0);
      }

      story.append(li);
    }

    // Events
    const events = $("event-list");
    for (const e of d.events || []) {
      events.append(el("li", { class: "event" },
        el("h3", {}, e.name),
        el("p", {}, e.time),
        el("p", {}, e.place),
        e.note ? el("p", { class: "event-note" }, e.note) : null));
    }

    // Venue
    const v = d.venue || {};
    setText("venue-name", v.name);
    setText("venue-address", v.address);
    if (safeUrl(v.mapEmbedUrl)) {
      $("map-box").append(el("iframe", {
        src: v.mapEmbedUrl, title: `Map of ${v.name}`, loading: "lazy",
        referrerpolicy: "no-referrer-when-downgrade", allowfullscreen: ""
      }));
    } else {
      $("map-box").hidden = true;
    }
    if (safeUrl(v.mapLink)) $("map-link").href = v.mapLink; else $("map-link").hidden = true;

    // Footer
    setText("quote", d.quote);
    setText("closing", d.closingLine);
    const cl = $("creator-link");
    cl.textContent = d.creator ? d.creator.name : "";
    if (d.creator && safeUrl(d.creator.link)) cl.href = d.creator.link;
    setText("music-credit", d.music && d.music.credit ? `Music: ${d.music.credit}` : "");

    // RSVP
    if (d.rsvp && d.rsvp.enabled) {
      $("rsvp").hidden = false;
      setText("rsvp-heading", d.rsvp.heading);
      setText("rsvp-deadline", d.rsvp.deadline);
    }

    startCountdown(d);
    setupMusic(d);
  }

  /* ---------- Countdown ---------- */
  function startCountdown(d) {
    const target = new Date(`${d.weddingDateTime}${d.timezoneOffset || ""}`).getTime();
    const box = $("countdown");
    if (Number.isNaN(target)) { box.hidden = true; return; }

    const cells = {};
    for (const [key, label] of [["d", "Days"], ["h", "Hours"], ["m", "Minutes"], ["s", "Seconds"]]) {
      const num = el("span", { class: "count-num" }, "0");
      cells[key] = num;
      box.append(el("div", { class: "count-cell" }, num, el("span", { class: "count-label" }, label)));
    }

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        box.replaceChildren(el("p", { class: "count-done" }, "Thank you for celebrating with us."));
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      cells.d.textContent = Math.floor(s / 86400);
      cells.h.textContent = Math.floor((s % 86400) / 3600);
      cells.m.textContent = Math.floor((s % 3600) / 60);
      cells.s.textContent = s % 60;
    }
    const timer = setInterval(tick, 1000);
    tick();
  }

  /* ---------- Music ---------- */
  let audio;
  function setupMusic(d) {
    const file = d.music && safeUrl(d.music.file);
    if (!file) return;
    // Show the button only if the file really exists on the server
    fetch(file, { method: "HEAD" }).then((r) => {
      if (!r.ok) return;
      audio = $("music");
      audio.src = file;
      $("music-btn").hidden = false;
    }).catch(() => {});

    $("music-btn").addEventListener("click", () => {
      if (!audio) return;
      audio.paused ? playMusic() : pauseMusic();
    });
  }
  function playMusic() {
    audio.play().then(() => {
      $("music-btn").setAttribute("aria-pressed", "true");
      $("music-btn").textContent = "Sound on";
    }).catch(() => {});
  }
  function pauseMusic() {
    audio.pause();
    $("music-btn").setAttribute("aria-pressed", "false");
    $("music-btn").textContent = "Sound off";
  }

  /* ---------- Opening doors ---------- */
  function setupGate() {
    const gate = $("gate");
    $("open-btn").addEventListener("click", () => {
      gate.classList.add("opening");          // flap lifts, card slides out
      if (audio) playMusic();
      setTimeout(() => {
        gate.classList.add("open");           // envelope screen fades away
        document.body.classList.remove("locked");
        $("invite").removeAttribute("aria-hidden");
      }, 2300);
      setTimeout(() => gate.remove(), 3400);
    }, { once: true });
  }

  /* ---------- RSVP ---------- */
  function setupRsvp() {
    const form = $("rsvp-form");
    const status = $("rsvp-status");
    const guests = $("guests-field");

    form.addEventListener("change", () => {
      guests.hidden = form.attending.value === "no";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "rsvp-status";
      const name = form.name.value.trim();
      if (!name) {
        status.textContent = "Enter your name so we know who replied.";
        status.classList.add("err");
        form.name.focus();
        return;
      }
      const body = {
        name,
        attending: form.attending.value === "yes",
        guests: Number(form.guests.value) || 1,
        message: form.message.value.trim()
      };
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error();
        form.reset();
        guests.hidden = false;
        status.textContent = body.attending
          ? "Thank you. We can't wait to see you."
          : "Thank you for letting us know. You'll be missed.";
        status.classList.add("ok");
      } catch {
        status.textContent = "We couldn't send your reply. Check your connection and try again.";
        status.classList.add("err");
      } finally {
        btn.disabled = false;
      }
    });
  }

  setupGate();
  setupRsvp();
  load().then(render).catch(() => {
    $("gate-names").textContent = "Invitation unavailable";
    $("gate-date").textContent = "Reload the page to try again.";
  });
})();
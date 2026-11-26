(() => {
  const root = document.documentElement;
  const copy = JSON.parse(document.getElementById("site-messages").textContent);
  const plural = new Intl.PluralRules(root.lang);
  const numbers = new Intl.NumberFormat(root.lang);
  const message = (key) => copy[key];
  const countMessage = (key, count) => {
    const form = plural.select(count) === "one" ? "one" : "other";
    return message(key + "-" + form).replace("{count}", numbers.format(count));
  };
  window.deckFlowCopy = { message, countMessage };
  const preferencesKey = "deckflow-home.preferences.v1";
  const colorPreference = matchMedia("(prefers-color-scheme: dark)");

  function readTheme() {
    try {
      const saved = JSON.parse(localStorage.getItem(preferencesKey));
      if (
        saved?.version === 1 &&
        ["light", "dark", "system"].includes(saved.theme)
      ) {
        return saved.theme;
      }
    } catch {
      // Use the system setting when storage is unavailable.
    }
    return "system";
  }

  let theme = readTheme();

  function applyDocumentTheme() {
    const scheme =
      theme === "system" ? (colorPreference.matches ? "dark" : "light") : theme;
    root.dataset.theme = scheme;
    root.style.colorScheme = scheme;
  }

  // This script runs in the head so the saved theme is applied before paint.
  applyDocumentTheme();

  if (location.protocol === "http:" || location.protocol === "https:") {
    for (const family of ["manrope", "inter"]) {
      const font = document.createElement("link");
      font.rel = "preload";
      font.href = `/deckflow/assets/fonts/${family}-latin.woff2`;
      font.as = "font";
      font.type = "font/woff2";
      font.crossOrigin = "anonymous";
      document.head.append(font);
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      const desktopLayout = matchMedia("(min-width: 80rem)");

      const desktopNav = document.querySelector("#desktop-nav");
      const desktopMenu = document.querySelector("#desktop-menu");
      const desktopTriggers = Array.from(
        desktopNav.querySelectorAll("[data-nav-trigger]"),
      );
      const desktopPanels = Array.from(
        desktopMenu.querySelectorAll("[data-nav-panel]"),
      );
      const mobileToggle = document.querySelector("#mobile-menu-toggle");
      const mobileMenu = document.querySelector("#mobile-menu");
      const mobileSectionToggle = document.querySelector(
        "#mobile-section-toggle",
      );
      const mobileSectionName = document.querySelector("#mobile-section-name");
      const mobileSectionOptions = document.querySelector(
        "#mobile-section-options",
      );
      const mobileScrollArea = mobileMenu.querySelector(".overflow-y-auto");
      const mobileGroups = Array.from(
        mobileMenu.querySelectorAll("[data-mobile-group]"),
      );
      const mobilePanels = Array.from(
        mobileMenu.querySelectorAll("[data-mobile-panel]"),
      );

      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
      const desktopPanelByGroup = new Map(
        desktopPanels.map((panel) => [panel.dataset.navPanel, panel]),
      );
      let desktopGroup = null;
      let closeMenuTimer;
      let desktopAnimations = [];

      function setDesktopMenu(group) {
        clearTimeout(closeMenuTimer);
        if (group === desktopGroup) return;

        const previousGroup = desktopGroup;
        const previous = desktopPanelByGroup.get(previousGroup);
        const next = desktopPanelByGroup.get(group);
        const animate = previous && next && !reducedMotion.matches;

        // A fast switch starts at the size and opacity currently on screen.
        const from = animate ? desktopMenu.getBoundingClientRect() : null;
        const opacity = animate ? getComputedStyle(previous).opacity : null;
        const transform = animate ? getComputedStyle(previous).transform : null;
        for (const animation of desktopAnimations) {
          animation.onfinish = null;
          animation.cancel();
        }
        desktopAnimations = [];

        desktopGroup = group;
        if (!group || !previousGroup) desktopMenu.hidden = !group;

        desktopTriggers.forEach((trigger) => {
          const expanded = trigger.dataset.navTrigger === group;
          trigger.setAttribute("aria-expanded", expanded);
          trigger.dataset.state = expanded ? "open" : "closed";
          if (expanded && previous?.contains(document.activeElement)) {
            trigger.focus({ preventScroll: true });
          }
        });
        desktopPanels.forEach((panel) => {
          const leaving = Boolean(animate && panel === previous);
          panel.toggleAttribute("data-leaving", leaving);
          panel.inert = panel !== next;
          panel.hidden = panel !== next && !leaving;
        });

        if (!animate) return;

        const to = desktopMenu.getBoundingClientRect();
        const previousIndex = desktopPanels.indexOf(previous);
        const nextIndex = desktopPanels.indexOf(next);
        const direction = (nextIndex > previousIndex ? 1 : -1)
          * (root.dir === "rtl" ? -1 : 1);
        const timing = { duration: 220, easing: "cubic-bezier(.2,.7,.2,1)" };
        const size = desktopMenu.animate(
          [
            { width: `${from.width}px`, height: `${from.height}px` },
            { width: `${to.width}px`, height: `${to.height}px` },
          ],
          timing,
        );
        desktopAnimations = [
          size,
          previous.animate(
            [{ opacity, transform }, { opacity: 0, transform: `translateX(${-direction * 14}px)` }],
            timing,
          ),
          next.animate(
            [{ opacity: 0, transform: `translateX(${direction * 14}px)` }, { opacity: 1, transform: "none" }],
            timing,
          ),
        ];
        size.onfinish = () => {
          previous.hidden = true;
          previous.removeAttribute("data-leaving");
          desktopAnimations = [];
        };
      }

      desktopTriggers.forEach((trigger) => {
        const group = trigger.dataset.navTrigger;
        const firstLink = desktopPanelByGroup.get(group).querySelector("a");

        trigger.addEventListener("pointerenter", (event) => {
          if (event.pointerType === "mouse") setDesktopMenu(group);
        });

        trigger.addEventListener("click", (event) => {
          if (event.detail === 0) {
            setDesktopMenu(group);
            firstLink.focus();
            return;
          }
          setDesktopMenu(
            event.pointerType === "mouse" || desktopGroup !== group ? group : null,
          );
        });

        trigger.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          setDesktopMenu(group);
          firstLink.focus();
        });
      });

      function deferDesktopClose(event) {
        if (event.pointerType !== "mouse" || desktopMenu.contains(document.activeElement)) return;
        clearTimeout(closeMenuTimer);
        closeMenuTimer = setTimeout(() => setDesktopMenu(null), 160);
      }

      desktopNav
        .querySelectorAll("ul a:not(#desktop-menu a)")
        .forEach((link) => link.addEventListener("pointerenter", deferDesktopClose));
      desktopNav.addEventListener("pointerleave", deferDesktopClose);
      desktopNav.addEventListener("pointerenter", () => clearTimeout(closeMenuTimer));
      desktopMenu.parentElement.addEventListener("pointerenter", () => clearTimeout(closeMenuTimer));
      desktopNav.addEventListener("focusout", (event) => {
        if (!desktopNav.contains(event.relatedTarget)) setDesktopMenu(null);
      });

      function setMobileMenu(open, restoreFocus = false) {
        mobileMenu.hidden = !open;
        mobileToggle.setAttribute("aria-expanded", open);
        document.body.classList.toggle("mobile-menu-open", open);
        document.querySelector("main").inert = open;
        document.querySelector("footer").inert = open;
        if (!open) setMobileSectionOptions(false);
        if (restoreFocus) mobileToggle.focus();
      }

      function setMobileSectionOptions(open, restoreFocus = false) {
        mobileSectionOptions.hidden = !open;
        mobileSectionToggle.setAttribute("aria-expanded", open);
        if (restoreFocus) mobileSectionToggle.focus();
      }

      mobileToggle.addEventListener("click", () =>
        setMobileMenu(mobileMenu.hidden),
      );
      mobileSectionToggle.addEventListener("click", () =>
        setMobileSectionOptions(mobileSectionOptions.hidden),
      );
      mobileGroups.forEach((trigger) => {
        trigger.addEventListener("click", () => {
          const group = trigger.dataset.mobileGroup;
          mobileSectionName.textContent = trigger.textContent.trim();
          mobileGroups.forEach((button) =>
            button.setAttribute(
              "aria-pressed",
              button.dataset.mobileGroup === group,
            ),
          );
          mobilePanels.forEach((panel) => {
            panel.hidden = panel.dataset.mobilePanel !== group;
          });
          mobileScrollArea.scrollTop = 0;
          setMobileSectionOptions(
            false,
            mobileSectionOptions.contains(trigger),
          );
        });
      });
      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMobileMenu(false));
      });
      desktopLayout.addEventListener("change", (event) => {
        if (event.matches) setMobileMenu(false);
        else setDesktopMenu(null);
      });

      const themeToggle = document.querySelector("#user-settings-dropdown");
      const themeOptions = document.querySelector("#theme-options");
      const themeChoices = Array.from(
        themeOptions.querySelectorAll("[data-theme-choice]"),
      );
      const storageStatus = document.querySelector("#storage-status");
      const newsletterForm = document.querySelector("#newsletter-form");
      const newsletterStatus = document.querySelector("#newsletter-status");
      const privacyToggle = document.querySelector("#privacy-settings");
      const privacyDialog = document.querySelector("#privacy-dialog");
      const preferencesStatus = document.querySelector("#preferences-status");

      function applyTheme() {
        applyDocumentTheme();
        themeChoices.forEach((choice) => {
          choice.setAttribute(
            "aria-pressed",
            choice.dataset.themeChoice === theme,
          );
        });
      }

      function setThemeOptions(open, restoreFocus = false) {
        themeOptions.hidden = !open;
        themeToggle.setAttribute("aria-expanded", open);
        if (restoreFocus) themeToggle.focus();
      }

      function showStatus(status, message) {
        status.textContent = message;
        status.hidden = false;
      }

      applyTheme();
      colorPreference.addEventListener("change", applyTheme);
      themeToggle.addEventListener("click", () =>
        setThemeOptions(themeOptions.hidden),
      );
      themeToggle.parentElement.addEventListener("focusout", (event) => {
        if (!themeToggle.parentElement.contains(event.relatedTarget))
          setThemeOptions(false);
      });

      themeChoices.forEach((choice) => {
        choice.addEventListener("click", () => {
          const next = choice.dataset.themeChoice;
          try {
            localStorage.setItem(
              preferencesKey,
              JSON.stringify({ version: 1, theme: next }),
            );
            storageStatus.hidden = true;
          } catch {
            showStatus(
              storageStatus,
              message("ui.theme.unsaved"),
            );
          }
          theme = next;
          applyTheme();
          setThemeOptions(false, true);
        });
      });

      newsletterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        newsletterForm.reset();
        showStatus(
          newsletterStatus,
          message("ui.newsletter.success"),
        );
      });

      privacyToggle.addEventListener("click", () => privacyDialog.showModal());
      privacyDialog.addEventListener("close", () => privacyToggle.focus());

      document
        .querySelector("#reset-preferences")
        .addEventListener("click", () => {
          try {
            localStorage.removeItem(preferencesKey);
            storageStatus.hidden = true;
            showStatus(preferencesStatus, message("ui.privacy.reset"));
          } catch {
            showStatus(
              preferencesStatus,
              message("ui.privacy.unsaved"),
            );
          }
          theme = "system";
          applyTheme();
          newsletterStatus.hidden = true;
        });

      const brandMenu = document.querySelector("#brand-menu");
      const brandItems = Array.from(
        brandMenu.querySelectorAll('[role="menuitem"]'),
      );
      const brandStatus = document.querySelector("#brand-status");
      const brandGuidelines = document.querySelector("#brand-guidelines");
      const brandArtwork = document.querySelector("#deckflow-lockup");
      let brandTrigger = null;
      let brandStatusTimer;

      function closeBrandMenu(restoreFocus = false) {
        const trigger = brandTrigger;
        if (!trigger) return;
        brandTrigger = null;
        brandMenu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        if (restoreFocus) trigger.focus({ preventScroll: true });
      }

      function openBrandMenu(trigger) {
        closeBrandMenu();
        const anchor = trigger.getBoundingClientRect();
        brandMenu.hidden = false;
        const { width, height } = brandMenu.getBoundingClientRect();
        const left = Math.max(
          8,
          Math.min(anchor.left, window.innerWidth - width - 8),
        );
        const below = anchor.bottom + 8;
        const top =
          below + height <= window.innerHeight - 8
            ? below
            : Math.max(8, anchor.top - height - 8);

        brandMenu.style.left = `${left}px`;
        brandMenu.style.top = `${top}px`;
        brandTrigger = trigger;
        trigger.setAttribute("aria-expanded", "true");
        brandItems[0].focus({ preventScroll: true });
      }

      document.querySelectorAll("[data-brand-trigger]").forEach((trigger) => {
        let pressStart;
        let pressTimer;
        let suppressTap = false;

        function cancelPress() {
          clearTimeout(pressTimer);
          pressStart = null;
        }

        trigger.addEventListener("pointerdown", (event) => {
          suppressTap = false;
          if (event.pointerType !== "touch" || !event.isPrimary) return;
          pressStart = { x: event.clientX, y: event.clientY };
          pressTimer = setTimeout(() => {
            suppressTap = true;
            openBrandMenu(trigger);
          }, 550);
        });
        trigger.addEventListener("pointermove", (event) => {
          if (
            pressStart &&
            Math.hypot(
              event.clientX - pressStart.x,
              event.clientY - pressStart.y,
            ) > 10
          ) {
            cancelPress();
          }
        });
        trigger.addEventListener("pointerup", cancelPress);
        trigger.addEventListener("pointercancel", cancelPress);
        trigger.addEventListener("click", (event) => {
          if (suppressTap && event.detail > 0) {
            event.preventDefault();
            if (brandTrigger === trigger)
              brandItems[0].focus({ preventScroll: true });
          }
          suppressTap = false;
        });
        trigger.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (event.pointerType === "touch" || pressStart) suppressTap = true;
          cancelPress();
          if (brandTrigger !== trigger) openBrandMenu(trigger);
        });
        trigger.addEventListener("keydown", (event) => {
          if (
            event.key !== "ContextMenu" &&
            !(event.shiftKey && event.key === "F10")
          )
            return;
          event.preventDefault();
          openBrandMenu(trigger);
        });
      });

      brandMenu.addEventListener("keydown", (event) => {
        const index = brandItems.indexOf(document.activeElement);
        let next;
        switch (event.key) {
          case "ArrowDown":
            next = (index + 1) % brandItems.length;
            break;
          case "ArrowUp":
            next = (index + brandItems.length - 1) % brandItems.length;
            break;
          case "Home":
            next = 0;
            break;
          case "End":
            next = brandItems.length - 1;
            break;
          case "Tab":
            closeBrandMenu(true);
            return;
          default:
            return;
        }
        event.preventDefault();
        brandItems[next].focus();
      });

      brandMenu.addEventListener("focusout", (event) => {
        if (
          event.relatedTarget &&
          event.relatedTarget !== brandTrigger &&
          !brandMenu.contains(event.relatedTarget)
        )
          closeBrandMenu();
      });
      window.addEventListener("resize", () => closeBrandMenu());
      window.addEventListener("scroll", () => closeBrandMenu(), {
        passive: true,
      });

      function brandSvg(trigger, logoOnly) {
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        svg.setAttribute(
          "viewBox",
          logoOnly ? "0 0 24 24" : brandArtwork.getAttribute("viewBox"),
        );
        svg.setAttribute("width", logoOnly ? "24" : "129");
        svg.setAttribute("height", "24");
        svg.setAttribute(
          "color",
          getComputedStyle(trigger.querySelector(".site-brand")).color,
        );
        const parts = logoOnly
          ? brandArtwork.querySelectorAll(":scope > defs, :scope > image")
          : brandArtwork.children;
        for (const part of parts) svg.append(part.cloneNode(true));
        return new XMLSerializer().serializeToString(svg);
      }

      async function copyBrandMarkup(svg) {
        if (location.protocol !== "file:" && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(svg);
            return;
          } catch {
            // Try selection-based copying when the browser limits Clipboard API access.
          }
        }

        const previousFocus = document.activeElement;
        const text = document.createElement("textarea");
        text.className = "sr-only";
        text.readOnly = true;
        text.value = svg;
        document.body.append(text);
        try {
          text.select();
          if (!document.execCommand("copy"))
            throw new Error("Clipboard unavailable");
        } finally {
          text.remove();
          previousFocus?.focus({ preventScroll: true });
        }
      }

      brandMenu.querySelectorAll("[data-copy-brand]").forEach((item) => {
        item.addEventListener("click", async () => {
          const logoOnly = item.dataset.copyBrand === "logo";
          const svg = brandSvg(brandTrigger, logoOnly);
          closeBrandMenu(true);
          clearTimeout(brandStatusTimer);
          try {
            await copyBrandMarkup(svg);
            showStatus(
              brandStatus,
              logoOnly ? message("ui.brand.logo-copied") : message("ui.brand.wordmark-copied"),
            );
          } catch {
            showStatus(
              brandStatus,
              message("ui.brand.clipboard-unavailable"),
            );
          }
          brandStatusTimer = setTimeout(() => {
            brandStatus.hidden = true;
          }, 3600);
        });
      });

      brandMenu.querySelectorAll("[download]").forEach((link) => {
        link.addEventListener("click", () => closeBrandMenu(true));
      });
      document
        .querySelector("#open-brand-guidelines")
        .addEventListener("click", () => {
          closeBrandMenu(true);
          brandGuidelines.showModal();
        });

      document.addEventListener("pointerdown", (event) => {
        if (!brandMenu.contains(event.target)) closeBrandMenu();
        if (desktopGroup && !desktopNav.contains(event.target))
          setDesktopMenu(null);
        if (!mobileSectionToggle.parentElement.contains(event.target)) {
          setMobileSectionOptions(false);
        }
        if (!themeToggle.parentElement.contains(event.target))
          setThemeOptions(false);
      });

      document.addEventListener("keydown", (event) => {
        if (
          event.key !== "Escape" ||
          privacyDialog.open ||
          brandGuidelines.open
        )
          return;

        if (!brandMenu.hidden) {
          closeBrandMenu(true);
        } else if (!themeOptions.hidden) {
          setThemeOptions(false, true);
        } else if (!mobileSectionOptions.hidden) {
          setMobileSectionOptions(false, true);
        } else if (!mobileMenu.hidden) {
          setMobileMenu(false, true);
        } else if (desktopGroup) {
          const trigger = desktopTriggers.find(
            (button) => button.dataset.navTrigger === desktopGroup,
          );
          setDesktopMenu(null);
          trigger.focus();
        }
      });
    },
    { once: true },
  );
})();

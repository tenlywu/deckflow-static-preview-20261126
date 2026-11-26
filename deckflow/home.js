
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          const root = document.documentElement;
          const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
          const frameworkName = document.querySelector("#framework-name");
          const hoverInput = matchMedia("(any-hover: hover)");
          const showcase = document.querySelector("#dashboard");
          const showcaseVideos = Array.from(showcase.querySelectorAll("video"));
          let showcaseInView = false;

          function updateShowcasePlayback() {
            showcaseVideos.forEach((video) => {
              const panel = video.closest("[role=tabpanel]");
              const play =
                showcaseInView &&
                !reducedMotion.matches &&
                !document.hidden &&
                !panel.hidden;

              if (!play) {
                video.pause();
                return;
              }

              const theme = root.dataset.theme;
              const source =
                theme === "light"
                  ? video.dataset.videoLight
                  : video.dataset.videoDark;
              if (video.getAttribute("src") !== source) {
                const poster = panel.querySelector(
                  `img[data-theme-media="${theme}"]`,
                );
                video.poster = poster.currentSrc || poster.src;
                video.dataset.themeMedia = theme;
                video.src = source;
              }
              video.play().catch(() => {
                // The static image remains underneath the video when playback is unavailable.
              });
            });
          }

          const showcaseObserver = new IntersectionObserver(
            ([entry]) => {
              showcaseInView = entry.isIntersecting;
              updateShowcasePlayback();
            },
            { threshold: 0.12 },
          );
          showcaseObserver.observe(showcase.querySelector(".aspect-video"));
          reducedMotion.addEventListener("change", updateShowcasePlayback);
          document.addEventListener("visibilitychange", updateShowcasePlayback);
          new MutationObserver(updateShowcasePlayback).observe(root, {
            attributeFilter: ["data-theme"],
          });

          document
            .querySelectorAll(
              "#dashboard [role=tablist], #frameworks [role=tablist]",
            )
            .forEach((tablist) => {
              const isFrameworkSwitcher =
                tablist.closest("#frameworks") !== null;
              const tabs = Array.from(tablist.querySelectorAll("[role=tab]"));
              const panels = tabs.map((tab) =>
                document.getElementById(tab.getAttribute("aria-controls")),
              );

              function selectTab(index) {
                if (tabs[index].getAttribute("aria-selected") === "true")
                  return;

                tabs.forEach((tab, position) => {
                  const selected = position === index;
                  tab.setAttribute("aria-selected", selected);
                  tab.tabIndex = selected ? 0 : -1;
                  panels[position].hidden = !selected;
                });

                if (isFrameworkSwitcher) {
                  const framework = tabs[index].getAttribute("aria-label");
                  frameworkName.textContent = framework;
                } else {
                  updateShowcasePlayback();
                }
              }

              tabs.forEach((tab, index) => {
                if (isFrameworkSwitcher) {
                  tab.addEventListener("pointerenter", (event) => {
                    if (
                      event.pointerType === "mouse" ||
                      (event.pointerType === "pen" && event.buttons === 0)
                    ) {
                      selectTab(index);
                    }
                  });
                }
                tab.addEventListener("click", (event) => {
                  const contact =
                    event.pointerType === "touch" ||
                    event.pointerType === "pen";
                  if (
                    !isFrameworkSwitcher ||
                    event.detail === 0 ||
                    contact ||
                    (!event.pointerType && !hoverInput.matches)
                  ) {
                    selectTab(index);
                  }
                });
                tab.addEventListener("keydown", (event) => {
                  let next;
                  switch (event.key) {
                    case "ArrowRight":
                      next = (index + 1) % tabs.length;
                      break;
                    case "ArrowLeft":
                      next = (index + tabs.length - 1) % tabs.length;
                      break;
                    case "Home":
                      next = 0;
                      break;
                    case "End":
                      next = tabs.length - 1;
                      break;
                    default:
                      return;
                  }

                  event.preventDefault();
                  selectTab(next);
                  tabs[next].focus();
                });
              });
            });

          const storyLayouts = Array.from(
            document.querySelectorAll("[data-story-layout]"),
          );
          function selectStory(index) {
            storyLayouts.forEach((layout) => {
              Array.from(layout.children).forEach((card, position) => {
                const selected = index === position;
                card.toggleAttribute("data-active", selected);
                card
                  .querySelector(".story-trigger")
                  .setAttribute("aria-expanded", selected);
                card.querySelector("[data-story-detail]").inert = !selected;
              });
            });
          }

          storyLayouts.forEach((layout) => {
            Array.from(layout.children).forEach((card, index) => {
              card
                .querySelector(".story-trigger")
                .addEventListener("click", () => selectStory(index));
              if (layout.dataset.storyLayout === "desktop") {
                card.addEventListener("pointerenter", (event) => {
                  if (event.pointerType === "mouse") selectStory(index);
                });
              }
            });
          });
        },
        { once: true },
      );
    

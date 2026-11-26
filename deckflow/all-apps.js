
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          const { message, countMessage } = window.deckFlowCopy;
          const category = document.querySelector("#library-category");
          const filters = [...category.querySelectorAll("[data-library-filter]")];
          const cardSelector = ".library-card, .library-tool-card";
          const categories = new Set(filters.map((filter) => filter.dataset.libraryFilter));
          const groups = [...document.querySelectorAll("[data-library-group]")];
          const status = document.querySelector("#library-catalog-status");
          const libraryLinks = document.querySelector(".library-end");
          const trigger = document.querySelector("#library-search-trigger");
          const dialog = document.querySelector("#library-search");
          const input = document.querySelector("#library-search-input");
          const resultList = document.querySelector("#library-search-results");
          const searchStatus = document.querySelector("#library-search-status");
          const cards = [...document.querySelectorAll(cardSelector)].map((card) => {
            const title = card.querySelector("h3").textContent;
            const description = card.querySelector(".library-card-copy > p").textContent;
            const group = card
              .closest("[data-library-group]")
              .querySelector("h2").textContent;
            return {
              title,
              description,
              link: card.href,
              keywords: (title + " " + description + " " + group).toLowerCase(),
            };
          });

          function filterCategory(active) {
            let total = 0;
            for (const group of groups) {
              group.hidden = active !== "all" && active !== group.dataset.libraryGroup;
              if (!group.hidden) total += group.querySelectorAll(cardSelector).length;
            }
            for (const filter of filters) {
              filter.setAttribute(
                "aria-pressed",
                String(filter.dataset.libraryFilter === active),
              );
            }
            libraryLinks.hidden = groups.some((group) =>
              group.dataset.libraryGroup === active && group.querySelector(".library-tool-card"),
            );
            status.textContent = countMessage("ui.library.found", total);
          }

          function searchLibrary() {
            const terms = input.value.trim().toLowerCase().split(/\s+/);
            const matches = cards.filter((card) =>
              terms.every((word) => card.keywords.includes(word)),
            );
            const results = matches.map(({ title, description, link }) => {
              const item = document.createElement("li");
              const anchor = document.createElement("a");
              const summary = document.createElement("small");
              anchor.href = link;
              anchor.textContent = title;
              summary.textContent = description;
              anchor.append(summary);
              item.append(anchor);
              return item;
            });
            if (!results.length) {
              const empty = document.createElement("li");
              empty.textContent = message("ui.library.no-results");
              results.push(empty);
            }
            resultList.replaceChildren(...results);
            searchStatus.textContent =
              countMessage("ui.library.found", matches.length);
          }

          function openSearch() {
            input.value = "";
            searchLibrary();
            dialog.showModal();
            input.focus();
          }

          function readCategory() {
            const selected = new URLSearchParams(location.search).get("category");
            filterCategory(categories.has(selected) ? selected : "all");
          }

          category.hidden = false;
          trigger.hidden = false;
          readCategory();
          window.addEventListener("popstate", readCategory);
          for (const filter of filters) {
            filter.addEventListener("click", () => {
              const active = filter.dataset.libraryFilter;
              const url = new URL(location.href);
              if (active === "all") url.searchParams.delete("category");
              else url.searchParams.set("category", active);
              if (url.href !== location.href) history.pushState(null, "", url);
              filterCategory(active);
            });
          }
          trigger.addEventListener("click", openSearch);
          dialog.addEventListener("close", () => trigger.focus());
          input.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !event.isComposing) {
              event.preventDefault();
              event.stopPropagation();
              dialog.close();
            }
          });
          input.addEventListener("input", (event) => {
            if (!event.isComposing) searchLibrary();
          });
          input.addEventListener("compositionend", searchLibrary);

          document.addEventListener("keydown", (event) => {
            if (
              (event.metaKey || event.ctrlKey) &&
              event.key.toLowerCase() === "k" &&
              !document.querySelector("dialog[open], #mobile-menu:not([hidden])")
            ) {
              event.preventDefault();
              openSearch();
            }
          });
        },
        { once: true },
      );
    

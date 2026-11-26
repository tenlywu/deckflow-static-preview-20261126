
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          const { message } = window.deckFlowCopy;
          const main = document.querySelector(".pricing-page");
          const picker = document.querySelector("#comparison-plan");
          const planComparison = main.querySelector(".pricing-compare");
          const compactComparison = matchMedia("(max-width: 63.999rem)");
          const featureGroups = planComparison.querySelectorAll(
            ".pricing-feature-category th",
          );
          picker.closest("label").hidden = false;

          function showPlan() {
            planComparison.dataset.plan = picker.value;
            for (const heading of featureGroups) {
              heading.colSpan = compactComparison.matches ? 2 : 5;
            }
          }

          picker.addEventListener("change", showPlan);
          compactComparison.addEventListener("change", showPlan);
          showPlan();

          const copy = main.querySelector("[data-copy-pricing]");
          const copyStatus = document.querySelector("#pricing-copy-status");

          function pricingMarkdown() {
            return Array.from(main.querySelectorAll("h1, h2, h3, h4, p, li, summary, tr"))
              .filter((element) => !element.closest("[hidden]"))
              .map((element) => {
                const text = element.textContent.trim().replace(/\s+/g, " ");
                if (element.matches("tr")) {
                  const cells = Array.from(element.cells, (cell) =>
                    cell.innerText.trim().replace(/\s+/g, " "),
                  );
                  return "- " + cells.filter(Boolean).join(" | ");
                }
                if (element.matches("li")) return "- " + text;
                if (element.matches("summary")) return "### " + text;
                if (/^H[1-4]$/.test(element.tagName))
                  return "#".repeat(Number(element.tagName[1])) + " " + text;
                return text;
              })
              .filter(Boolean)
              .join("\n\n");
          }

          copy.hidden = false;
          copy.addEventListener("click", async () => {
            const markdown = pricingMarkdown();
            try {
              await navigator.clipboard.writeText(markdown);
              copyStatus.textContent = message("ui.pricing.copied");
            } catch {
              const fallback = document.createElement("textarea");
              fallback.className = "sr-only";
              fallback.value = markdown;
              document.body.append(fallback);
              fallback.select();
              const copied = document.execCommand("copy");
              fallback.remove();
              copy.focus();
              copyStatus.textContent = copied
                ? message("ui.pricing.copied")
                : message("ui.pricing.copy-unavailable");
            }
          });
        },
        { once: true },
      );
    

(() => {
  "use strict";

  const tablist = document.querySelector(".depot-tabs");
  const tabs = [...tablist.querySelectorAll("a")];
  const panels = tabs.map(tab => document.querySelector(tab.hash));

  function selectDepot(index, focus = false) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  }

  // Links and all five panels remain usable if JavaScript is unavailable.
  tablist.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener("click", event => {
      event.preventDefault();
      selectDepot(index);
    });
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectDepot(next, true);
    });
  });
  function selectHashDepot() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    if (index !== -1) selectDepot(index);
    return index;
  }
  if (selectHashDepot() === -1) selectDepot(0);
  window.addEventListener("hashchange", selectHashDepot);

  function bindDialog(modal, onClose) {
    modal.addEventListener("keydown", event => {
      if (event.key !== "Tab") return;
      const controls = [...modal.querySelectorAll("button:not(:disabled)")].filter(button => button.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    modal.addEventListener("click", event => {
      if (event.target !== modal) return;
      const bounds = modal.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close();
    });
    modal.addEventListener("close", () => {
      document.documentElement.classList.toggle("viewer-open", Boolean(document.querySelector("dialog[open]")));
      onClose();
    });
  }

  const dialog = document.querySelector(".gallery-dialog");
  if (typeof dialog.showModal !== "function") return;

  const galleryLinks = [...document.querySelectorAll("[data-gallery]")];
  const viewerImage = document.getElementById("viewer-image");
  const viewerCaption = document.getElementById("viewer-caption");
  const viewerCount = document.getElementById("viewer-count");
  const closeButton = document.getElementById("viewer-close");
  let imageIndex = 0;
  let opener;

  function showImage(index) {
    imageIndex = (index + galleryLinks.length) % galleryLinks.length;
    const link = galleryLinks[imageIndex];
    viewerImage.src = link.href;
    viewerImage.alt = link.querySelector("img").alt;
    viewerCaption.textContent = link.dataset.caption;
    viewerCount.textContent = `${imageIndex + 1} / ${galleryLinks.length}`;
  }

  galleryLinks.forEach((link, index) => {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      showImage(index);
      dialog.showModal();
      document.documentElement.classList.add("viewer-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", () => dialog.close());
  document.getElementById("viewer-prev").addEventListener("click", () => showImage(imageIndex - 1));
  document.getElementById("viewer-next").addEventListener("click", () => showImage(imageIndex + 1));
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(imageIndex + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });
  bindDialog(dialog, () => opener?.focus({ preventScroll: true }));

  const spoiler = document.getElementById("spoiler-dialog");
  const spoilerOpen = document.getElementById("spoiler-open");
  const warning = document.getElementById("spoiler-warning");
  const preview = document.getElementById("spoiler-preview");
  const media = document.getElementById("spoiler-media");
  const caption = document.getElementById("spoiler-caption");
  const cancel = document.getElementById("spoiler-cancel");
  const spoilerClose = document.getElementById("spoiler-close");

  function resetSpoiler() {
    media.replaceChildren();
    caption.textContent = "";
    preview.hidden = true;
    warning.hidden = false;
  }

  spoilerOpen.hidden = false;
  spoilerOpen.addEventListener("click", () => {
    resetSpoiler();
    spoiler.showModal();
    document.documentElement.classList.add("viewer-open");
    cancel.focus();
  });
  cancel.addEventListener("click", () => spoiler.close());
  spoilerClose.addEventListener("click", () => spoiler.close());
  document.getElementById("spoiler-consent").addEventListener("click", () => {
    warning.hidden = true;
    preview.hidden = false;
    caption.textContent = "Chargement de l’aperçu…";
    // No image element, request or preload exists before this explicit consent.
    const image = new Image(1600, 1000);
    image.alt = "La voiture panoramique du Grand Train Européen, avec sa toiture vitrée et sa livrée sombre et or.";
    image.addEventListener("load", () => {
      if (image.isConnected) caption.textContent = "Grand Train Européen · Voiture panoramique · Modèle du jeu en version Alpha.";
    });
    image.addEventListener("error", () => {
      if (image.isConnected) caption.textContent = "L’aperçu n’a pas pu être chargé. Fermez cette fenêtre pour réessayer.";
    });
    media.replaceChildren(image);
    image.src = "./assets/grand-train-panorama.webp";
    spoilerClose.focus();
  });
  bindDialog(spoiler, () => {
    resetSpoiler();
    spoilerOpen.focus({ preventScroll: true });
  });
})();

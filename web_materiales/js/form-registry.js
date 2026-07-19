(function () {
  // Los datos son un bien publico: el registro sirve para estadisticas de uso,
  // no como control de acceso. Por eso la descarga se entrega igual aunque el
  // endpoint de registro no este configurado o falle.
  const DOWNLOAD_FILES = {
    es: "downloads/es_chile_2022_dea_cuentas_economicas.zip",
    en: "downloads/en_chile_2022_dea_economic_accounts.zip"
  };

  function language() {
    return document.documentElement.lang === "en" ? "en" : "es";
  }

  function message(key) {
    const en = language() === "en";
    const copy = {
      chooseReason: en ? "Choose at least one reason for contact." : "Selecciona al menos un motivo de contacto.",
      unavailable: en ? "The registration service has not been configured yet." : "El servicio de registro aún no está configurado.",
      sending: en ? "Sending information…" : "Enviando información…",
      success: en ? "Your information was registered successfully." : "Tu información fue registrada correctamente.",
      failed: en ? "We could not register your information. Please try again later." : "No fue posible registrar tu información. Inténtalo nuevamente más tarde.",
      downloadReady: en ? "Your information was registered. The download will start automatically." : "Tu información fue registrada. La descarga comenzará automáticamente.",
      downloadOnly: en ? "We could not register your information, but the download will start automatically." : "No fue posible registrar tu información, pero la descarga comenzará automáticamente."
    };
    return copy[key];
  }

  function startDownload() {
    const link = document.createElement("a");
    link.href = DOWNLOAD_FILES[language()];
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function status(form, text, state) {
    const node = form.querySelector(".registry-status");
    if (!node) return;
    node.textContent = text;
    node.classList.toggle("is-error", state === "error");
    node.classList.toggle("is-success", state === "success");
  }

  function toggleOtherField(form, sourceName) {
    const source = form.querySelector('[name="' + sourceName + '"]');
    const field = form.querySelector('[data-other-field="' + sourceName + '"]');
    if (!field) return;
    const selectedOther = sourceName === "motivos_contacto"
      ? Array.from(form.querySelectorAll('[name="motivos_contacto"]')).some((input) => input.checked && input.value === "Otros")
      : source && source.value === "Otros";
    field.hidden = !selectedOther;
    const input = field.querySelector("input");
    if (input) input.required = selectedOther;
  }

  function payloadFor(form, kind) {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.registro_id = globalThis.crypto?.randomUUID?.() || String(Date.now());
    payload.fecha_hora_utc = new Date().toISOString();
    payload.idioma = language();
    payload.origen = window.location.href;
    payload.formulario = kind === "contact" ? "contacto" : "descargas";
    if (kind === "contact") {
      payload.motivos_contacto = Array.from(form.querySelectorAll('[name="motivos_contacto"]:checked'))
        .map((input) => input.value)
        .join("; ");
    }
    return payload;
  }

  function bind(form) {
    const kind = form.dataset.registryKind;
    form.querySelectorAll("select, input[type=checkbox]").forEach((input) => {
      input.addEventListener("change", () => {
        toggleOtherField(form, "uso_datos");
        toggleOtherField(form, "motivos_contacto");
      });
    });
    toggleOtherField(form, "uso_datos");
    toggleOtherField(form, "motivos_contacto");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const reasonInputs = form.querySelectorAll('[name="motivos_contacto"]');
      if (reasonInputs.length && !Array.from(reasonInputs).some((input) => input.checked)) {
        status(form, message("chooseReason"), "error");
        reasonInputs[0].focus();
        return;
      }
      if (!form.reportValidity()) return;

      const isDownload = kind === "downloads";
      const endpoint = window.CED_FORM_ENDPOINTS?.[kind];
      if (!endpoint && !isDownload) {
        status(form, message("unavailable"), "error");
        return;
      }

      const button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;

      let registered = false;
      if (endpoint) {
        status(form, message("sending"));
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadFor(form, kind))
          });
          if (!response.ok) throw new Error("Registry endpoint returned " + response.status);
          registered = true;
        } catch (error) {
          console.error("CED registry submission failed", error);
        }
      }

      if (registered) {
        form.reset();
        toggleOtherField(form, "uso_datos");
        toggleOtherField(form, "motivos_contacto");
      }

      if (isDownload) {
        status(form, message(registered ? "downloadReady" : "downloadOnly"), registered ? "success" : "error");
        startDownload();
      } else {
        status(form, message(registered ? "success" : "failed"), registered ? "success" : "error");
      }

      if (button) button.disabled = false;
    });
  }

  document.querySelectorAll("[data-registry-kind]").forEach(bind);
})();

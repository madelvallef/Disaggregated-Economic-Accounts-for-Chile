(function () {
  "use strict";

  /*
   * Interruptor temporal de descargas.
   *
   * false:
   * - Envía y registra los datos.
   * - No descarga el archivo ZIP.
   *
   * true:
   * - Envía y registra los datos.
   * - Descarga el ZIP solamente si el registro responde status: "ok".
   */
  const DOWNLOADS_ENABLED = false;

  const DOWNLOAD_FILES = {
    es: "downloads/es_chile_2022_dea_cuentas_economicas.zip",
    en: "downloads/en_chile_2022_dea_economic_accounts.zip"
  };

  function language() {
    const documentLanguage = String(
      document.documentElement.lang || "es"
    )
      .trim()
      .toLowerCase();

    return documentLanguage.startsWith("en") ? "en" : "es";
  }

  function message(key) {
    const en = language() === "en";

    const copy = {
      chooseReason: en
        ? "Choose at least one reason for contact."
        : "Selecciona al menos un motivo de contacto.",

      unavailable: en
        ? "The registration service has not been configured yet."
        : "El servicio de registro aún no está configurado.",

      sending: en
        ? "Sending information…"
        : "Enviando información…",

      success: en
        ? "Your information was registered successfully."
        : "Tu información fue registrada correctamente.",

      failed: en
        ? "We could not register your information. Please try again later."
        : "No fue posible registrar tu información. Inténtalo nuevamente más tarde.",

      downloadReady: en
        ? "Your information was registered. The download will start automatically."
        : "Tu información fue registrada. La descarga comenzará automáticamente.",

      registeredWithoutDownload: en
        ? "Your information was registered successfully, but downloads are temporarily unavailable."
        : "Tu información fue registrada correctamente, pero las descargas no están disponibles temporalmente.",

      downloadFailed: en
        ? "We could not register your information, so the download could not start."
        : "No fue posible registrar tu información, por lo tanto la descarga no pudo comenzar."
    };

    return copy[key] || "";
  }

  function startDownload() {
    const file = DOWNLOAD_FILES[language()];

    if (!file) {
      console.error("CED download file is not configured.");
      return;
    }

    const link = document.createElement("a");

    link.href = file;
    link.download = "";
    link.hidden = true;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function status(form, text, state) {
    const node = form.querySelector(".registry-status");

    if (!node) {
      return;
    }

    node.textContent = text;

    node.classList.toggle(
      "is-error",
      state === "error"
    );

    node.classList.toggle(
      "is-success",
      state === "success"
    );

    node.setAttribute(
      "role",
      state === "error"
        ? "alert"
        : "status"
    );
  }

  function toggleOtherField(form, sourceName) {
    const field = form.querySelector(
      `[data-other-field="${sourceName}"]`
    );

    if (!field) {
      return;
    }

    let selectedOther = false;

    if (sourceName === "motivos_contacto") {
      selectedOther = Array.from(
        form.querySelectorAll(
          '[name="motivos_contacto"]'
        )
      ).some((input) => {
        return (
          input.checked &&
          String(input.value)
            .trim()
            .toLowerCase() === "otros"
        );
      });
    } else {
      const source = form.querySelector(
        `[name="${sourceName}"]`
      );

      selectedOther =
        source &&
        String(source.value)
          .trim()
          .toLowerCase() === "otros";
    }

    field.hidden = !selectedOther;

    field
      .querySelectorAll(
        "input, textarea, select"
      )
      .forEach((input) => {
        input.required = selectedOther;

        if (!selectedOther) {
          if (
            input instanceof HTMLInputElement ||
            input instanceof HTMLTextAreaElement
          ) {
            input.value = "";
          }

          if (
            input instanceof HTMLSelectElement
          ) {
            input.selectedIndex = 0;
          }
        }
      });
  }

  function getFormAction(form) {
    const action = String(
      form.querySelector(
        'input[name="formulario"]'
      )?.value || ""
    )
      .trim()
      .toLowerCase();

    if (
      action !== "descargas" &&
      action !== "contacto"
    ) {
      throw new Error(
        `Formulario no reconocido: "${action}"`
      );
    }

    return action;
  }

  function payloadFor(form) {
    const formData = new FormData(form);
    const payload = {};

    formData.forEach((value, key) => {
      if (typeof value !== "string") {
        return;
      }

      const cleanValue = value.trim();

      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          key
        )
      ) {
        payload[key] += `; ${cleanValue}`;
      } else {
        payload[key] = cleanValue;
      }
    });

    /*
     * Se obtiene directamente desde:
     *
     * <input
     *   type="hidden"
     *   name="formulario"
     *   value="descargas"
     * >
     */
    payload.formulario = getFormAction(form);

    payload.registro_id =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

    payload.fecha_hora_utc =
      new Date().toISOString();

    payload.idioma = String(
      form.querySelector(
        '[name="idioma"]'
      )?.value || language()
    )
      .trim()
      .toLowerCase();

    payload.origen = window.location.href;

    /*
     * Agrupa los checkbox seleccionados del formulario
     * de contacto en un único valor.
     */
    const selectedReasons = Array.from(
      form.querySelectorAll(
        '[name="motivos_contacto"]:checked'
      )
    )
      .map((input) =>
        String(input.value).trim()
      )
      .filter(Boolean);

    if (selectedReasons.length) {
      payload.motivos_contacto =
        selectedReasons.join("; ");
    }

    return payload;
  }

  function encodePayload(payload) {
    const body = new URLSearchParams();

    Object.entries(payload).forEach(
      ([key, value]) => {
        body.append(
          key,
          value == null
            ? ""
            : String(value)
        );
      }
    );

    return body;
  }

  async function parseResponse(response) {
    const rawText = await response.text();

    /*
     * Elimina un posible BOM, espacios y saltos de línea.
     */
    const cleanText = rawText
      .replace(/^\uFEFF/, "")
      .trim();

    if (!cleanText) {
      throw new Error(
        "Registry endpoint returned an empty response"
      );
    }

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      console.error(
        "CED registry invalid response:",
        cleanText
      );

      throw new Error(
        "Registry endpoint did not return valid JSON"
      );
    }
  }

  async function submitRegistry(
    endpoint,
    payload
  ) {
    const body = encodePayload(payload);


    const response = await fetch(
      endpoint,
      {
        method: "POST",

        /*
         * URLSearchParams envía:
         *
         * application/x-www-form-urlencoded;charset=UTF-8
         *
         * Google Apps Script puede leerlo desde e.parameter.
         */
        body
      }
    );

    if (!response.ok) {
      throw new Error(
        `Registry endpoint returned HTTP ${response.status}`
      );
    }

    const result = await parseResponse(
      response
    );

    const resultStatus = String(
      result?.status || ""
    )
      .trim()
      .toLowerCase();

    if (resultStatus !== "ok") {
      throw new Error(
        result?.mensaje ||
        result?.message ||
        "Registry endpoint returned an invalid status"
      );
    }

    return result;
  }

  function validateContactReasons(form) {
    const reasonInputs =
      form.querySelectorAll(
        '[name="motivos_contacto"]'
      );

    if (!reasonInputs.length) {
      return true;
    }

    const selected = Array.from(
      reasonInputs
    ).some((input) => input.checked);

    if (selected) {
      return true;
    }

    status(
      form,
      message("chooseReason"),
      "error"
    );

    reasonInputs[0].focus();

    return false;
  }

  function setButtonDisabled(
    button,
    disabled
  ) {
    if (!button) {
      return;
    }

    button.disabled = disabled;

    if (disabled) {
      button.setAttribute(
        "aria-disabled",
        "true"
      );
    } else {
      button.removeAttribute(
        "aria-disabled"
      );
    }
  }

  function resetForm(form) {
    form.reset();

    toggleOtherField(
      form,
      "uso_datos"
    );

    toggleOtherField(
      form,
      "motivos_contacto"
    );
  }

  function bind(form) {
    const registryKind = String(
      form.dataset.registryKind || ""
    )
      .trim()
      .toLowerCase();

    if (!registryKind) {
      console.warn(
        "CED registry form has no data-registry-kind:",
        form
      );

      return;
    }

    form
      .querySelectorAll(
        [
          "select",
          "input[type='checkbox']",
          "input[type='radio']"
        ].join(", ")
      )
      .forEach((input) => {
        input.addEventListener(
          "change",
          () => {
            toggleOtherField(
              form,
              "uso_datos"
            );

            toggleOtherField(
              form,
              "motivos_contacto"
            );
          }
        );
      });

    toggleOtherField(
      form,
      "uso_datos"
    );

    toggleOtherField(
      form,
      "motivos_contacto"
    );

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (!validateContactReasons(form)) {
          return;
        }

        if (!form.reportValidity()) {
          return;
        }

        let formAction;

        try {
          formAction = getFormAction(form);
        } catch (error) {
          console.error(
            "CED registry invalid form:",
            error
          );

          status(
            form,
            message("failed"),
            "error"
          );

          return;
        }

        const isDownload =
          formAction === "descargas";

        /*
         * data-registry-kind utiliza:
         *
         * downloads
         * contact
         */
        const endpoint =
          window.CED_FORM_ENDPOINTS?.[
            registryKind
          ];

        /*
         * El endpoint siempre es necesario, incluso cuando
         * la descarga está temporalmente deshabilitada,
         * porque los datos sí deben registrarse.
         */
        if (!endpoint) {
          status(
            form,
            message("unavailable"),
            "error"
          );

          return;
        }

        const button =
          form.querySelector(
            '[type="submit"]'
          );

        setButtonDisabled(
          button,
          true
        );

        let registered = false;

        try {
          status(
            form,
            message("sending")
          );

          const payload =
            payloadFor(form);

          await submitRegistry(
            endpoint,
            payload
          );

          registered = true;
        } catch (error) {
          console.error(
            "CED registry submission failed",
            error
          );
        } finally {
          /*
           * Solo se limpia el formulario cuando Apps Script
           * confirma que los datos fueron registrados.
           */
          if (registered) {
            resetForm(form);
          }

          if (isDownload) {
            if (!registered) {
              /*
               * El registro falló.
               * No se descarga el archivo.
               */
              status(
                form,
                message("downloadFailed"),
                "error"
              );
            } else if (
              !DOWNLOADS_ENABLED
            ) {
              /*
               * Los datos fueron registrados correctamente,
               * pero la descarga está bloqueada temporalmente.
               */
              status(
                form,
                message(
                  "registeredWithoutDownload"
                ),
                "success"
              );
            } else {
              /*
               * Los datos fueron registrados correctamente
               * y las descargas están habilitadas.
               */
              status(
                form,
                message("downloadReady"),
                "success"
              );

              startDownload();
            }
          } else {
            status(
              form,
              message(
                registered
                  ? "success"
                  : "failed"
              ),
              registered
                ? "success"
                : "error"
            );
          }

          setButtonDisabled(
            button,
            false
          );
        }
      }
    );
  }

  function initialize() {
    document
      .querySelectorAll(
        "[data-registry-kind]"
      )
      .forEach((form) => {
        if (
          form instanceof HTMLFormElement
        ) {
          bind(form);
        }
      });
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();
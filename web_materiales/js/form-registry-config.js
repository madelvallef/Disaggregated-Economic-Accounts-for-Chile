// Endpoint de Google Apps Script utilizado por ambos formularios.
// Puede sobrescribirse antes de cargar este archivo mediante window.CED_FORM_ENDPOINTS.
const CED_GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqImTOjfnSeasOt8q4-AmfbQytf94eV9crlUp3-Alre_mmGIzaYPhDe8OrBg0mtWho/exec";

window.CED_FORM_ENDPOINTS = Object.assign({
  contact: CED_GOOGLE_SCRIPT_URL,
  downloads: CED_GOOGLE_SCRIPT_URL
}, window.CED_FORM_ENDPOINTS || {});
